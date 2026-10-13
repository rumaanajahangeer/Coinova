import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { shortAddress } from '../format.js';

const isAddress = (a) => /^0x[a-fA-F0-9]{40}$/.test(a.trim());

export default function WalletPanel({ onChanged }) {
  const [wallets, setWallets] = useState([]);
  const [account, setAccount] = useState(null); // currently connected MetaMask account
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);

  const eth = typeof window !== 'undefined' ? window.ethereum : undefined;

  const load = useCallback(
    () =>
      api
        .wallets()
        .then((r) => setWallets(r.wallets))
        .catch((e) => setMsg({ type: 'error', text: e.message })),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  // Follow MetaMask account switches.
  useEffect(() => {
    if (!eth?.on) return undefined;
    const onAccounts = (accounts) => setAccount(accounts[0] || null);
    eth.on('accountsChanged', onAccounts);
    eth
      .request({ method: 'eth_accounts' })
      .then(onAccounts)
      .catch(() => {});
    return () => eth.removeListener?.('accountsChanged', onAccounts);
  }, [eth]);

  async function connect() {
    setMsg(null);
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0] || null);
    } catch (e) {
      setMsg({ type: 'error', text: e.code === 4001 ? 'Connection request was rejected in MetaMask.' : e.message });
    }
  }

  async function doImport(address, label) {
    setBusy(address);
    setMsg(null);
    try {
      const r = await api.importWallet(address, label);
      setMsg({
        type: 'ok',
        text: r.imported
          ? `Imported ${r.imported} asset${r.imported === 1 ? '' : 's'} from ${shortAddress(r.address)}.`
          : `No supported balances found for ${shortAddress(r.address)}.`,
      });
      await load();
      onChanged();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setBusy('');
    }
  }

  async function remove(address) {
    if (!window.confirm('Remove this wallet and the holdings imported from it?')) return;
    try {
      await api.deleteWallet(address);
      await load();
      onChanged();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  }

  return (
    <div className="grid two">
      <section className="card">
        <h2>MetaMask</h2>
        {eth ? (
          account ? (
            <div className="stack">
              <div className="picked">
                <span className="dot" style={{ background: '#000' }} />
                <strong>{shortAddress(account)}</strong>
                <span className="muted">connected</span>
              </div>
              <button className="btn primary" disabled={!!busy} onClick={() => doImport(account, 'MetaMask')}>
                {busy === account ? 'Importing…' : 'Import balances'}
              </button>
            </div>
          ) : (
            <div className="stack">
              <p className="muted">Connect MetaMask to read your Ethereum balances. No transactions or signatures are requested.</p>
              <button className="btn primary" onClick={connect}>
                Connect MetaMask
              </button>
            </div>
          )
        ) : (
          <p className="muted">
            MetaMask wasn’t detected in this browser. Install the extension, or add any address below as a watch-only wallet.
          </p>
        )}

        <h2 className="spaced">Watch an address</h2>
        <form
          className="row gap"
          onSubmit={(e) => {
            e.preventDefault();
            doImport(manual.trim(), '');
            setManual('');
          }}
        >
          <input
            className="grow"
            placeholder="0x… Ethereum address"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          <button className="btn" disabled={!isAddress(manual) || !!busy}>
            Import
          </button>
        </form>
        <p className="hint">
          Reads ETH plus common ERC-20s (USDT, USDC, DAI, LINK, UNI, WBTC) on Ethereum mainnet. Read-only: your keys never leave your wallet.
        </p>
        {msg && <p className={msg.type === 'error' ? 'error' : 'ok'}>{msg.text}</p>}
      </section>

      <section className="card">
        <h2>Connected wallets ({wallets.length})</h2>
        {!wallets.length && <p className="muted">No wallets imported yet.</p>}
        <ul className="alert-list">
          {wallets.map((w) => (
            <li key={w.address}>
              <div className="grow">
                <strong>{w.label || 'Wallet'}</strong>
                <small className="muted block mono">{w.address}</small>
              </div>
              <button className="btn" disabled={!!busy} onClick={() => doImport(w.address, w.label)}>
                {busy === w.address ? 'Syncing…' : 'Refresh'}
              </button>
              <button className="icon-btn danger" title="Remove wallet" onClick={() => remove(w.address)}>
                🗑
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
