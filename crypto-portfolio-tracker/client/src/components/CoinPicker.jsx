import { useEffect, useState } from 'react';
import { api } from '../api.js';

function Logo({ src, alt }) {
  return src ? <img className="coin-img" src={src} alt={alt} /> : <span className="coin-img ph" />;
}

/** Search CoinGecko (or pick from the top coins) and report the chosen coin. */
export default function CoinPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [top, setTop] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.topCoins(12).then(setTop).catch(() => {});
  }, []);

  useEffect(() => {
    if (value || query.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    const t = setTimeout(() => {
      api
        .searchCoins(query.trim())
        .then((r) => {
          setResults(r);
          setError('');
        })
        .catch((e) => setError(e.message));
    }, 350);
    return () => clearTimeout(t);
  }, [query, value]);

  if (value) {
    return (
      <div className="picked">
        <Logo src={value.image} alt="" />
        <strong>{value.name}</strong>
        <span className="muted">{value.symbol}</span>
        <button type="button" className="link-btn" onClick={() => onChange(null)}>
          Change
        </button>
      </div>
    );
  }

  const searching = query.trim().length >= 2;
  const list = searching ? results : top;

  return (
    <div>
      <input
        autoFocus
        placeholder="Search coins (e.g. bitcoin, sol, doge)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <p className="hint">{searching ? 'Search results' : 'Popular coins'}</p>
      <ul className="coin-list">
        {list.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => {
                onChange({ id: c.id, name: c.name, symbol: (c.symbol || '').toUpperCase(), image: c.image });
                setQuery('');
              }}
            >
              <Logo src={c.image} alt="" />
              <span>{c.name}</span>
              <span className="muted">{(c.symbol || '').toUpperCase()}</span>
              {c.rank ? <span className="rank">#{c.rank}</span> : null}
            </button>
          </li>
        ))}
        {searching && !list.length && !error && <li className="empty">No coins found</li>}
      </ul>
    </div>
  );
}

export { Logo };
