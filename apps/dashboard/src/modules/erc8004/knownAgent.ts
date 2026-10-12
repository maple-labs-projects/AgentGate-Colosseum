import type { Identity } from "../../types";

/**
 * The invoice agent for this site. Register it on Base from the Identity tab, then set
 * VITE_INVOICE_AGENT_ID to its id. Until then no id is shown, so nothing claims to be verified.
 */
const rawId = import.meta.env.VITE_INVOICE_AGENT_ID;
const parsedId = rawId ? Number(rawId) : NaN;

export const KNOWN_INVOICE_AGENT = {
  agentId: Number.isInteger(parsedId) && parsedId >= 0 ? parsedId : null,
  name: "Invoice Agent",
  wallet: "0x74882c29b00c0b427D2f901adA897DcCa850b219",
  owner: "0x74882c29b00c0b427D2f901adA897DcCa850b219",
} as const;

export function knownInvoiceIdentity(serviceId: string): Identity {
  return {
    agentId: KNOWN_INVOICE_AGENT.agentId,
    name: KNOWN_INVOICE_AGENT.name,
    claimedAs: "Your agent",
    wallet: KNOWN_INVOICE_AGENT.wallet,
    owner: KNOWN_INVOICE_AGENT.owner,
    status: KNOWN_INVOICE_AGENT.agentId === null ? "claimed" : "verified",
    reputation: null,
    services: [serviceId],
  };
}
