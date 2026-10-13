import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDateTime, money } from '../format.js';
import CoinPicker, { Logo } from './CoinPicker.jsx';

export default function Alerts({ alerts, currency, reload, preselect, clearPreselect }) {
  const [coin, setCoin] = useState(null);
  const [condition, setCondition] = useState('above');
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // "Set alert" button on a holding row jumps here with the coin pre-filled.
  useEffect(() => {
    if (preselect) {
      setCoin(preselect);
      clearPreselect();
    }
  }, [preselect, clearPreselect]);

  async function create(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.createAlert({ coinId: coin.id, condition, targetPrice: Number(target) });
      setCoin(null);
      setTarget('');
      await reload();
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const act = (fn) => async () => {
    try {
      await fn();
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const active = alerts.filter((a) => a.active);
  const done = alerts.filter((a) => !a.active);

  return (
    <div className="grid two">
      <section className="card">
        <h2>New price alert</h2>
        <form className="stack" onSubmit={create}>
          <CoinPicker value={coin} onChange={setCoin} />
          {coin && (
            <>
              <div className="row gap">
                <label className="grow">
                  Notify me when price is
                  <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                    <option value="above">at or above</option>
                    <option value="below">at or below</option>
                  </select>
                </label>
                <label className="grow">
                  Target ({currency.toUpperCase()})
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                </label>
              </div>
              <p className="hint">Alerts are checked every minute on the server and fire once. You can re-arm them afterwards.</p>
            </>
          )}
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={!coin || busy}>
            {busy ? 'Creating…' : 'Create alert'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Active alerts ({active.length})</h2>
        {!active.length && <p className="muted">No active alerts.</p>}
        <ul className="alert-list">
          {active.map((a) => (
            <li key={a.id}>
              <Logo src={a.image} alt="" />
              <div className="grow">
                <strong>{a.symbol}</strong>{' '}
                <span className="muted">{a.condition === 'above' ? '≥' : '≤'}</span> {money(a.targetPrice, a.currency)}
                <small className="muted block">
                  Now {money(a.currentPrice, a.currency)}
                </small>
              </div>
              <button className="icon-btn danger" title="Delete" onClick={act(() => api.deleteAlert(a.id))}>
                🗑
              </button>
            </li>
          ))}
        </ul>

        {done.length > 0 && (
          <>
            <h2 className="spaced">Triggered ({done.length})</h2>
            <ul className="alert-list">
              {done.map((a) => (
                <li key={a.id} className="done">
                  <Logo src={a.image} alt="" />
                  <div className="grow">
                    <strong>{a.symbol}</strong>{' '}
                    <span className="muted">{a.condition === 'above' ? '≥' : '≤'}</span> {money(a.targetPrice, a.currency)}
                    <small className="muted block">
                      Hit {money(a.triggeredPrice, a.currency)} · {formatDateTime(a.triggeredAt)}
                    </small>
                  </div>
                  <button className="link-btn" onClick={act(() => api.reactivateAlert(a.id))}>
                    Re-arm
                  </button>
                  <button className="icon-btn danger" title="Delete" onClick={act(() => api.deleteAlert(a.id))}>
                    🗑
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
