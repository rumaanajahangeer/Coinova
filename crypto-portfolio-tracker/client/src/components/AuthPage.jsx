import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { BrandMark } from './Brand.jsx';

export default function AuthPage({ onBack, initialMode = 'register' }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setError('');
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  async function submit(e) {
    e.preventDefault();
    setError('');

    const email = form.email.trim();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (mode === 'register') {
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (form.password !== confirmPassword) {
        setError('Passwords do not match. Please verify both fields.');
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        await login({ email, password: form.password });
      } else {
        await register({
          email,
          password: form.password,
          name: form.name.trim() || undefined,
        });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit}>
        {onBack && (
          <button type="button" className="link-btn auth-back" onClick={onBack}>
            ← Back
          </button>
        )}
        <BrandMark />
        <p className="muted">Track holdings, watch prices live and get alerted on your targets.</p>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register');
              setError('');
            }}
          >
            Create account
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError('');
            }}
          >
            Log in
          </button>
        </div>

        {mode === 'register' && (
          <label>
            Name (optional)
            <input
              type="text"
              placeholder="e.g. Satoshi"
              value={form.name}
              onChange={set('name')}
              autoComplete="name"
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            required
            placeholder="you@domain.com"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <div className="password-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={mode === 'register' ? 8 : 1}
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              className="toggle-pwd-btn"
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        {mode === 'register' && (
          <label>
            Confirm Password
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                placeholder="Re-type your password"
                value={confirmPassword}
                onChange={(e) => {
                  setError('');
                  setConfirmPassword(e.target.value);
                }}
                autoComplete="new-password"
              />
            </div>
          </label>
        )}

        {mode === 'register' && <p className="hint">Password must be at least 8 characters.</p>}
        {error && <p className="error">{error}</p>}

        <button className="btn primary" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>

        <button
          type="button"
          className="link-btn center"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
