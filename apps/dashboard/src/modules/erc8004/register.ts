import {
  createPublicClient,
  decodeEventLog,
  encodeFunctionData,
  http,
  type Address,
  type Hash,
  type Hex,
} from "viem";
import { IDENTITY_REGISTRY, activeChain } from "../chain/base";
import { identityRegistryAbi } from "./abi";
import { agentUriFromCard, buildAgentCard } from "./card";
import { connectChainWallet } from "./wallet";

function publicClient() {
  return createPublicClient({
    chain: activeChain,
    transport: http(activeChain.rpcUrls.default.http[0]),
  });
}

function agentIdFromLogs(logs: { address: Address; data: Hex; topics: readonly Hex[] }[]): number {
  for (const log of logs) {
    if (log.address.toLowerCase() !== IDENTITY_REGISTRY.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: identityRegistryAbi,
        data: log.data,
        topics: log.topics as [Hex, ...Hex[]] | [],
      });
      if (decoded.eventName === "Registered") {
        const agentId = decoded.args.agentId;
        if (agentId > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Agent id is too large to store.");
        return Number(agentId);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("too large")) throw error;
    }
  }
  throw new Error("Registered event was not in the receipt.");
}

async function send(
  walletClient: Awaited<ReturnType<typeof connectChainWallet>>["walletClient"],
  account: Address,
  data: Hex,
): Promise<Hash> {
  const client = publicClient();
  const gas = await client.estimateGas({ account, to: IDENTITY_REGISTRY, data });
  return walletClient.sendTransaction({
    account,
    chain: activeChain,
    to: IDENTITY_REGISTRY,
    data,
    gas: (gas * 120n) / 100n,
  });
}

/**
 * Browser port of midnightx402 `registerAgentOnChain`.
 * register(agentURI) → read Registered → setAgentURI with the id filled in.
 * The connected wallet signs. It needs testnet MON for gas.
 */
export async function registerAgentOnChain(input: {
  name: string;
  description: string;
  walletAddress?: Address;
}): Promise<{
  agentId: number;
  agentURI: string;
  txHash: Hash;
  setUriHash: Hash;
  walletAddress: Address;
  owner: Address;
}> {
  const { address, walletClient } = await connectChainWallet();
  if (input.walletAddress && input.walletAddress.toLowerCase() !== address.toLowerCase()) {
    throw new Error("Connected wallet does not match the agent wallet.");
  }

  const draft = buildAgentCard({
    name: input.name,
    description: input.description,
    walletAddress: address,
  });
  const client = publicClient();
  const registerData = encodeFunctionData({
    abi: identityRegistryAbi,
    functionName: "register",
    args: [agentUriFromCard(draft)],
  });
  const txHash = await send(walletClient, address, registerData);
  const receipt = await client.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") throw new Error(`register transaction failed: ${txHash}`);
  const agentId = agentIdFromLogs(receipt.logs);

  const card = buildAgentCard({
    name: input.name,
    description: input.description,
    walletAddress: address,
    agentId,
  });
  const agentURI = agentUriFromCard(card);
  const setUriData = encodeFunctionData({
    abi: identityRegistryAbi,
    functionName: "setAgentURI",
    args: [BigInt(agentId), agentURI],
  });
  const setUriHash = await send(walletClient, address, setUriData);
  const setUriReceipt = await client.waitForTransactionReceipt({ hash: setUriHash });
  if (setUriReceipt.status !== "success") throw new Error(`setAgentURI failed: ${setUriHash}`);

  return { agentId, agentURI, txHash, setUriHash, walletAddress: address, owner: address };
}

export async function readOnchainAgent(agentId: number): Promise<{
  agentId: number;
  owner: Address;
  tokenURI: string;
  agentWallet: Address;
}> {
  const client = publicClient();
  const [owner, tokenURI, agentWallet] = await Promise.all([
    client.readContract({
      address: IDENTITY_REGISTRY,
      abi: identityRegistryAbi,
      functionName: "ownerOf",
      args: [BigInt(agentId)],
    }),
    client.readContract({
      address: IDENTITY_REGISTRY,
      abi: identityRegistryAbi,
      functionName: "tokenURI",
      args: [BigInt(agentId)],
    }),
    client.readContract({
      address: IDENTITY_REGISTRY,
      abi: identityRegistryAbi,
      functionName: "getAgentWallet",
      args: [BigInt(agentId)],
    }),
  ]);
  return { agentId, owner, tokenURI, agentWallet };
}
