export type AccountPayload = { ethWei: string; usdcRaw: string; transactions: unknown[]; usdcTransfers: unknown[] };

const MAINNET = process.env.VITE_BASE_NETWORK === "mainnet" || process.env.BASE_NETWORK === "mainnet";
const RPC_URL = process.env.BASE_RPC_URL ?? (MAINNET ? "https://mainnet.base.org" : "https://sepolia.base.org");
const EXPLORER_API = MAINNET ? "https://base.blockscout.com/api" : "https://base-sepolia.blockscout.com/api";
const USDC = MAINNET
  ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  : "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const cache = new Map<string, { at: number; body: AccountPayload }>();
const inflight = new Map<string, Promise<AccountPayload>>();

export function readAddress(value: string | null | undefined): string | null {
  const address = value ?? "";
  return /^0x[a-fA-F0-9]{40}$/.test(address) ? address : null;
}

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = (await response.json()) as { result?: unknown; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message || "RPC error");
  return body.result;
}

/** Recent USDC transfers for the address from Blockscout (free, no key). Empty list if it is unreachable. */
async function usdcTransfers(address: string): Promise<unknown[]> {
  const search = new URLSearchParams({
    module: "account",
    action: "tokentx",
    address,
    contractaddress: USDC,
    page: "1",
    offset: "10",
    sort: "desc",
  });
  try {
    const response = await fetch(`${EXPLORER_API}?${search}`);
    const body = (await response.json()) as { result?: unknown };
    return Array.isArray(body.result) ? body.result.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export async function loadBaseAccount(address: string): Promise<AccountPayload> {
  const hit = cache.get(address);
  if (hit && Date.now() - hit.at < 30_000) return hit.body;
  const pending = inflight.get(address);
  if (pending) return pending;
  const job = (async () => {
    const balanceOf = `0x70a08231${address.slice(2).toLowerCase().padStart(64, "0")}`;
    const [ethHex, usdcHex, transfers] = await Promise.all([
      rpc("eth_getBalance", [address, "latest"]),
      rpc("eth_call", [{ to: USDC, data: balanceOf }, "latest"]),
      usdcTransfers(address),
    ]);
    const body: AccountPayload = {
      ethWei: String(BigInt(String(ethHex ?? "0x0"))),
      usdcRaw: String(BigInt(String(usdcHex ?? "0x0"))),
      transactions: [],
      usdcTransfers: transfers,
    };
    cache.set(address, { at: Date.now(), body });
    return body;
  })().finally(() => inflight.delete(address));
  inflight.set(address, job);
  return job;
}
