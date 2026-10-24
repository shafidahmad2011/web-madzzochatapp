type HeaderProps = {
  name: string;
  online: boolean;
  onToggleSettings: () => void;
};

export function Header({ name, online, onToggleSettings }: HeaderProps) {
  return (
    <header className="chat-header">
      <div className="contact-info">
        <div className="avatar">{name.slice(0, 2).toUpperCase()}</div>
        <div className="contact-details">
          <div className="contact-name">{name}</div>
          <div className="contact-status">{online ? 'Online' : 'Offline'} • WhatsApp</div>
        </div>
      </div>

      <div className="header-actions">
        <button className="icon-btn" aria-label="search">⌕</button>
        <button className="secondary-btn" onClick={onToggleSettings}>Settings</button>
      </div>
    </header>
  );
}
