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
};

export function ChatArea({
  chat,
  messages,
  connected,
  onSend,
  onOpenSettings,
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
            <i className={`status-dot ${connected && chat.online ? 'is-online' : ''}`} />
            {connected && chat.online ? 'Available now' : 'Last seen recently'}
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
        <span>FRIDAY, 24 MAY</span>
        <span className="context-line" />
        <span>5 MESSAGES</span>
      </div>

      <div className="messages" aria-live="polite">
        {visibleMessages.length ? visibleMessages.map((message, index) => (
          <ChatBubble
            key={message.id}
            incoming={message.incoming}
            text={message.text}
            time={message.time}
            index={index}
            sender={message.incoming ? chat.name : 'You'}
          />
        )) : (
          <div className="empty-search">No messages match “{query}”.</div>
        )}
      </div>
      <div className="composer-divider"><span>YOU ARE CAUGHT UP</span></div>
      <Compose onSend={onSend} />
    </section>
  );
}
