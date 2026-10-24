type ComposeProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function Compose({ value, onChange, onSend }: ComposeProps) {
  return (
    <div className="compose">
      <div className="compose-box">
        <button className="icon-btn" aria-label="attach">📎</button>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ketik pesan..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSend();
          }}
        />
        <button className="primary-btn" onClick={onSend}>Kirim</button>
      </div>
    </div>
  );
}
