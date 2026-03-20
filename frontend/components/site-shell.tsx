"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { WalletStatus } from "@/components/wallet-status";

const navLinks = [
  { href: "/create-intent", label: "Create" },
  { href: "/fulfill-intent", label: "Fulfill" },
  { href: "/intent-explorer", label: "Explorer" },
  { href: "/refund-intent", label: "Refund" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="site-frame">
      <header className="site-header shell-card">
        <Link href="/" className="brand-block" aria-label="AgentVeil home">
          <span className="brand-badge">AV</span>
          <span>
            <strong>AgentVeil</strong>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${isActive ? " active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <WalletStatus />
      </header>

      <main className="site-main">{children}</main>
    </div>
  );
}
