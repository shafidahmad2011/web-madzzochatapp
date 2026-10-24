type SettingsToggleProps = {
  label: string;
  enabled: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function SettingsToggle({ label, enabled, onClick, disabled = false }: SettingsToggleProps) {
  return (
    <button
      type="button"
      className={`switch ${enabled ? 'on' : ''}`}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="switch-knob" />
    </button>
  );
}
