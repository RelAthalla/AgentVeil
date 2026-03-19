import type { ReactNode } from "react";
import Link from "next/link";

import { WalletStatus } from "@/components/wallet-status";

const navLinks = [
  { href: "/create-intent", label: "Create Intent" },
  { href: "/fulfill-intent", label: "Fulfill Intent" },
  { href: "/intent-explorer", label: "Intent Explorer" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-frame">
      <header className="site-header panel glass-panel">
        <div>
          <Link href="/" className="brand-mark">
            AgentVeil
          </Link>
          <p className="brand-copy">Polkadot-ready private intent settlement for autonomous agents.</p>
        </div>

        <nav className="site-nav" aria-label="Primary">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>

        <WalletStatus />
      </header>

      <main className="site-main">{children}</main>
    </div>
  );
}
