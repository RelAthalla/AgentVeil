"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { WalletStatus } from "@/components/wallet-status";

const navLinks = [
  { href: "/create-intent", label: "Create Intent" },
  { href: "/fulfill-intent", label: "Fulfill Intent" },
  { href: "/intent-explorer", label: "Intent Explorer" },
  { href: "/refund-intent", label: "Refund Intent" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="site-frame">
      <header className="site-header shell-card">
        <Link href="/" className="brand-block" aria-label="AgentVeil home">
          <BrandLogo className="brand-logo" />
          <span>
            <strong>AgentVeil</strong>
            <small>Private intent settlement</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={`nav-link${isActive ? " active" : ""}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <WalletStatus />
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer shell-card">
        <div className="footer-brand">
          <BrandLogo className="footer-logo" />
          <div>
            <strong>AgentVeil</strong>
            <p>Private Intent Settlement for Autonomous Agents.</p>
          </div>
        </div>

        <div className="footer-columns">
          <div>
            <span className="footer-label">Flows</span>
            <Link href="/create-intent">Create Intent</Link>
            <Link href="/fulfill-intent">Fulfill Intent</Link>
            <Link href="/refund-intent">Refund Intent</Link>
          </div>
          <div>
            <span className="footer-label">Read</span>
            <Link href="/intent-explorer">Intent Explorer</Link>
            <span>Polkadot-ready escrow UX</span>
            <span>Built for autonomous agents</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
