import { CHAIN_CAIP2, IDENTITY_REGISTRY } from "../chain/base";

export function shortAddress(value: string): string {
  if (value.length < 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function globalAgentId(agentId: number): string {
  return `${CHAIN_CAIP2}:${IDENTITY_REGISTRY}:${agentId}`;
}

export function shortGlobalAgentId(agentId: number): string {
  return `${CHAIN_CAIP2}:0x8004…BD9e:${agentId}`;
}
