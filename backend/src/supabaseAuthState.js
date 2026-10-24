import { BufferJSON, initAuthCreds } from '@whiskeysystems/baileys';
import { loadSession, saveSession } from './supabase.js';

const sessionId = process.env.SESSION_ID || 'default-session';

function serialize(value) {
  return JSON.parse(JSON.stringify(value, BufferJSON.replacer));
}

function deserialize(value) {
  if (!value) return value;
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  return JSON.parse(serialized, BufferJSON.reviver);
}

export async function useSupabaseAuthState() {
  const stored = await loadSession(sessionId);
  const creds = deserialize(stored?.creds) || initAuthCreds();
  const keysData = deserialize(stored?.keys) || {};

  const persist = () => saveSession(
    sessionId,
    serialize(creds),
    serialize(keysData)
  );

  const keys = {
    ...keysData,
    get: async (type, ids) => {
      const category = keysData[type] || {};
      return Object.fromEntries(
        ids
          .filter((id) => category[id] !== undefined)
          .map((id) => [id, category[id]])
      );
    },
    set: async (data) => {
      for (const [type, entries] of Object.entries(data)) {
        keysData[type] ||= {};
        for (const [id, value] of Object.entries(entries)) {
          if (value === null) {
            delete keysData[type][id];
          } else {
            keysData[type][id] = value;
          }
        }
      }
      await persist();
    }
  };

  return {
    state: { creds, keys },
    saveCreds: persist
  };
}
