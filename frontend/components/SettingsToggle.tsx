type SettingsToggleProps = {
  label: string;
  enabled: boolean;
  onClick: () => void;
};

export function SettingsToggle({ label, enabled, onClick }: SettingsToggleProps) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <button className={`switch ${enabled ? 'on' : ''}`} onClick={onClick}>
        <span className="switch-knob" />
      </button>
    </div>
  );
}
