'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChatArea } from '@/components/ChatArea';
import { Icon } from '@/components/Icon';
import { Login } from '@/components/Login';
import { Settings } from '@/components/Settings';
import { Sidebar, type ChatItem } from '@/components/Sidebar';
import type { ChatMessage, StoredMessage } from '@/components/types';
import { backendRequest } from '@/lib/backendApi';
import { supabase } from '@/lib/supabase';

type RecentMessagesResponse = { messages: StoredMessage[]; selfJid: string | null };
type SettingsResponse = {
  settings: { auto_rvo: boolean; auto_reply: boolean; auto_reply_message: string };
};
type StatusResponse = { connected: boolean };

const emptyChat: ChatItem = {
  id: '',
  jid: '',
  name: 'Your inbox',
  preview: 'Your conversations will appear here',
  time: '',
  unread: 0,
  initials: 'M',
  color: 'blue',
  online: false,
};

function chatName(jid: string) {
  return jid.split('@')[0].split(':')[0];
}

function avatarStyle(jid: string) {
  const styles = ['sand', 'blue', 'rose', 'green'];
  let hash = 0;
  for (let index = 0; index < jid.length; index += 1) {
    hash += jid.charCodeAt(index);
  }
  return styles[hash % styles.length];
}

function displayTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function toChatMessage(message: StoredMessage, selfJid: string): ChatMessage {
  return {
    id: message.id,
    incoming: message.from_jid !== selfJid,
    text: message.body || (message.media_type ? 'Media message' : ''),
    time: displayTime(message.timestamp),
  };
}

