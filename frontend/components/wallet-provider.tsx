"use client";

import {
  BrowserProvider,
  type Eip1193Provider,
} from "ethers";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WalletContextValue = {
  address: string | null;
  provider: BrowserProvider | null;
  status: "idle" | "connecting" | "connected" | "error";
  error: string | null;
  connectWallet: () => Promise<BrowserProvider>;
};

type InjectedWallet = Eip1193Provider & {
  on?: (event: string, listener: (accounts: unknown) => void) => void;
  removeListener?: (event: string, listener: (accounts: unknown) => void) => void;
};

declare global {
  interface Window {
    ethereum?: InjectedWallet;
  }
}

const WalletContext = createContext<WalletContextValue | null>(null);

function getEthereumProvider(): InjectedWallet {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No injected wallet found. Install MetaMask or another EVM wallet.");
  }

  return window.ethereum;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [status, setStatus] = useState<WalletContextValue["status"]>("idle");
  const [error, setError] = useState<string | null>(null);

  const syncKnownAccount = useCallback(async () => {
    try {
      const injectedProvider = getEthereumProvider();
      const browserProvider = new BrowserProvider(injectedProvider);
      const accounts = (await browserProvider.send("eth_accounts", [])) as string[];

      if (accounts.length > 0) {
        setProvider(browserProvider);
        setAddress(accounts[0]);
        setStatus("connected");
        setError(null);
      }
    } catch {
      // A disconnected wallet should not break the shell.
    }
  }, []);

  useEffect(() => {
    void syncKnownAccount();
  }, [syncKnownAccount]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts: unknown) => {
      if (!Array.isArray(accounts) || accounts.length === 0) {
        setAddress(null);
        setProvider(null);
        setStatus("idle");
        return;
      }

      setAddress(String(accounts[0]));
      setStatus("connected");
      setError(null);
    };

    const injectedProvider = window.ethereum;
    injectedProvider.on?.("accountsChanged", handleAccountsChanged);

    return () => {
      injectedProvider.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    setStatus("connecting");
    setError(null);

    try {
      const injectedProvider = getEthereumProvider();
      const browserProvider = new BrowserProvider(injectedProvider);
      await browserProvider.send("eth_requestAccounts", []);
      const signer = await browserProvider.getSigner();
      const nextAddress = await signer.getAddress();

      setProvider(browserProvider);
      setAddress(nextAddress);
      setStatus("connected");
      return browserProvider;
    } catch (connectError) {
      const message = connectError instanceof Error ? connectError.message : "Wallet connection failed.";
      setStatus("error");
      setError(message);
      throw connectError;
    }
  }, []);

  const value = useMemo(
    () => ({ address, provider, status, error, connectWallet }),
    [address, connectWallet, error, provider, status],
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
