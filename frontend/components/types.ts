export type ChatMessage = {
  id: string;
  incoming: boolean;
  text: string;
  time: string;
};

export type StoredMessage = {
  id: string;
  from_jid: string;
  to_jid: string | null;
  body: string | null;
  media_type: string | null;
  timestamp: string;
};
