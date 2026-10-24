import makeWASocket, {
  DisconnectReason,
  Browsers
} from '@whiskeysystems/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { getSettings } from './supabase.js';
import { useSupabaseAuthState } from './supabaseAuthState.js';

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
      browser: Browsers.ubuntu('MadzzoChatApp')
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

      if (qr) global.qrCode = qr;
      if (connection === 'open') global.qrCode = null;

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
        const sender = message.key?.remoteJid;
        if (
          !message.message ||
          message.key?.fromMe ||
          !sender?.endsWith('@s.whatsapp.net')
        ) {
          continue;
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
}
