'use client';

import { FormEvent, useState } from 'react';
import { Icon } from './Icon';

type ComposeProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export function Compose({ onSend, disabled = false }: ComposeProps) {
  const [value, setValue] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;
    onSend(value);
    setValue('');
  };

  return (
    <form className="compose" onSubmit={submit}>
      <button className="attach-button" type="button" aria-label="Lampirkan file">
        <Icon name="add" />
      </button>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={disabled ? "Connect WhatsApp and choose a chat to reply" : "Write a message…"}
        aria-label="Tulis pesan"
        disabled={disabled}
      />
      <span className="compose-hint">↵ to send</span>
      <button className="send-button" type="submit" disabled={disabled || !value.trim()} aria-label="Kirim pesan">
        <Icon name="send" size={17} />
      </button>
    </form>
  );
}
