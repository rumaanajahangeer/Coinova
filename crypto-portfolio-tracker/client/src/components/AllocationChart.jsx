import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { money } from '../format.js';

const COLORS = ['#111111', '#333333', '#555555', '#777777', '#999999', '#bbbbbb', '#3a3a3a', '#d0d0d4'];
const MAX_SLICES = 7;

export default function AllocationChart({ allocation, currency }) {
  if (!allocation.length) {
    return (
      <section className="card">
        <h2>Allocation</h2>
        <p className="muted">Add holdings to see how your portfolio is split.</p>
      </section>
    );
  }

  // Fold the long tail into "Other" so the chart stays readable.
  const head = allocation.slice(0, MAX_SLICES);
  const tail = allocation.slice(MAX_SLICES);
  const slices = tail.length
    ? [
        ...head,
        {
          coinId: 'other',
          symbol: 'Other',
          name: `${tail.length} other assets`,
          value: tail.reduce((a, x) => a + x.value, 0),
          pct: tail.reduce((a, x) => a + x.pct, 0),
        },
      ]
    : head;

  return (
    <section className="card">
      <h2>Allocation</h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={slices} dataKey="value" nameKey="symbol" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">
            {slices.map((s, i) => (
              <Cell key={s.coinId} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 16, color: '#000' }}
            formatter={(v, n) => [money(v, currency), n]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="legend">
        {slices.map((s, i) => (
          <li key={s.coinId}>
            <span className="dot" style={{ background: COLORS[i % COLORS.length] }} />
            <span>{s.symbol}</span>
            <span className="muted">{s.pct.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
