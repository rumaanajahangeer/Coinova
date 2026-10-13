import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './AuthContext.jsx';
import { money } from './format.js';
import { usePolling } from './usePolling.js';
import AddHoldingModal from './components/AddHoldingModal.jsx';
import AllocationChart from './components/AllocationChart.jsx';
import Alerts from './components/Alerts.jsx';
import AuthPage from './components/AuthPage.jsx';
import HeroLanding from './components/HeroLanding.jsx';
import CoinChartModal from './components/CoinChartModal.jsx';
import HoldingsTable from './components/HoldingsTable.jsx';
import Insights from './components/Insights.jsx';
import Summary from './components/Summary.jsx';
import ValueChart from './components/ValueChart.jsx';
import WalletPanel from './components/WalletPanel.jsx';
import { BrandMark } from './components/Brand.jsx';

const CURRENCIES = ['usd', 'eur', 'gbp', 'inr', 'jpy', 'aud', 'cad'];
const REFRESH_MS = 30_000;

export default function App() {
  const { user, loading } = useAuth();
  const [gate, setGate] = useState('landing');
  if (loading) return <div className="splash">Loading…</div>;
  if (user) return <Shell />;
  if (gate === 'auth') return <AuthPage onBack={() => setGate('landing')} />;
  return <HeroLanding onEnter={() => setGate('auth')} />;
}

function Shell() {
  const { user, logout, setCurrency } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(null); // { type: 'holding' | 'chart', ... }
  const [toasts, setToasts] = useState([]);
  const [alertCoin, setAlertCoin] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);
  const notified = useRef(new Set());

  const portfolio = usePolling(() => api.portfolio(), REFRESH_MS, [user.currency]);
  const alerts = usePolling(() => api.alerts(), REFRESH_MS, [user.currency]);

  const p = portfolio.data;
  const alertList = alerts.data?.alerts || [];
  const unseen = alertList.filter((a) => a.triggeredAt && !a.seen);

  // Surface newly-triggered alerts as toasts (and a browser notification when allowed).
  useEffect(() => {
    const fresh = unseen.filter((a) => !notified.current.has(a.id));
    if (!fresh.length) return;
    fresh.forEach((a) => notified.current.add(a.id));
    const items = fresh.map((a) => ({
      id: a.id,
      text: `${a.symbol} is ${a.condition === 'above' ? 'above' : 'below'} ${money(a.targetPrice, a.currency)} (now ${money(a.triggeredPrice, a.currency)})`,
    }));
    setToasts((t) => [...t, ...items]);
    if ('Notification' in window && Notification.permission === 'granted') {
      items.forEach((i) => new Notification('Price alert', { body: i.text }));
    }
    api
      .ackAlerts(fresh.map((a) => a.id))
      .then(alerts.reload)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts.data]);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const t = setTimeout(() => setToasts((all) => all.slice(1)), 8000);
    return () => clearTimeout(t);
  }, [toasts]);

  const refreshAll = useCallback(() => {
    portfolio.reload();
    setHistoryKey((k) => k + 1);
  }, [portfolio]);

  async function removeHolding(h) {
    if (!window.confirm(`Remove ${h.name} from your portfolio?`)) return;
    try {
      await api.deleteHolding(h.id);
      refreshAll();
    } catch (e) {
      window.alert(e.message);
    }
  }

  const clearAlertCoin = useCallback(() => setAlertCoin(null), []);

  return (
    <div className="shell">
      <header className="topbar">
        <BrandMark />
        <nav className="tabs">
          {[
            ['dashboard', 'Dashboard'],
            ['holdings', 'Holdings'],
            ['alerts', 'Alerts'],
            ['wallets', 'Wallets'],
          ].map(([key, label]) => (
            <button key={key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
              {label}
              {key === 'alerts' && unseen.length > 0 && <span className="badge">{unseen.length}</span>}
            </button>
          ))}
        </nav>
        <div className="top-right">
          <span className="live" title="Prices refresh every 30 seconds">
            <i /> {portfolio.updatedAt ? portfolio.updatedAt.toLocaleTimeString() : 'connecting…'}
          </span>
          <select value={user.currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
          <button className="btn primary small" onClick={logout} title={user.email}>
            Log out
          </button>
        </div>
      </header>

      <main className="content">
        {portfolio.error && <div className="banner error">{portfolio.error}</div>}
        {portfolio.loading && !p && <p className="muted">Loading portfolio…</p>}

        {p && tab === 'dashboard' && (
          <>
            <Summary portfolio={p} currency={p.currency} />
            <ValueChart currency={p.currency} refreshKey={historyKey} />
            <div className="grid two">
              <AllocationChart allocation={p.allocation} currency={p.currency} />
              <Insights analytics={p.analytics} />
            </div>
          </>
        )}

        {p && tab === 'holdings' && (
          <section className="card">
            <div className="row between">
              <h2>Holdings</h2>
              <button className="btn primary" onClick={() => setModal({ type: 'holding' })}>
                + Add coin
              </button>
            </div>
            <HoldingsTable
              holdings={p.holdings}
              currency={p.currency}
              onEdit={(h) => setModal({ type: 'holding', holding: h })}
              onDelete={removeHolding}
              onChart={(h) => setModal({ type: 'chart', coin: h })}
              onAlert={(h) => {
                setAlertCoin({ id: h.coinId, name: h.name, symbol: h.symbol, image: h.image });
                setTab('alerts');
              }}
            />
          </section>
        )}

        {tab === 'alerts' && (
          <Alerts
            alerts={alertList}
            currency={user.currency}
            reload={alerts.reload}
            preselect={alertCoin}
            clearPreselect={clearAlertCoin}
          />
        )}

        {tab === 'wallets' && <WalletPanel onChanged={refreshAll} />}

        {p && tab === 'dashboard' && !p.holdings.length && (
          <div className="card empty-state">
            <h2>Welcome 👋</h2>
            <p className="muted">Start by adding a coin, or import balances from MetaMask.</p>
            <div className="row gap center">
              <button className="btn primary" onClick={() => setModal({ type: 'holding' })}>
                + Add coin
              </button>
              <button className="btn" onClick={() => setTab('wallets')}>
                Connect wallet
              </button>
            </div>
          </div>
        )}
      </main>

      {modal?.type === 'holding' && (
        <AddHoldingModal
          holding={modal.holding}
          currency={user.currency}
          onClose={() => setModal(null)}
          onSaved={refreshAll}
        />
      )}
      {modal?.type === 'chart' && (
        <CoinChartModal coin={modal.coin} currency={user.currency} onClose={() => setModal(null)} />
      )}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}>
            🔔 {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
