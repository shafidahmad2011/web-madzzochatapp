export function normalizeJid(jid) {
  if (typeof jid !== 'string') return null;
  const separator = jid.lastIndexOf('@');
  if (separator <= 0 || separator === jid.length - 1) return null;

  const localPart = jid.slice(0, separator).split(':')[0];
  const server = jid.slice(separator + 1);
  return localPart ? `${localPart}@${server}` : null;
}
