import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api.js';
import { formatAxisTime, formatDateTime, money, pct, tone } from '../format.js';
import { usePolling } from '../usePolling.js';
import Modal from './Modal.jsx';

const RANGES = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export default function CoinChartModal({ coin, currency, onClose }) {
  const [days, setDays] = useState(7);
  const { data, error, loading } = usePolling(() => api.coinChart(coin.coinId, days), 120_000, [coin.coinId, days]);

  const points = data?.points || [];
  const first = points[0]?.price;
  const last = points.at(-1)?.price;
  const change = first ? ((last - first) / first) * 100 : null;
  const color = change != null && change < 0 ? '#737373' : '#000000';

  return (
    <Modal title={`${coin.name} (${coin.symbol})`} onClose={onClose} wide>
      <div className="row between wrap">
        <div>
          <div className="big-number">{money(last ?? coin.price, currency)}</div>
          <span className={`tag ${tone(change)}`}>{pct(change)} over selected range</span>
        </div>
        <div className="seg">
          {RANGES.map((r) => (
            <button key={r.days} className={days === r.days ? 'on' : ''} onClick={() => setDays(r.days)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-box">
        {error && <p className="error">{error}</p>}
        {loading && !points.length && <p className="muted">Loading chart…</p>}
        {points.length > 0 && (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={points} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="coinfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#ececef" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={(t) => formatAxisTime(t, days)}
                stroke="#b3b3b8"
                tick={{ fontSize: 12, fill: '#737373' }}
                minTickGap={40}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#b3b3b8"
                tick={{ fontSize: 12, fill: '#737373' }}
                width={72}
                tickFormatter={(v) => money(v, currency)}
              />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 16, color: '#000' }}
                labelFormatter={formatDateTime}
                formatter={(v) => [money(v, currency), 'Price']}
              />
              <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#coinfill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Modal>
  );
}
