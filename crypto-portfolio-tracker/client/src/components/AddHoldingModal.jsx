import { useState } from 'react';
import { api } from '../api.js';
import CoinPicker from './CoinPicker.jsx';
import Modal from './Modal.jsx';

export default function AddHoldingModal({ holding, currency, onClose, onSaved }) {
  const editing = !!holding;
  const walletRow = holding?.source === 'wallet';
  const [coin, setCoin] = useState(
    editing ? { id: holding.coinId, name: holding.name, symbol: holding.symbol, image: holding.image } : null
  );
  const [amount, setAmount] = useState(editing ? String(holding.amount) : '');
  const [buyPrice, setBuyPrice] = useState(editing && holding.buyPrice != null ? String(holding.buyPrice) : '');
  const [notes, setNotes] = useState(editing ? holding.notes : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const price = buyPrice.trim() === '' ? null : Number(buyPrice);
      if (editing) {
        const body = { buyPrice: price, notes };
        if (!walletRow) body.amount = Number(amount);
        await api.updateHolding(holding.id, body);
      } else {
        await api.addHolding({ coinId: coin.id, amount: Number(amount), buyPrice: price, notes });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={editing ? `Edit ${holding.symbol}` : 'Add a cryptocurrency'} onClose={onClose}>
      <form onSubmit={submit} className="stack">
        {editing ? (
          <div className="picked">
            {coin.image && <img className="coin-img" src={coin.image} alt="" />}
            <strong>{coin.name}</strong>
            <span className="muted">{coin.symbol}</span>
          </div>
        ) : (
          <CoinPicker value={coin} onChange={setCoin} />
        )}

        {(coin || editing) && (
          <>
            <label>
              Amount held
              <input
                type="number"
                step="any"
                min="0"
                required
                disabled={walletRow}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {walletRow && <span className="hint">Synced from your wallet. Re-import it to refresh.</span>}
              {!editing && <span className="hint">Adding a coin you already hold merges it into one row.</span>}
            </label>
            <label>
              Average buy price per coin ({currency.toUpperCase()}) — optional
              <input
                type="number"
                step="any"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="Used to calculate profit / loss"
              />
            </label>
            <label>
              Notes — optional
              <input maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </>
        )}

        {error && <p className="error">{error}</p>}
        <div className="row end">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy || !coin}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add to portfolio'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
