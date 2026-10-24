import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import makeWASocket, {
  DisconnectReason,
  initAuthCreds,
  BufferJSON
} from '@whiskeysystems/baileys';
import {
  clearSession,
  getSettings,
  loadSession,
  saveMessage,
  saveSession,
  saveSettings
} from './supabase.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_ID = process.env.SESSION_ID || 'default-session';
const KEEPALIVE_URL = process.env.RENDER_EXTERNAL_URL || process.env.KEEPALIVE_URL;
const API_TOKEN = process.env.API_TOKEN;
const KEEPALIVE_INTERVAL_MS = 10 * 60 * 1000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(['/qr', '/send', '/settings', '/disconnect'], (req, res, next) => {
  if (!API_TOKEN) {
    return res.status(503).json({ ok: false, message: 'API_TOKEN is not configured' });
  }
  if (req.headers.authorization !== `Bearer ${API_TOKEN}`) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  return next();
});

let sock = null;
let qrCode = null;
let status = 'disconnected';
let reconnectTimer = null;
let connecting = false;

function serializeAuth(value) {
  return JSON.parse(JSON.stringify(value, BufferJSON.replacer));
}

function deserializeAuth(value) {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  return JSON.parse(serialized, BufferJSON.reviver);
}

function createAuthState(session) {
  const creds = session?.creds ? deserializeAuth(session.creds) : initAuthCreds();
  const storedKeys = session?.keys ? deserializeAuth(session.keys) : {};
  const keys = {
    ...storedKeys,
    get: async (type, ids) => {
      const category = storedKeys[type] || {};
      return Object.fromEntries(
        ids.filter((id) => category[id] !== undefined).map((id) => [id, category[id]])
      );
    },
    set: async (data) => {
      for (const [type, entries] of Object.entries(data)) {
        storedKeys[type] ||= {};
        for (const [id, value] of Object.entries(entries)) {
          if (value === null) {
            delete storedKeys[type][id];
          } else {
            storedKeys[type][id] = value;
          }
        }
      }

      await saveSession(SESSION_ID, serializeAuth(creds), serializeAuth(storedKeys));
    }
  };

  return { creds, keys, storedKeys };
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectWA();
  }, 5000);
}

function startKeepAlive() {
  if (!KEEPALIVE_URL) {
    console.log('RENDER_EXTERNAL_URL not set. Skipping keep-alive ping.');
    return;
  }

  const healthUrl = `${KEEPALIVE_URL.replace(/\/+$/, '')}/health`;
  const ping = async () => {
    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'MadzzoChatApp-Render-KeepAlive' }
      });
      console.log(`Keep-alive ping: ${response.status}`);
    } catch (error) {
      console.error('Keep-alive ping error:', error);
    }
  };

  void ping();
  setInterval(() => void ping(), KEEPALIVE_INTERVAL_MS);
}

