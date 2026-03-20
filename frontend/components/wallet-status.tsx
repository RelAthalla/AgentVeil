"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@xellar/kit";

import { useWallet } from "@/components/wallet-provider";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletStatus() {
  const { address, error, status } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ConnectButton.Custom>
      {({ disconnect, isConnected, openConnectModal, openProfileModal }) => {
        const visibleAddress = mounted && address ? shortenAddress(address) : "Not connected";

        return (
          <div className="wallet-panel">
            <div className="address-chip">{visibleAddress}</div>
            {isConnected ? (
              <>
                <button className="primary-button small" type="button" onClick={openProfileModal}>
                  Profile
                </button>
                <button className="secondary-button small" type="button" onClick={disconnect}>
                  Disconnect
                </button>
              </>
            ) : (
              <button className="primary-button small" type="button" onClick={openConnectModal}>
                {status === "connecting" ? "Connecting..." : "Connect"}
              </button>
            )}
            {error ? <p className="inline-error wallet-error">{error}</p> : null}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
