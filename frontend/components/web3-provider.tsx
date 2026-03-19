"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Config, WagmiProvider } from "wagmi";
import { XellarKitProvider, darkTheme, defaultConfig } from "@xellar/kit";

import { WalletProvider } from "@/components/wallet-provider";
import { polkadotHubTestnet } from "@/lib/polkadot-testnet";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const xellarAppId = process.env.NEXT_PUBLIC_XELLAR_APP_ID;
const xellarEnv = process.env.NEXT_PUBLIC_XELLAR_ENV ?? "sandbox";

if (!walletConnectProjectId) {
  throw new Error("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.");
}

if (!xellarAppId) {
  throw new Error("Missing NEXT_PUBLIC_XELLAR_APP_ID.");
}

const config = defaultConfig({
  appName: "AgentPay Shield",
  walletConnectProjectId,
  xellarAppId,
  xellarEnv: xellarEnv === "production" ? "production" : "sandbox",
  chains: [polkadotHubTestnet],
}) as Config;

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <XellarKitProvider theme={darkTheme}>
          <WalletProvider>{children}</WalletProvider>
        </XellarKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
