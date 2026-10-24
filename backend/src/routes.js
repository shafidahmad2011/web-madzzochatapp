import { Router } from 'express';
import { timingSafeEqual } from 'node:crypto';
import {
  getMessagesForContact,
  getRecentMessages,
  getSettings,
  loadSession,
  saveMessage,
  saveSettings
} from './supabase.js';
import { connectToWhatsApp, disconnectFromWhatsApp } from './baileys.js';
import { normalizeJid } from './jid.js';

const router = Router();

async function getSelfJid() {
  const connectedJid = normalizeJid(global.sock?.user?.id);
  if (connectedJid) return connectedJid;

  const settings = await getSettings();
  const savedJid = normalizeJid(settings.self_jid);
  if (savedJid) return savedJid;

  const storedSession = await loadSession(process.env.SESSION_ID || 'default-session');
  return normalizeJid(storedSession?.creds?.me?.id);
}

function requireApiToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  const providedToken = req.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  const authorized = Boolean(
    apiToken &&
    providedToken &&
    Buffer.byteLength(apiToken) === Buffer.byteLength(providedToken) &&
    timingSafeEqual(Buffer.from(apiToken), Buffer.from(providedToken))
  );
  if (!authorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.get('/status', (req, res) => {
  res.json({ connected: Boolean(global.sock?.user) });
});

router.post('/connect', requireApiToken, async (req, res) => {
  try {
    await connectToWhatsApp();
    return res.status(202).json({ ok: true });
  } catch (error) {
    console.error('Failed to start WhatsApp connection:', error);
    return res.status(503).json({ error: 'Failed to start WhatsApp connection' });
  }
});

router.post('/disconnect', requireApiToken, async (req, res) => {
  try {
    await disconnectFromWhatsApp();
    return res.json({ ok: true, connected: false });
  } catch (error) {
    console.error('Failed to disconnect WhatsApp:', error);
    return res.status(500).json({ error: 'Failed to disconnect WhatsApp' });
  }
});

router.get('/qr', requireApiToken, (req, res) => {
  if (!global.qrCode) {
    return res.status(404).json({ error: 'QR code is not available' });
  }
  return res.json({ qr: global.qrCode });
});

router.post('/send', requireApiToken, async (req, res) => {
  const { to, text } = req.body || {};
  const recipient = normalizeJid(to);
  if (!recipient?.endsWith('@s.whatsapp.net') || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'to and text are required' });
  }
  if (text.length > 4096) {
    return res.status(400).json({ error: 'text must be 4096 characters or fewer' });
  }

  if (!global.sock?.user) {
    return res.status(503).json({ error: 'WhatsApp is not connected' });
  }

  let result;
  try {
    result = await global.sock.sendMessage(recipient, { text: text.trim() });
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return res.status(502).json({ error: 'WhatsApp did not accept the message' });
  }

  try {
    const selfJid = normalizeJid(global.sock.user.id);
    const savedMessage = await saveMessage({
      wa_message_id: result.key.id || null,
      from_jid: selfJid,
      to_jid: recipient,
      body: text.trim(),
      media_type: null,
      timestamp: new Date().toISOString(),
      is_view_once: false
    });
    return res.json({ ok: true, result, message: savedMessage });
  } catch (error) {
    console.error('WhatsApp message sent but failed to save it:', error);
    return res.status(502).json({
      error: 'Message was sent, but could not be saved. Check the conversation before retrying.',
      messageSent: true
    });
  }
});

router.get('/messages/recent', requireApiToken, async (req, res) => {
  try {
    const messages = await getRecentMessages();
    const selfJid = await getSelfJid();
    return res.json({ messages, selfJid });
  } catch (error) {
    console.error('Failed to load recent messages:', error);
    return res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.get('/messages', requireApiToken, async (req, res) => {
  const contactJid = req.query.jid;
  if (typeof contactJid !== 'string' || !contactJid.endsWith('@s.whatsapp.net')) {
    return res.status(400).json({ error: 'A valid contact jid is required' });
  }

  try {
    const selfJid = await getSelfJid();
    if (!selfJid) {
      return res.status(503).json({ error: 'WhatsApp session is not linked yet' });
    }
    const messages = await getMessagesForContact(contactJid, selfJid);
    return res.json({ messages });
  } catch (error) {
    console.error('Failed to load conversation:', error);
    return res.status(500).json({ error: 'Failed to load conversation' });
  }
});

router.get('/settings', requireApiToken, async (req, res) => {
  try {
    return res.json({ settings: await getSettings() });
  } catch (error) {
    console.error('Failed to load WhatsApp settings:', error);
    return res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.post('/settings', requireApiToken, async (req, res) => {
  const { auto_reply, auto_reply_message } = req.body || {};
  if (
    typeof auto_reply !== 'boolean' ||
    (auto_reply_message !== undefined &&
      (typeof auto_reply_message !== 'string' || auto_reply_message.length > 240))
  ) {
    return res.status(400).json({ error: 'Invalid settings' });
  }

  try {
    const settings = await saveSettings({
      auto_reply,
      auto_reply_message:
        auto_reply_message?.trim() ||
        'Halo! Saya sedang menggunakan MadzzoChatApp.'
    });
    return res.json({ settings });
  } catch (error) {
    console.error('Failed to save WhatsApp settings:', error);
    return res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;
