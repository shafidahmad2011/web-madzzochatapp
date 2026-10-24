import { useMemo, useState } from 'react';
import type { ChatItem } from './Sidebar';
import type { ChatMessage } from './types';
import { ChatBubble } from './ChatBubble';
import { Compose } from './Compose';
import { Icon } from './Icon';

type ChatAreaProps = {
  chat: ChatItem;
  messages: ChatMessage[];
  connected: boolean;
  onSend: (message: string) => void;
  onOpenSettings: () => void;
  messagesLoading: boolean;
  error: string;
};

export function ChatArea({
  chat,
  messages,
  connected,
  onSend,
  onOpenSettings,
  messagesLoading,
  error,
}: ChatAreaProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const visibleMessages = useMemo(
    () => messages.filter((message) => !query || message.text.toLowerCase().includes(query.toLowerCase())),
    [messages, query],
  );

  return (
    <section className="chat-panel">
      <header className="chat-header">
        <div className={`avatar avatar-${chat.color} contact-avatar`}>
          {chat.initials}
          {chat.online && <i className="avatar-presence" />}
        </div>
        <div className="contact-details">
          <h1 className="contact-name">{chat.name}</h1>
          <span className="contact-status">
            <i className={`status-dot ${connected ? 'is-online' : ''}`} />
            {connected ? 'WhatsApp service connected' : 'WhatsApp service disconnected'}
          </span>
        </div>
        <div className="header-actions">
          {searchOpen && (
            <input
              className="message-search"
              autoFocus
              aria-label="Cari pesan"
              placeholder="Search this chat"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          )}
          <button className={`icon-button ${searchOpen ? 'is-active' : ''}`} onClick={() => {
            setSearchOpen((current) => !current);
            setQuery('');
          }} aria-label="Cari pesan">
            <Icon name="search" />
          </button>
          <span className="header-divider" />
          <button className="icon-button" onClick={onOpenSettings} aria-label="Buka pengaturan">
            <Icon name="settings" />
          </button>
        </div>
      </header>

      <div className="chat-context">
        <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</span>
        <span className="context-line" />
        <span>{messages.length} MESSAGES</span>
      </div>
      {error && <div className="empty-search" role="alert">{error}</div>}

      <div className="messages" aria-live="polite">
        {messagesLoading ? (
          <div className="message-loading" role="status">Loading conversation…</div>
        ) : !chat.jid ? (
          <div className="empty-search">No conversations yet. Messages will appear here when they arrive.</div>
        ) : visibleMessages.length ? visibleMessages.map((message, index) => (
          <ChatBubble
            key={message.id}
            incoming={message.incoming}
            text={message.text}
            time={message.time}
            index={index}
            sender={message.incoming ? chat.name : 'You'}
          />
        )) : query ? (
          <div className="empty-search">No messages match “{query}”.</div>
        ) : <div className="empty-search">No messages in this conversation yet.</div>}
      </div>
      <div className="composer-divider"><span>YOU ARE CAUGHT UP</span></div>
      <Compose onSend={onSend} disabled={!chat.jid || !connected} />
    </section>
  );
}
