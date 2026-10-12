/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_NETWORK?: string;
  readonly VITE_BASE_RPC_URL?: string;
  readonly VITE_RECEIVE_ADDRESS?: string;
  readonly VITE_IDENTITY_REGISTRY?: string;
  readonly VITE_REPUTATION_REGISTRY?: string;
  readonly VITE_INVOICE_AGENT_ID?: string;
  readonly VITE_BLOG_ANALYTICS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
