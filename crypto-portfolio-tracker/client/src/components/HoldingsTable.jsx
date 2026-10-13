import { amount, money, pct, shortAddress, tone } from '../format.js';
import { Logo } from './CoinPicker.jsx';

export default function HoldingsTable({ holdings, currency, onEdit, onDelete, onChart, onAlert }) {
  if (!holdings.length) {
    return (
      <div className="empty-state">
        <p>No holdings yet.</p>
        <p className="muted">Add a coin manually, or import balances from a wallet.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th className="num">Price</th>
            <th className="num">24h</th>
            <th className="num">Holdings</th>
            <th className="num">Value</th>
            <th className="num">Profit / Loss</th>
            <th className="num">Allocation</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.id}>
              <td>
                <button className="asset" onClick={() => onChart(h)} title="Price chart">
                  <Logo src={h.image} alt="" />
                  <span>
                    <strong>{h.name}</strong>
                    <small className="muted">
                      {h.symbol}
                      {h.source === 'wallet' && <span className="pill">wallet {shortAddress(h.walletAddress)}</span>}
                    </small>
                  </span>
                </button>
              </td>
              <td className="num">{h.priceMissing ? <span className="muted">n/a</span> : money(h.price, currency)}</td>
              <td className={`num ${tone(h.change24h)}`}>{pct(h.change24h)}</td>
              <td className="num">{amount(h.amount)}</td>
              <td className="num">
                <strong>{money(h.value, currency)}</strong>
              </td>
              <td className={`num ${tone(h.pnl)}`}>
                {h.pnl == null ? (
                  <span className="muted" title="Add a buy price to see profit / loss">
                    —
                  </span>
                ) : (
                  <>
                    {money(h.pnl, currency)}
                    <small>{pct(h.pnlPct)}</small>
                  </>
                )}
              </td>
              <td className="num">
                <div className="bar" title={`${h.allocationPct.toFixed(1)}%`}>
                  <span style={{ width: `${Math.min(100, h.allocationPct)}%` }} />
                </div>
                <small className="muted">{h.allocationPct.toFixed(1)}%</small>
              </td>
              <td className="actions">
                <button className="icon-btn" title="Set price alert" onClick={() => onAlert(h)}>
                  🔔
                </button>
                <button className="icon-btn" title="Edit" onClick={() => onEdit(h)}>
                  ✎
                </button>
                <button className="icon-btn danger" title="Remove" onClick={() => onDelete(h)}>
                  🗑
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
