"use client";

import {
  BrowserProvider,
  JsonRpcSigner,
  type Eip1193Provider,
} from "ethers";
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useConnectModal, useXellarAccount } from "@xellar/kit";
import { useAccount, useConnectorClient, useDisconnect } from "wagmi";
import type { Account, Chain, Client, Transport } from "viem";

type WalletContextValue = {
  address: string | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  status: "idle" | "connecting" | "connected" | "error";
  error: string | null;
  authProvider: string | null;
  userEmail: string | null;
  connectWallet: () => Promise<BrowserProvider>;
  disconnectWallet: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function clientToProvider(client: Client<Transport, Chain, Account>) {
  const { chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };

  return new BrowserProvider(transport as Eip1193Provider, network);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient, error: walletError } = useConnectorClient();
  const { open } = useConnectModal();
  const xellarAccount = useXellarAccount();

  const provider = useMemo(() => {
    if (!walletClient) {
      return null;
    }

    return clientToProvider(walletClient);
  }, [walletClient]);

  const signer = useMemo(() => {
    if (!provider || !walletClient) {
      return null;
    }

    return new JsonRpcSigner(provider, walletClient.account.address);
  }, [provider, walletClient]);

  const connectWallet = async () => {
    if (!provider) {
      open();
      throw new Error("Wallet not connected. Open the Xellar connect modal first.");
    }

    return provider;
  };

  const status: WalletContextValue["status"] = isConnecting
    ? "connecting"
    : isConnected
      ? "connected"
      : walletError
        ? "error"
        : "idle";

  const value = useMemo(
    () => ({
      address: address ?? null,
      provider,
      signer,
      status,
      error: walletError?.message ?? null,
      authProvider: xellarAccount?.provider ?? null,
      userEmail: xellarAccount?.email ?? null,
      connectWallet,
      disconnectWallet: disconnect,
    }),
    [address, provider, signer, status, walletError, xellarAccount, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used within WalletProvider.");
  }

  return context;
}
