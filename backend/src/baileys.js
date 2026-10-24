import makeWASocket, {
  DisconnectReason,
  normalizeMessageContent
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import { clearSession, getSettings, saveMessage, saveSelfJid } from './supabase.js';
import { useSupabaseAuthState } from './supabaseAuthState.js';
import { normalizeJid } from './jid.js';

const logger = pino({ level: 'silent' });
const reconnectDelay = 5000;

let reconnectTimer = null;
let manuallyLoggedOut = false;
let connecting = false;

global.sock = global.sock || null;
global.qrCode = global.qrCode || null;

function scheduleReconnect() {
  if (manuallyLoggedOut || reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectToWhatsApp().catch((error) => {
      console.error('WhatsApp reconnect attempt failed:', error);
    });
  }, reconnectDelay);
}

export async function connectToWhatsApp() {
  if (connecting || (global.sock && !manuallyLoggedOut)) return global.sock;

  connecting = true;
  manuallyLoggedOut = false;

  try {
    const { state, saveCreds } = await useSupabaseAuthState();
    const sock = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['MadzzoChatApp', 'Chrome', '1.0.0']
    });

    global.sock = sock;

    sock.ev.on('creds.update', async () => {
      try {
        await saveCreds();
      } catch (error) {
        console.error('Failed to save WhatsApp credentials:', error);
      }
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        global.qrCode = qr;
        qrcodeTerminal.generate(qr, { small: true });
      }
      if (connection === 'open') {
        global.qrCode = null;
        void saveSelfJid(normalizeJid(sock.user?.id)).catch((error) => {
          console.error('Failed to persist the WhatsApp account JID:', error);
        });
      }

      if (connection === 'close') {
        if (global.sock === sock) global.sock = null;
        global.qrCode = null;

        const statusCode = lastDisconnect?.error
          ? new Boom(lastDisconnect.error).output.statusCode
          : undefined;
        if (
          statusCode !== DisconnectReason.loggedOut &&
          !manuallyLoggedOut
        ) {
          scheduleReconnect();
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const message of messages) {
        const sender = normalizeJid(message.key?.remoteJid);
        if (
          !message.message ||
          message.key?.fromMe ||
          !sender?.endsWith('@s.whatsapp.net')
        ) {
          continue;
        }

        try {
          const content = normalizeMessageContent(message.message) || message.message;
          const media =
            content.imageMessage ||
            content.videoMessage ||
            content.audioMessage ||
            content.documentMessage ||
            content.stickerMessage;
          const mediaType = content.imageMessage
            ? 'image'
            : content.videoMessage
              ? 'video'
              : content.audioMessage
                ? 'audio'
                : content.documentMessage
                  ? 'document'
                  : content.stickerMessage
                    ? 'sticker'
                    : null;
          const body =
            content.conversation ||
            content.extendedTextMessage?.text ||
            content.imageMessage?.caption ||
            content.videoMessage?.caption ||
            '';

          await saveMessage({
            wa_message_id: message.key.id || null,
            from_jid: sender,
            to_jid: normalizeJid(sock.user?.id),
            body,
            media_type: mediaType,
            timestamp: message.messageTimestamp
              ? new Date(Number(message.messageTimestamp) * 1000).toISOString()
              : new Date().toISOString(),
            is_view_once: Boolean(
              content.viewOnceMessage ||
              content.viewOnceMessageV2 ||
              content.viewOnceMessageV2Extension ||
              media?.viewOnce
            )
          });
        } catch (error) {
          console.error('Failed to persist incoming WhatsApp message:', error);
        }

        try {
          const settings = await getSettings();
          if (settings.auto_reply) {
            await sock.sendMessage(sender, {
              text: settings.auto_reply_message
            });
          }
        } catch (error) {
          console.error('WhatsApp auto-reply failed:', error);
        }
      }
    });

    return sock;
  } catch (error) {
    global.sock = null;
    console.error('WhatsApp connection failed:', error);
    scheduleReconnect();
    throw error;
  } finally {
    connecting = false;
  }
}

export async function disconnectFromWhatsApp() {
  manuallyLoggedOut = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const sock = global.sock;
  global.sock = null;
  global.qrCode = null;
  if (sock) await sock.logout();
  await clearSession(process.env.SESSION_ID || 'default-session');
}
