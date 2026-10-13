import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api.js';
import { compactMoney, formatAxisTime, formatDateTime, money, pct, tone } from '../format.js';
import { usePolling } from '../usePolling.js';

const RANGES = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export default function ValueChart({ currency, refreshKey }) {
  const [days, setDays] = useState(30);
  const [mode, setMode] = useState('estimated'); // 'estimated' | 'snapshots'
  const { data, error, loading } = usePolling(() => api.history(days), 120_000, [days, currency, refreshKey]);

  const series = data ? data[mode] : [];
  const stats = data?.stats?.[mode];
  const color = stats && stats.change < 0 ? '#737373' : '#000000';

  return (
    <section className="card">
      <div className="row between wrap">
        <div>
          <h2>Portfolio value</h2>
          {stats ? (
            <span className={`tag ${tone(stats.change)}`}>
              {money(stats.change, currency)} ({pct(stats.changePct)}) in range
            </span>
          ) : (
            <span className="muted small">Not enough data for this range yet</span>
          )}
        </div>
        <div className="row gap">
          <div className="seg">
            <button className={mode === 'estimated' ? 'on' : ''} onClick={() => setMode('estimated')}>
              Estimated
            </button>
            <button className={mode === 'snapshots' ? 'on' : ''} onClick={() => setMode('snapshots')}>
              Recorded
            </button>
          </div>
          <div className="seg">
            {RANGES.map((r) => (
              <button key={r.days} className={days === r.days ? 'on' : ''} onClick={() => setDays(r.days)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="hint">
        {mode === 'estimated'
          ? 'Estimated: your current holdings priced at historical rates (assumes you held them throughout).'
          : 'Recorded: actual portfolio value snapshots saved while you use the app and hourly in the background.'}
      </p>

      <div className="chart-box">
        {error && <p className="error">{error}</p>}
        {loading && !series.length && <p className="muted">Loading history…</p>}
        {!loading && series.length < 2 && !error && (
          <p className="muted">
            {mode === 'snapshots'
              ? 'Snapshots build up over time. Check back in a little while, or switch to “Estimated”.'
              : 'Add some holdings to see your value history.'}
          </p>
        )}
        {series.length >= 2 && (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="valfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ececef" vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(t) => formatAxisTime(t, days)}
                stroke="#b3b3b8"
                tick={{ fontSize: 12, fill: '#737373' }}
                minTickGap={50}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#b3b3b8"
                tick={{ fontSize: 12, fill: '#737373' }}
                width={70}
                tickFormatter={(v) => compactMoney(v, currency)}
              />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 16, color: '#000' }}
                labelFormatter={formatDateTime}
                formatter={(v) => [money(v, currency), 'Value']}
              />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#valfill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {stats && (
        <div className="mini-stats">
          <div>
            <span className="label">High</span>
            <strong>{money(stats.high, currency)}</strong>
          </div>
          <div>
            <span className="label">Low</span>
            <strong>{money(stats.low, currency)}</strong>
          </div>
          <div>
            <span className="label">Max drawdown</span>
            <strong className="neg">-{stats.maxDrawdownPct.toFixed(2)}%</strong>
          </div>
          {mode === 'estimated' && data.coverage.of > data.coverage.coins && (
            <div>
              <span className="label">Coverage</span>
              <strong>
                {data.coverage.coins}/{data.coverage.of} coins
              </strong>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
