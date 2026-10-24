type ChatItem = {
  id: string;
  name: string;
  preview: string;
  time: string;
  unread: number;
  online?: boolean;
};

export function Sidebar({ chats, selectedId, onSelect }: { chats: ChatItem[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-mark">M</div>
          <span>MadzzoChatApp</span>
        </div>
        <button className="icon-btn" aria-label="new chat">+</button>
      </div>

      <div className="chat-list">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${selectedId === chat.id ? 'active' : ''}`}
            onClick={() => onSelect(chat.id)}
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
  );
}
