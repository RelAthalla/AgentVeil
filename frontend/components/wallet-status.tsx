"use client";

import { ConnectButton } from "@xellar/kit";

import { useWallet } from "@/components/wallet-provider";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletStatus() {
  const { address, authProvider, error, status, userEmail } = useWallet();

  return (
    <ConnectButton.Custom>
      {({ disconnect, isConnected, openConnectModal, openProfileModal }) => (
        <div className="wallet-panel">
          <div>
            <span className="wallet-label">Wallet</span>
            <strong>{address ? shortenAddress(address) : "Not connected"}</strong>
            {userEmail ? <p>{userEmail}</p> : null}
            {authProvider ? <p>Auth via {authProvider}</p> : null}
            {error ? <p className="inline-error">{error}</p> : null}
          </div>

          {isConnected ? (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="primary-button" type="button" onClick={openProfileModal}>
                Profile
              </button>
              <button className="primary-button" type="button" onClick={disconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <button className="primary-button" type="button" onClick={openConnectModal}>
              {status === "connecting" ? "Connecting..." : "Connect With Xellar"}
            </button>
          )}
        </div>
      )}
    </ConnectButton.Custom>
  );
}
