'use client';

import { useEffect, useMemo, useState } from 'react';

type ChatItem = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  online?: boolean;
};

type Message = {
  id: string;
  incoming: boolean;
  text?: string;
  time: string;
  image?: string;
};

const initialChats: ChatItem[] = [
  { id: '1', name: 'Madinah', preview: 'Kirim bukti harga terbaru ya', time: '09:20', unread: 2, online: true },
  { id: '2', name: 'Support Team', preview: 'Terima kasih, kami sudah review', time: 'Kemarin', unread: 0, online: false },
  { id: '3', name: 'Aulia', preview: 'Sudah siap jam 7 malam?', time: 'Sabtu', unread: 1, online: true },
  { id: '4', name: 'Marketing', preview: 'Proposal sudah saya kirim', time: 'Jumat', unread: 0, online: false }
];

const initialMessages: Message[] = [
  { id: 'm1', incoming: true, text: 'Halo, apakah tersedia slot untuk hari Jumat?', time: '09:12' },
  { id: 'm2', incoming: false, text: 'Tersedia, saya bisa bantu booking sekarang.', time: '09:13' },
  { id: 'm3', incoming: true, text: 'Baik, tolong kirim detailnya.', time: '09:14' },
  { id: 'm4', incoming: false, image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80', time: '09:15' },
  { id: 'm5', incoming: true, text: 'Terima kasih, tampaknya cocok.', time: '09:18' },
  { id: 'm6', incoming: false, text: 'Siap, nanti saya kirimkan update ke kamu.', time: '09:19' }
];

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pin, setPin] = useState('');
  const [chatList] = useState(initialChats);
  const [selectedChat, setSelectedChat] = useState(initialChats[0]);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoRVO, setAutoRVO] = useState(true);
  const [autoReply, setAutoReply] = useState(true);
  const [autoReplyMessage, setAutoReplyMessage] = useState('Halo! Saya sedang aktif di MadzzoChatApp.');
  const [waStatus, setWaStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');

  const activeChat = useMemo(() => selectedChat ?? chatList[0], [chatList, selectedChat]);

  useEffect(() => {
    const saved = sessionStorage.getItem('madzzochatapp-user');
    if (saved === 'authenticated') setIsLoggedIn(true);
  }, []);

  const handleLogin = () => {
    if (pin.trim() === '1234') {
      sessionStorage.setItem('madzzochatapp-user', 'authenticated');
      setIsLoggedIn(true);
    }
  };

  const handleSend = () => {
    const value = draft.trim();
    if (!value) return;

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), incoming: false, text: value, time: 'now' }
    ]);
    setDraft('');
  };

  if (!isLoggedIn) {
    return (
      <main className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="brand-mark">M</div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>MadzzoChatApp</div>
                <div style={{ color: '#9fb0c9' }}>Secure browser access</div>
              </div>
            </div>

            <div className="field">
              <label htmlFor="pin">PIN / Password</label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN"
              />
            </div>

            <button className="primary-btn" onClick={handleLogin}>
              Login
            </button>

            <div style={{ color: '#9fb0c9', fontSize: 12 }}>
              Demo mode: gunakan PIN <strong>1234</strong>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="app-window">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="brand">
              <div className="brand-mark">M</div>
              <span>MadzzoChatApp</span>
            </div>
            <button className="icon-btn" aria-label="new chat">+</button>
          </div>

          <div className="chat-list">
            {chatList.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${activeChat.id === chat.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="avatar">{chat.name.slice(0, 2).toUpperCase()}</div>
                <div className="chat-meta">
                  <div className="chat-row">
                    <span className="chat-name">{chat.name}</span>
                    <span className="chat-time">{chat.time}</span>
                  </div>
                  <div className="chat-preview">
                    <span className="chat-preview-message">{chat.preview}</span>
                    {chat.unread > 0 && <span className="unread">{chat.unread}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="chat-panel">
          <header className="chat-header">
            <div className="contact-info">
              <div className="avatar">{activeChat.name.slice(0, 2).toUpperCase()}</div>
              <div className="contact-details">
                <div className="contact-name">{activeChat.name}</div>
                <div className="contact-status">{activeChat.online ? 'Online' : 'Offline'} • WhatsApp</div>
              </div>
            </div>

            <div className="header-actions">
              <button className="icon-btn" aria-label="search">⌕</button>
              <button className="secondary-btn" onClick={() => setSettingsOpen((v) => !v)}>
                Settings
              </button>
            </div>
          </header>

          {settingsOpen ? (
            <div className="settings-panel">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h3 style={{ margin: 0 }}>WhatsApp Settings</h3>
                  <span className={`status-pill ${waStatus === 'disconnected' ? 'disconnected' : ''}`}>
                    {waStatus === 'connected' ? 'Connected' : waStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
                  </span>
                </div>

                <div className="settings-grid">
                  <div className="card" style={{ padding: 18 }}>
                    <div className="toggle-row">
                      <span>Auto RVO</span>
                      <button className={`switch ${autoRVO ? 'on' : ''}`} onClick={() => setAutoRVO((v) => !v)}>
                        <span className="switch-knob" />
                      </button>
                    </div>
                    <div className="toggle-row">
                      <span>Auto Reply</span>
                      <button className={`switch ${autoReply ? 'on' : ''}`} onClick={() => setAutoReply((v) => !v)}>
                        <span className="switch-knob" />
                      </button>
                    </div>
                  </div>

                  <div className="card" style={{ padding: 18 }}>
                    <div className="field">
                      <label>Auto Reply Message</label>
                      <textarea
                        value={autoReplyMessage}
                        onChange={(e) => setAutoReplyMessage(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                  <button className="primary-btn" onClick={() => setWaStatus('connected')}>Reconnect WA</button>
                  <button className="secondary-btn" onClick={() => setWaStatus('disconnected')}>Logout WA</button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="messages">
                {messages.map((message) => (
                  <div key={message.id} className={`message-row ${message.incoming ? 'incoming' : 'outgoing'}`}>
                    <div className={`message-bubble ${message.image ? 'media' : ''}`}>
                      {message.image ? <img src={message.image} alt="media" className="message-image" /> : <p>{message.text}</p>}
                      <time>{message.time}</time>
                    </div>
                  </div>
                ))}
              </div>

              <div className="compose">
                <div className="compose-box">
                  <button className="icon-btn" aria-label="attach">📎</button>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Ketik pesan..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSend();
                    }}
                  />
                  <button className="primary-btn" onClick={handleSend}>Kirim</button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
