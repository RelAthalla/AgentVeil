import type { ReactNode } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

import "./globals.css";
import { SiteShell } from "@/components/site-shell";
import { Web3Provider } from "@/components/web3-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AgentVeil",
  description: "Private intent creation and settlement frontend for AgentPay.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${plexMono.variable}`}>
        <Web3Provider>
          <SiteShell>{children}</SiteShell>
        </Web3Provider>
      </body>
    </html>
  );
}
