import { money, pct, tone } from '../format.js';

export default function Summary({ portfolio, currency }) {
  const t = portfolio.totals;
  const a = portfolio.analytics;
  return (
    <div className="stats">
      <div className="card stat">
        <span className="label">Portfolio value</span>
        <span className="value">{money(t.value, currency)}</span>
        <span className="sub muted">
          {t.assetsCount} asset{t.assetsCount === 1 ? '' : 's'}
        </span>
      </div>
      <div className="card stat">
        <span className="label">24h change</span>
        <span className={`value ${tone(t.change24hValue)}`}>{money(t.change24hValue, currency)}</span>
        <span className={`sub ${tone(t.change24hPct)}`}>{pct(t.change24hPct)}</span>
      </div>
      <div className="card stat">
        <span className="label">Total profit / loss</span>
        <span className={`value ${tone(t.pnl)}`}>{t.pnl == null ? '—' : money(t.pnl, currency)}</span>
        <span className={`sub ${tone(t.pnlPct)}`}>
          {t.pnl == null ? 'Add buy prices to track P/L' : pct(t.pnlPct)}
        </span>
      </div>
      <div className="card stat">
        <span className="label">Diversification</span>
        <span className="value cap">{a.diversification}</span>
        <span className="sub muted">
          {a.largestHolding ? `${a.largestHolding.symbol} is ${a.largestHolding.pct.toFixed(0)}% of portfolio` : '—'}
        </span>
      </div>
    </div>
  );
}
