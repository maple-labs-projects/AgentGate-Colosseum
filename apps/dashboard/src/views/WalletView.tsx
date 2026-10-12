import { RECEIVE_ADDRESS } from "../modules/chain/base";
import { WalletAccounts } from "../screens/WalletAccounts";

export function WalletView() {
  return (
    <div className="ledger-page">
      <header className="obs-top">
        <div>
          <h1>Wallet</h1>
          <p className="obs-meta">Balances and recent USDC activity for the Agent Gate receive address.</p>
        </div>
      </header>
      <WalletAccounts />
      <section className="ledger-card">
        <h2>Owner address</h2>
        <p className="obs-lead">The address that receives USDC for your services. Set it with VITE_RECEIVE_ADDRESS.</p>
        <div className="obs-kpis">
          <div className="obs-kpi"><span>Owner</span><strong className="mono">{RECEIVE_ADDRESS}</strong></div>
        </div>
      </section>
    </div>
  );
}
