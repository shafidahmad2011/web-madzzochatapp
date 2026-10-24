import { useState } from 'react';
import { Icon } from './Icon';

export type ChatItem = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  initials: string;
  color: string;
  online: boolean;
};

type SidebarProps = {
  chats: ChatItem[];
  selectedId: string;
  loading: boolean;
  open: boolean;
  lightMode: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
  onThemeToggle: () => void;
  onLogout: () => void;
};

export function Sidebar({
  chats,
  selectedId,
  loading,
  open,
  lightMode,
  onSelect,
  onClose,
  onThemeToggle,
  onLogout,
}: SidebarProps) {
  const [query, setQuery] = useState('');
  const visibleChats = chats.filter((chat) =>
    `${chat.name} ${chat.preview}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      {open && <button className="drawer-scrim" onClick={onClose} aria-label="Tutup daftar chat" />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand-row">
          <a className="wordmark" href="/" aria-label="MadzzoChatApp home">
            madzzo<span>.</span>
          </a>
          <span className="desk-label">PRIVATE DESK</span>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Tutup menu">
            <Icon name="close" />
          </button>
        </div>

        <div className="inbox-title-row">
          <div>
            <p className="eyebrow">YOUR SPACE</p>
            <h2>Inbox <span>{String(chats.length).padStart(2, '0')}</span></h2>
          </div>
          <button className="new-chat-button" aria-label="Buat chat baru" title="Buat chat baru">
            <Icon name="add" />
          </button>
        </div>

        <div className="sidebar-search">
          <Icon name="search" size={16} />
          <input
            aria-label="Cari chat"
            placeholder="Find a conversation"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="list-heading"><span>RECENT</span><button>All chats <Icon name="arrow" size={13} /></button></div>
        <nav className="chat-list" aria-label="Daftar chat">
          {loading ? (
            <div className="chat-skeletons" aria-label="Memuat chat">
              {[0, 1, 2, 3].map((item) => (
                <div className="chat-skeleton" key={item}>
                  <i />
                  <div><b /><span /></div>
                </div>
              ))}
            </div>
          ) : visibleChats.length ? visibleChats.map((chat, index) => (
            <button
              key={chat.id}
              className={`chat-item ${selectedId === chat.id ? 'is-selected' : ''}`}
              onClick={() => onSelect(chat.id)}
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <span className={`avatar avatar-${chat.color}`}>
                {chat.initials}
                {chat.online && <i className="avatar-presence" />}
              </span>
              <span className="chat-meta">
                <span className="chat-row">
                  <strong className="chat-name">{chat.name}</strong>
                  <time className="chat-time">{chat.time}</time>
                </span>
                <span className="chat-preview">
                  <span className="chat-preview-message">{chat.preview}</span>
                  {chat.unread > 0 && <span className="unread">{chat.unread}</span>}
                </span>
              </span>
              <span className="active-rail" />
            </button>
          )) : <p className="no-chats">No conversations found.</p>}
        </nav>

        <div className="sidebar-bottom">
          <div className="workspace-note">
            <span className="note-pin" />
            <span><strong>A little more signal.</strong><small>Your private corner of the internet.</small></span>
          </div>
          <div className="account-row">
            <div className="account-avatar">M</div>
            <div className="account-copy"><strong>My workspace</strong><small>Personal account</small></div>
            <button className="icon-button account-menu" onClick={onThemeToggle} aria-label={lightMode ? 'Beralih ke dark mode' : 'Beralih ke light mode'}>
              <Icon name={lightMode ? 'moon' : 'sun'} size={17} />
            </button>
            <button className="icon-button account-menu" onClick={onLogout} aria-label="Keluar dari workspace" title="Keluar">
              <Icon name="dots" size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