async function connectWA() {
  if (connecting) return;
  connecting = true;
  status = 'connecting';

  try {
    const stored = await loadSession(SESSION_ID);
    const authState = createAuthState(stored);
    const socket = makeWASocket({
      printQRInTerminal: false,
      browser: ['MadzzoChatApp', 'Chrome', '1.0.0'],
      auth: { creds: authState.creds, keys: authState.keys }
    });

    sock = socket;

    socket.ev.on('connection.update', async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        qrCode = BufferJSON.stringify(qr);
        status = 'qr';
      }

      if (connection === 'open') {
        status = 'connected';
        qrCode = null;
      }

      if (connection === 'close') {
        if (sock === socket) sock = null;
        status = 'disconnected';
        qrCode = null;

        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          try {
            await clearSession(SESSION_ID);
          } catch (error) {
            console.error('Failed to clear logged-out session:', error);
          }
        }
        scheduleReconnect();
      }
    });

    socket.ev.on('creds.update', async () => {
      try {
        await saveSession(
          SESSION_ID,
          serializeAuth(authState.creds),
          serializeAuth(authState.storedKeys)
        );
      } catch (error) {
        console.error('Failed to persist WhatsApp credentials:', error);
      }
    });

    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const message of messages) {
        const sender = message.key?.remoteJid;
        if (!message.message || message.key?.fromMe || !sender) continue;

        const isPrivateChat =
          (sender.endsWith('@s.whatsapp.net') || sender.endsWith('@lid')) &&
          !sender.endsWith('@broadcast');
        const envelope = message.message;
        const isViewOnce = Boolean(
          envelope.viewOnceMessage ||
          envelope.viewOnceMessageV2 ||
          envelope.viewOnceMessageV2Extension
        );
        const content =
          envelope.viewOnceMessage?.message ||
          envelope.viewOnceMessageV2?.message ||
          envelope.viewOnceMessageV2Extension?.message ||
          envelope;
        const body =
          content.conversation ||
          content.extendedTextMessage?.text ||
          content.imageMessage?.caption ||
          content.videoMessage?.caption ||
          '';
        const media =
          content.imageMessage ||
          content.videoMessage ||
          content.audioMessage ||
          content.documentMessage ||
          content.stickerMessage;

        if (isPrivateChat) {
          try {
            await saveMessage({
              from_jid: sender,
              to_jid: socket.user?.id || null,
              body,
              media_type: media
                ? Object.keys(content).find((key) => key.endsWith('Message'))
                : null,
              timestamp: message.messageTimestamp
                ? new Date(Number(message.messageTimestamp) * 1000).toISOString()
                : new Date().toISOString(),
              is_view_once: isViewOnce || Boolean(media?.viewOnce)
            });
          } catch (error) {
            console.error('Failed to save incoming message:', error);
          }
        }

        if (!isPrivateChat) continue;

        try {
          const settings = await getSettings();
          if (settings.auto_reply) {
            await socket.sendMessage(sender, {
              text: settings.auto_reply_message
            });
          }
        } catch (error) {
          console.error('Auto reply error:', error);
        }
      }
    });
  } catch (error) {
    status = 'disconnected';
    console.error('WA connect error:', error);
    scheduleReconnect();
  } finally {
    connecting = false;
  }
}

app.get('/health', (req, res) => {
  res.json({ ok: true, status, timestamp: new Date().toISOString() });
});

app.get('/status', (req, res) => {
  res.json({
    ok: true,
    status,
    connected: status === 'connected'
  });
});

app.get('/qr', (req, res) => {
  if (!qrCode) {
    return res.status(404).json({ ok: false, message: 'QR not available yet' });
  }

  return res.json({ ok: true, qr: qrCode });
});

app.post('/send', async (req, res) => {
  try {
    const { to, text } = req.body || {};

    if (!sock || status !== 'connected') {
      return res.status(503).json({ ok: false, message: 'WhatsApp not connected' });
    }

    if (typeof to !== 'string' || typeof text !== 'string' || !to || !text) {
      return res.status(400).json({ ok: false, message: 'to and text are required' });
    }

    const result = await sock.sendMessage(to, { text });
    return res.json({ ok: true, result });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to send message' });
  }
});

app.get('/settings', async (req, res) => {
  try {
    return res.json({ ok: true, settings: await getSettings() });
  } catch (error) {
    console.error('Load settings error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to load settings' });
  }
});

app.put('/settings', async (req, res) => {
  try {
    const { auto_rvo, auto_reply, auto_reply_message } = req.body || {};
    if (
      (auto_rvo !== undefined && typeof auto_rvo !== 'boolean') ||
      typeof auto_reply !== 'boolean' ||
      (auto_reply_message !== undefined && typeof auto_reply_message !== 'string')
    ) {
      return res.status(400).json({ ok: false, message: 'Invalid settings' });
    }
    if (auto_rvo === true) {
      return res.status(400).json({
        ok: false,
        message: 'Auto-forwarding view-once media is not supported.'
      });
    }

    const updated = await saveSettings({
      auto_rvo: false,
      auto_reply,
      auto_reply_message: auto_reply_message?.trim() || 'Halo! Saya sedang menggunakan MadzzoChatApp.'
    });
    return res.json({ ok: true, settings: updated });
  } catch (error) {
    console.error('Save settings error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to save settings' });
  }
});

app.post('/disconnect', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
      sock = null;
    }
    await clearSession(SESSION_ID);
    status = 'disconnected';
    qrCode = null;
    return res.json({ ok: true, status });
  } catch (error) {
    console.error('Disconnect error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to disconnect' });
  }
});

app.listen(PORT, () => {
  console.log(`MadzzoChatApp service listening on port ${PORT}`);
  startKeepAlive();
  void connectWA();
});
