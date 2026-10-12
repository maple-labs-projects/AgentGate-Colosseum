import { base, baseSepolia } from "viem/chains";

/**
 * Settlement chain: Base. Defaults to Base Sepolia (testnet USDC, no real money).
 * Set VITE_BASE_NETWORK=mainnet to read Base mainnet instead.
 */
const mainnet = import.meta.env.VITE_BASE_NETWORK === "mainnet";

export const activeChain = mainnet ? base : baseSepolia;
export const CHAIN_ID = activeChain.id;
export const CHAIN_NAME = mainnet ? "Base" : "Base Sepolia";
export const CHAIN_CAIP2 = `eip155:${CHAIN_ID}` as const;

const EXPLORER = mainnet ? "https://basescan.org" : "https://sepolia.basescan.org";
const RPC_URL = import.meta.env.VITE_BASE_RPC_URL ?? (mainnet ? "https://mainnet.base.org" : "https://sepolia.base.org");

/** Circle USDC (6 decimals). */
export const USDC_ADDRESS = (mainnet
  ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  : "0x036CbD53842c5426634e7929541eC2318f3dCF7e") as `0x${string}`;

/** Agent Gate receive address. Override with VITE_RECEIVE_ADDRESS. */
export const RECEIVE_ADDRESS = (import.meta.env.VITE_RECEIVE_ADDRESS ??
  "0xC90AC2b557088c50264de70969D71419311636c1") as `0x${string}`;

/**
 * ERC-8004 registries. These two addresses are live on Base Sepolia (the identity
 * registry answers name() = "AgentIdentity"). For Base mainnet set both env vars.
 */
export const IDENTITY_REGISTRY = (import.meta.env.VITE_IDENTITY_REGISTRY ??
  "0x8004A818BFB912233c491871b3d84c89A494BD9e") as `0x${string}`;
export const REPUTATION_REGISTRY = (import.meta.env.VITE_REPUTATION_REGISTRY ??
  "0x8004B663056A597Dffe9eCcC1965A193B7388713") as `0x${string}`;

export const AGENT_REGISTRY_CAIP10 = `eip155:${CHAIN_ID}:${IDENTITY_REGISTRY}` as const;

const SCAN_SLUG = mainnet ? "base" : "base-sepolia";

export const explorerTxUrl = (tx: string) => `${EXPLORER}/tx/${tx}`;
export const explorerAddressUrl = (address: string) => `${EXPLORER}/address/${address}`;
export const scan8004AgentUrl = (agentId: string | number) =>
  `https://${mainnet ? "" : "testnet."}8004scan.io/agents/${SCAN_SLUG}/${agentId}`;
export const quicknodeAgentUrl = (agentId: string | number) =>
  `https://erc-8004.quicknode.com/agents/${SCAN_SLUG}/${agentId}`;

export const CHAIN_PARAMS = {
  chainId: `0x${CHAIN_ID.toString(16)}`,
  chainName: CHAIN_NAME,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: [EXPLORER],
};
