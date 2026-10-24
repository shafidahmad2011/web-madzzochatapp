import { Router } from 'express';
import { getSettings, saveSettings } from './supabase.js';

const router = Router();

function requireApiToken(req, res, next) {
  const apiToken = process.env.API_TOKEN;
  if (!apiToken || req.get('Authorization') !== `Bearer ${apiToken}`) {
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

router.get('/qr', requireApiToken, (req, res) => {
  if (!global.qrCode) {
    return res.status(404).json({ error: 'QR code is not available' });
  }
  return res.json({ qr: global.qrCode });
});

router.post('/send', requireApiToken, async (req, res) => {
  const { to, text } = req.body || {};
  if (typeof to !== 'string' || !to || typeof text !== 'string' || !text) {
    return res.status(400).json({ error: 'to and text are required' });
  }

  if (!global.sock?.user) {
    return res.status(503).json({ error: 'WhatsApp is not connected' });
  }

  try {
    const result = await global.sock.sendMessage(to, { text });
    return res.json({ ok: true, result });
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return res.status(500).json({ error: 'Failed to send message' });
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
      typeof auto_reply_message !== 'string')
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
