import { pct, tone } from '../format.js';
import { Logo } from './CoinPicker.jsx';

function Row({ label, item, value }) {
  return (
    <li>
      <span className="muted">{label}</span>
      {item ? (
        <span className="insight">
          <Logo src={item.image} alt="" />
          <strong>{item.symbol}</strong>
          <span className={tone(value)}>{pct(value)}</span>
        </span>
      ) : (
        <span className="muted">—</span>
      )}
    </li>
  );
}

export default function Insights({ analytics }) {
  return (
    <section className="card">
      <h2>Insights</h2>
      <ul className="insights">
        <Row label="Best performer (all time)" item={analytics.bestPerformer} value={analytics.bestPerformer?.pct} />
        <Row label="Worst performer (all time)" item={analytics.worstPerformer} value={analytics.worstPerformer?.pct} />
        <Row label="Best today" item={analytics.bestToday} value={analytics.bestToday?.pct} />
        <Row label="Worst today" item={analytics.worstToday} value={analytics.worstToday?.pct} />
      </ul>
      <p className="hint">
        Concentration index (HHI): <strong>{analytics.hhi}</strong> — under 1,500 is well diversified, over 2,500 is concentrated.
      </p>
    </section>
  );
}
