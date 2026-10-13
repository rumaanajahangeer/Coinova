import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { BrandMark } from './Brand.jsx';

export default function AuthPage({ onBack }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login({ email: form.email, password: form.password });
      else await register(form);
    } catch (err) {
      setError(err.message);
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

        {mode === 'register' && (
          <label>
            Name (optional)
            <input value={form.name} onChange={set('name')} autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={mode === 'register' ? 8 : 1}
            value={form.password}
            onChange={set('password')}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>
        {mode === 'register' && <p className="hint">At least 8 characters.</p>}
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
          {mode === 'login' ? "No account? Sign up" : 'Have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
