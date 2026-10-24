import { FormEvent } from 'react';
import { Icon } from './Icon';

type LoginProps = {
  pin: string;
  error: string;
  onPinChange: (value: string) => void;
  onSubmit: () => void;
};

export function Login({ pin, error, onPinChange, onSubmit }: LoginProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <main className="login-screen">
      <section className="login-brand-panel">
        <div className="login-brand-top">
          <span className="brand-symbol">m.</span>
          <span className="brand-caption">PRIVATE MESSAGING DESK</span>
        </div>
        <div className="login-title-block">
          <p className="eyebrow">YOUR CONVERSATIONS, IN FOCUS</p>
          <h1>Keep the<br /><span>good ones</span><br />close.</h1>
          <p className="login-description">A quiet place for the messages that move your day forward.</p>
        </div>
        <div className="login-footer">
          <span>PERSONAL WORKSPACE</span>
          <span>EST. 2024</span>
        </div>
        <div className="login-mark" aria-hidden="true">M</div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Unlock your desk.</h2>
          <p className="login-hint">Enter your access PIN to continue to your inbox.</p>
          <form onSubmit={handleSubmit}>
            <label className="underline-field" htmlFor="access-pin">
              <span>ACCESS PIN</span>
              <input
                id="access-pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                value={pin}
                onChange={(event) => onPinChange(event.target.value)}
                placeholder="••••"
                autoFocus
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="login-submit" type="submit">
              <span>Enter workspace</span>
              <Icon name="arrow" />
            </button>
          </form>
          <p className="demo-note">Local preview access code <code>1234</code></p>
        </div>
        <span className="login-side-note">ENCRYPTED SESSION <i /> PRIVATE BY DESIGN</span>
      </section>
    </main>
  );
}
