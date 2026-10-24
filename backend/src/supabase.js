import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be configured.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export async function getSettings() {
  const { data, error } = await supabase
    .from('wa_settings')
    .select('auto_rvo, auto_reply, auto_reply_message')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data || {
    auto_rvo: false,
    auto_reply: false,
    auto_reply_message: 'Halo! Saya sedang menggunakan MadzzoChatApp.'
  };
}

export async function saveSettings(settings) {
  const { data: current, error: lookupError } = await supabase
    .from('wa_settings')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const query = current
    ? supabase.from('wa_settings').update(settings).eq('id', current.id)
    : supabase.from('wa_settings').insert(settings);
  const { data, error } = await query
    .select('auto_rvo, auto_reply, auto_reply_message')
    .single();

  if (error) throw error;
  return data;
}

export async function saveSession(sessionId, creds, keys) {
  const { error } = await supabase
    .from('wa_sessions')
    .upsert({
      session_id: sessionId,
      creds,
      keys,
      updated_at: new Date().toISOString()
    }, { onConflict: 'session_id' });

  if (error) throw error;
}

export async function loadSession(sessionId) {
  const { data, error } = await supabase
    .from('wa_sessions')
    .select('session_id, creds, keys')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function clearSession(sessionId) {
  const { error } = await supabase
    .from('wa_sessions')
    .delete()
    .eq('session_id', sessionId);

  if (error) throw error;
}

export async function saveMessage(message) {
  const { error } = await supabase.from('messages').insert(message);
  if (error) throw error;
}
