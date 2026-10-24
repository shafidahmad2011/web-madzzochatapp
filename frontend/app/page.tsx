'use client';

import { useEffect, useState } from 'react';
import { ChatArea } from '@/components/ChatArea';
import { Icon } from '@/components/Icon';
import { Login } from '@/components/Login';
import { Settings } from '@/components/Settings';
import { Sidebar, type ChatItem } from '@/components/Sidebar';
import type { ChatMessage } from '@/components/types';

const initialChats: ChatItem[] = [
  { id: '1', name: 'Madinah', preview: 'Kirim bukti harga terbaru ya', time: '09:20', unread: 2, initials: 'MA', color: 'sand', online: true },
  { id: '2', name: 'Support Team', preview: 'Terima kasih, kami sudah review', time: 'Kemarin', unread: 0, initials: 'ST', color: 'blue', online: false },
  { id: '3', name: 'Aulia', preview: 'Sudah siap jam 7 malam?', time: 'Sabtu', unread: 1, initials: 'AU', color: 'rose', online: true },
  { id: '4', name: 'Marketing', preview: 'Proposal sudah saya kirim', time: 'Jumat', unread: 0, initials: 'MK', color: 'green', online: false },
];

const initialMessages: ChatMessage[] = [
  { id: 'm1', incoming: true, text: 'Halo, apakah masih ada slot untuk hari Jumat?', time: '09:12' },
  { id: 'm2', incoming: false, text: 'Masih ada. Mau saya bantu amankan satu?', time: '09:13' },
  { id: 'm3', incoming: true, text: 'Boleh, untuk dua orang ya.', time: '09:14' },
  { id: 'm4', incoming: false, text: 'Siap. Saya kirim detailnya sebentar lagi.', time: '09:16' },
  { id: 'm5', incoming: true, text: 'Makasih banyak!', time: '09:20' },
];

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [chats, setChats] = useState(initialChats);
  const [selectedChatId, setSelectedChatId] = useState(initialChats[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [autoRvo, setAutoRvo] = useState(false);
  const [autoReply, setAutoReply] = useState(true);
  const [autoReplyMessage, setAutoReplyMessage] = useState('Halo! Saya sedang aktif di MadzzoChatApp. Saya akan membalas pesanmu secepatnya.');
  const [waConnected, setWaConnected] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? chats[0];

  useEffect(() => {
    setIsLoggedIn(sessionStorage.getItem('madzzochatapp-user') === 'authenticated');
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    setLoadingChats(true);
    const timer = window.setTimeout(() => setLoadingChats(false), 650);
    return () => window.clearTimeout(timer);
  }, [isLoggedIn]);

  const handleLogin = () => {
    if (pin.trim() === '1234') {
      sessionStorage.setItem('madzzochatapp-user', 'authenticated');
      setIsLoggedIn(true);
      setLoginError('');
      return;
    }
    setLoginError('PIN tidak cocok. Coba lagi.');
  };

  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    setChats((current) => current.map((chat) => chat.id === id ? { ...chat, unread: 0 } : chat));
    setDrawerOpen(false);
    setSettingsOpen(false);
  };

  const handleSend = (text: string) => {
    const value = text.trim();
    if (!value) return;
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    setMessages((current) => [...current, { id: crypto.randomUUID(), incoming: false, text: value, time: now }]);
    setChats((current) => current.map((chat) => chat.id === selectedChatId ? { ...chat, preview: value, time: 'Sekarang' } : chat));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('madzzochatapp-user');
    setIsLoggedIn(false);
    setPin('');
  };

  if (!isLoggedIn) {
    return <Login pin={pin} error={loginError} onPinChange={setPin} onSubmit={handleLogin} />;
  }

  return (
    <main className={`workspace ${lightMode ? 'theme-light' : ''}`}>
      <div className="workspace-frame">
        <Sidebar
          chats={chats}
          selectedId={selectedChatId}
          loading={loadingChats}
          open={drawerOpen}
          onSelect={handleSelectChat}
          onClose={() => setDrawerOpen(false)}
          onThemeToggle={() => setLightMode((current) => !current)}
          lightMode={lightMode}
          onLogout={handleLogout}
        />

        <section className="conversation-column">
          <div className="mobile-topbar">
            <button className="icon-button" aria-label="Buka daftar chat" onClick={() => setDrawerOpen(true)}>
              <Icon name="menu" />
            </button>
            <span className="mobile-wordmark">madzzo<span>.</span></span>
            <button
              className="icon-button"
              aria-label={lightMode ? 'Gunakan tema gelap' : 'Gunakan tema terang'}
              onClick={() => setLightMode((current) => !current)}
            >
              <Icon name={lightMode ? 'moon' : 'sun'} />
            </button>
          </div>

          {settingsOpen ? (
            <Settings
              connected={waConnected}
              autoRvo={autoRvo}
              autoReply={autoReply}
              autoReplyMessage={autoReplyMessage}
              onAutoRvoChange={setAutoRvo}
              onAutoReplyChange={setAutoReply}
              onAutoReplyMessageChange={setAutoReplyMessage}
              onConnectionToggle={() => {
                if (waConnected && !window.confirm('Keluar dari sesi WhatsApp sekarang?')) return;
                setWaConnected((current) => !current);
              }}
              onClose={() => setSettingsOpen(false)}
            />
          ) : (
            <ChatArea
              chat={selectedChat}
              messages={messages}
              onSend={handleSend}
              onOpenSettings={() => setSettingsOpen(true)}
              connected={waConnected}
            />
          )}
        </section>
      </div>
      <span className="page-index" aria-hidden="true">01 / 04</span>
    </main>
  );
}
