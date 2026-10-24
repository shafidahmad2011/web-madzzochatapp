import { FormEvent } from 'react';
import { Icon } from './Icon';

type LoginProps = {
  email: string;
  password: string;
  error: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};

export function Login({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginProps) {
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
          <p className="login-hint">Sign in with your authorized account to continue.</p>
          <form onSubmit={handleSubmit}>
            <label className="underline-field" htmlFor="email">
              <span>EMAIL</span>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="underline-field" htmlFor="password">
              <span>PASSWORD</span>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="Your password"
                required
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="login-submit" type="submit" disabled={loading}>
              <span>{loading ? 'Signing in…' : 'Enter workspace'}</span>
              <Icon name="arrow" />
            </button>
          </form>
          <p className="demo-note">Access is limited to accounts authorized by the workspace owner.</p>
        </div>
        <span className="login-side-note">ENCRYPTED SESSION <i /> PRIVATE BY DESIGN</span>
      </section>
    </main>
  );
}
