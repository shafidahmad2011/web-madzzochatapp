import { Icon } from './Icon';
import { SettingsToggle } from './SettingsToggle';

type SettingsProps = {
  connected: boolean;
  autoRvo: boolean;
  autoReply: boolean;
  autoReplyMessage: string;
  onAutoRvoChange: (value: boolean) => void;
  onAutoReplyChange: (value: boolean) => void;
  onAutoReplyMessageChange: (value: string) => void;
  onConnectionToggle: () => void;
  onClose: () => void;
};

export function Settings({
  connected,
  autoRvo,
  autoReply,
  autoReplyMessage,
  onAutoRvoChange,
  onAutoReplyChange,
  onAutoReplyMessageChange,
  onConnectionToggle,
  onClose,
}: SettingsProps) {
  return (
    <section className="settings-view">
      <header className="settings-heading">
        <div>
          <p className="eyebrow">PREFERENCES / 02</p>
          <h1>Make it yours.</h1>
          <p>Small adjustments for a calmer inbox.</p>
        </div>
        <button className="icon-button settings-close" onClick={onClose} aria-label="Tutup pengaturan">
          <Icon name="close" />
        </button>
      </header>

      <div className="settings-content">
        <section className="settings-section connection-section">
          <div className="section-kicker">01 <span>ACCOUNT</span></div>
          <div className="connection-card">
            <div className="connection-symbol">WA</div>
            <div className="connection-copy">
              <strong>WhatsApp session</strong>
              <span><i className={`status-dot ${connected ? 'is-online' : ''}`} />{connected ? 'Connected and ready' : 'Disconnected'}</span>
            </div>
            <button className="text-action" onClick={onConnectionToggle}>
              {connected ? 'Log out' : 'Reconnect'}
              <Icon name="arrow" size={15} />
            </button>
          </div>
          <p className="settings-footnote">Logging out ends the active WhatsApp session on this device.</p>
        </section>

        <section className="settings-section">
          <div className="section-kicker">02 <span>MESSAGE RULES</span></div>
          <div className="settings-row">
            <div>
              <h3>Auto RVO</h3>
              <p>UI preview only. The service never forwards this media.</p>
            </div>
            <SettingsToggle label="Auto RVO" enabled={autoRvo} onClick={() => onAutoRvoChange(!autoRvo)} />
          </div>
          <div className="settings-row">
            <div>
              <h3>Auto reply</h3>
              <p>Send a note when a private message arrives.</p>
            </div>
            <SettingsToggle label="Auto reply" enabled={autoReply} onClick={() => onAutoReplyChange(!autoReply)} />
          </div>
          <label className={`reply-editor ${autoReply ? '' : 'is-disabled'}`}>
            <span>REPLY MESSAGE</span>
            <textarea
              value={autoReplyMessage}
              onChange={(event) => onAutoReplyMessageChange(event.target.value)}
              disabled={!autoReply}
              maxLength={240}
            />
            <small>{autoReplyMessage.length} / 240</small>
          </label>
        </section>

        <div className="settings-save-row">
          <span><Icon name="check" size={15} /> Changes stay in this preview</span>
          <button className="save-button" onClick={onClose}>Done <Icon name="arrow" size={15} /></button>
        </div>
      </div>
    </section>
  );
}