export default function HomePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pageError, setPageError] = useState('');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [autoRvo, setAutoRvo] = useState(false);
  const [autoReply, setAutoReply] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState('');
  const [waConnected, setWaConnected] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState('');
  const [selfJid, setSelfJid] = useState('');

  const selectedChat = chats.find((chat) => chat.id === selectedChatId) ?? emptyChat;

  const loadRecentChats = useCallback(async () => {
    const response = await backendRequest<RecentMessagesResponse>('messages/recent');
    if (response.selfJid) setSelfJid(response.selfJid);
    const knownSelfJid = response.selfJid || selfJid;
    if (!knownSelfJid) {
      setChats([]);
      setSelectedChatId('');
      return;
    }

    const latestByContact = new Map<string, StoredMessage>();
    for (const message of response.messages) {
      const contactJid = message.from_jid === knownSelfJid ? message.to_jid : message.from_jid;
      if (!contactJid || contactJid === knownSelfJid || !contactJid.endsWith('@s.whatsapp.net')) continue;
      if (!latestByContact.has(contactJid)) latestByContact.set(contactJid, message);
    }

    const nextChats = [...latestByContact.entries()].map(([jid, message]) => {
      const name = chatName(jid);
      return {
        id: jid,
        jid,
        name,
        preview: message.body || (message.media_type ? 'Media message' : 'Message'),
        time: displayTime(message.timestamp),
        unread: 0,
        initials: name.slice(0, 2).toUpperCase(),
        color: avatarStyle(jid),
        online: false,
      };
    });
    setChats(nextChats);
    setSelectedChatId((current) =>
      nextChats.some((chat) => chat.id === current) ? current : nextChats[0]?.id || '',
    );
  }, [selfJid]);

  const loadSettings = useCallback(async () => {
    const response = await backendRequest<SettingsResponse>('settings');
    setAutoRvo(false);
    setAutoReply(response.settings.auto_reply);
    setAutoReplyMessage(response.settings.auto_reply_message);
  }, []);

  const loadStatus = useCallback(async () => {
    const response = await backendRequest<StatusResponse>('status');
    setWaConnected(response.connected);
  }, []);

  useEffect(() => {
    let active = true;
    const applySession = (user: { email?: string } | null) => {
      if (active) setUserEmail(user?.email || null);
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      applySession(data.session?.user || null);
      if (active) setAuthLoading(false);
    }).catch((error: unknown) => {
      console.error('Failed to restore Supabase session:', error);
      if (active) {
        setLoginError('Gagal memeriksa sesi. Muat ulang halaman dan coba lagi.');
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user || null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    let active = true;
    setSettingsLoading(true);
    setPageError('');
    Promise.allSettled([loadRecentChats(), loadSettings(), loadStatus()]).then((results) => {
      if (!active) return;
      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length) {
        const firstError = failures[0];
        setPageError(firstError.status === 'rejected'
          ? `Backend belum siap: ${firstError.reason instanceof Error ? firstError.reason.message : 'Request gagal'}`
          : '');
        const settingsResult = results[1];
        if (settingsResult.status === 'rejected') {
          setSettingsNotice(settingsResult.reason instanceof Error
            ? settingsResult.reason.message
            : 'Could not load settings.');
        }
      }
      setSettingsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [userEmail, loadRecentChats, loadSettings, loadStatus]);

  useEffect(() => {
    if (!userEmail) return;
    const timer = window.setInterval(() => {
      void loadRecentChats().catch((error: unknown) => {
        console.error('Failed to refresh conversations:', error);
      });
      void loadStatus().catch((error: unknown) => {
        console.error('Failed to refresh WhatsApp status:', error);
        setWaConnected(false);
        setPageError(error instanceof Error ? error.message : 'Backend connection lost.');
      });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [userEmail, loadRecentChats, loadStatus]);

  useEffect(() => {
    if (!userEmail || !selectedChat.jid) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    let active = true;
    let firstLoad = true;
    const refreshMessages = async () => {
      if (firstLoad) setMessagesLoading(true);
      try {
        const response = await backendRequest<{ messages: StoredMessage[] }>(
          `messages?jid=${encodeURIComponent(selectedChat.jid)}`,
        );
        if (active) {
          setMessages(response.messages.map((message) => toChatMessage(message, selfJid)));
          setPageError('');
        }
      } catch (error) {
        if (active && firstLoad) {
          setPageError(error instanceof Error ? error.message : 'Gagal memuat percakapan.');
        }
      } finally {
        firstLoad = false;
        if (active) setMessagesLoading(false);
      }
    };
    void refreshMessages();
    const timer = window.setInterval(() => void refreshMessages(), 8000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [userEmail, selectedChat.jid, selfJid]);

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setLoginError(error.message);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Sign-in failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSelectChat = (id: string) => {
    setSelectedChatId(id);
    setDrawerOpen(false);
    setSettingsOpen(false);
  };

  const handleSend = async (text: string) => {
    setPageError('');
    try {
      const response = await backendRequest<{ message: StoredMessage }>('send', {
        method: 'POST',
        body: { to: selectedChat.jid, text: text.trim() },
      });
      setMessages((current) => [...current, toChatMessage(response.message, selfJid)]);
      void loadRecentChats();
    } catch (error) {
      const messageSent = Boolean(
        error && typeof error === 'object' && 'messageSent' in error && error.messageSent,
      );
      setPageError(error instanceof Error ? error.message : 'Gagal mengirim pesan.');
      if (messageSent) void loadRecentChats();
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setLoginError(`Gagal keluar: ${error.message}`);
  };

  const handleSettingsSave = async () => {
    setSettingsSaving(true);
    setSettingsNotice('');
    try {
      const response = await backendRequest<SettingsResponse>('settings', {
        method: 'POST',
        body: { auto_reply: autoReply, auto_reply_message: autoReplyMessage },
      });
      setAutoReply(response.settings.auto_reply);
      setAutoReplyMessage(response.settings.auto_reply_message);
      setSettingsNotice('Settings saved.');
    } catch (error) {
      setSettingsNotice(error instanceof Error ? error.message : 'Could not save settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleConnectionToggle = async () => {
    if (!waConnected || !window.confirm('Keluar dari sesi WhatsApp sekarang?')) return;
    try {
      await backendRequest('disconnect', { method: 'POST', body: {} });
      setWaConnected(false);
      setSettingsNotice('WhatsApp disconnected.');
    } catch (error) {
      setSettingsNotice(error instanceof Error ? error.message : 'Could not disconnect WhatsApp.');
    }
  };

  if (authLoading) {
    return <main className="login-screen"><p className="message-loading" role="status">Checking your session…</p></main>;
  }

  if (!userEmail) {
    return (
      <Login
        email={email}
        password={password}
        error={loginError}
        loading={loginLoading}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main className={`workspace ${lightMode ? 'theme-light' : ''}`}>
      <div className="workspace-frame">
        <Sidebar
          chats={chats}
          selectedId={selectedChatId}
          loading={settingsLoading}
          open={drawerOpen}
          onSelect={handleSelectChat}
          onClose={() => setDrawerOpen(false)}
          onThemeToggle={() => setLightMode((current) => !current)}
          lightMode={lightMode}
          onLogout={() => void handleLogout()}
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
              autoRvo={false}
              autoReply={autoReply}
              autoReplyMessage={autoReplyMessage}
              saving={settingsSaving}
              notice={settingsNotice}
              onAutoRvoChange={() => undefined}
              onAutoReplyChange={setAutoReply}
              onAutoReplyMessageChange={setAutoReplyMessage}
              onSave={() => void handleSettingsSave()}
              onConnectionToggle={() => void handleConnectionToggle()}
              onClose={() => setSettingsOpen(false)}
            />
          ) : (
            <ChatArea
              chat={selectedChat}
              messages={messages}
              onSend={(text) => void handleSend(text)}
              onOpenSettings={() => setSettingsOpen(true)}
              connected={waConnected}
              messagesLoading={messagesLoading}
              error={pageError}
            />
          )}
        </section>
      </div>
      <span className="page-index" aria-hidden="true">01 / 04</span>
    </main>
  );
}
