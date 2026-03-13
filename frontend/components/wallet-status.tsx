"use client";

import { useWallet } from "@/components/wallet-provider";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletStatus() {
  const { address, connectWallet, error, status } = useWallet();

  return (
    <div className="wallet-panel">
      <div>
        <span className="wallet-label">Wallet</span>
        <strong>{address ? shortenAddress(address) : "Not connected"}</strong>
        {error ? <p className="inline-error">{error}</p> : null}
      </div>

      <button className="primary-button" type="button" onClick={() => void connectWallet()}>
        {status === "connecting" ? "Connecting..." : address ? "Reconnect" : "Connect Wallet"}
      </button>
    </div>
  );
}
