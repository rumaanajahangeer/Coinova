import { Contract, JsonRpcProvider, Network, formatUnits } from 'ethers';
import { config } from '../config.js';
import { ETHEREUM } from '../data/chains.js';
import { HttpError } from '../utils/http.js';

const ERC20_ABI = ['function balanceOf(address owner) view returns (uint256)'];

/**
 * Read native + known ERC-20 balances for an address (read-only, public data).
 * Returns only non-zero balances: [{ coinId, symbol, name, amount }]
 */
export async function fetchWalletBalances(address, chain = ETHEREUM) {
  const provider = new JsonRpcProvider(config.ethRpcUrl, Network.from(chain.chainId), {
    staticNetwork: Network.from(chain.chainId),
  });

  try {
    const results = [];

    try {
      const wei = await provider.getBalance(address);
      results.push({ ...chain.native, raw: wei });
    } catch {
      throw new HttpError(502, 'Could not read the wallet balance from the Ethereum RPC node');
    }

    const settled = await Promise.allSettled(
      chain.tokens.map(async (t) => {
        const contract = new Contract(t.address, ERC20_ABI, provider);
        return { ...t, raw: await contract.balanceOf(address) };
      })
    );
    for (const s of settled) {
      if (s.status === 'fulfilled') results.push(s.value);
    }

    return results
      .filter((r) => r.raw > 0n)
      .map((r) => ({
        coinId: r.coinId,
        symbol: r.symbol,
        name: r.name,
        amount: Number(formatUnits(r.raw, r.decimals)),
      }))
      .filter((r) => r.amount > 0);
  } finally {
    provider.destroy();
  }
}
