import Link from "next/link";

import { HomeTypingCard } from "@/components/home-typing-card";

const pages = [
  {
    href: "/create-intent",
    title: "Create Intent",
    body: "Generate a private commitment, lock escrow, and submit the intent from your wallet.",
    accent: "Escrow",
  },
  {
    href: "/fulfill-intent",
    title: "Fulfill Intent",
    body: "Reveal the matching preimage and release funds to the fulfiller without exposing strategy up front.",
    accent: "Settlement",
  },
  {
    href: "/intent-explorer",
    title: "Intent Explorer",
    body: "Inspect public commitment state, escrow amount, deadline, and final settlement status.",
    accent: "Read Flow",
  },
  {
    href: "/refund-intent",
    title: "Refund Intent",
    body: "Recover escrow after expiry when a vendor never settles the private intent.",
    accent: "Recovery",
  },
];

const comparisons = [
  {
    title: "Without AgentVeil",
    rows: ["Buy: Dataset_X", "Price: 5 DOT", "Buyer: 0xabc..."],
    result: "Strategy exposed",
    tone: "negative",
  },
  {
    title: "With AgentPay Shield",
    rows: ["Intent: 0x91fa2c...", "Status: ZK Verified", "Buyer: hidden until settlement"],
    result: "Strategy protected",
    tone: "positive",
  },
];

export default function HomePage() {
  return (
    <div className="home-stack">
      <section className="home-hero">
        <div className="hero-copy-block">
          <span className="section-tag">Infrastructure for the autonomous era</span>
          <h1>
            Private intent settlement
            <br />
            for autonomous agents.
          </h1>
          <p>
            AgentVeil gives AI agents a cleaner way to buy data, pay APIs, rent compute, and settle
            payments on Polkadot without leaking their operating intent to the public chain.
          </p>

          <div className="hero-actions">
            <Link href="/create-intent" className="primary-button hero-link">
              Enter App
            </Link>
            <Link href="/intent-explorer" className="secondary-button hero-link">
              Explore Intents
            </Link>
          </div>

          <div className="hero-stats compact-stats">
            <div>
              <strong>4</strong>
              <span>Workflow Pages</span>
            </div>
            <div>
              <strong>Private</strong>
              <span>Intent Metadata</span>
            </div>
            <div>
              <strong>Trustless</strong>
              <span>Escrow Settlement</span>
            </div>
          </div>
        </div>

        <div className="hero-visual-stage">
          <HomeTypingCard />
          <div className="visual-frame shell-card">
            <div className="visual-grid" />
            <div className="floating-node primary-node shell-card">
              <span className="node-tag">Settlement</span>
              <h3>Intent locked</h3>
              <p>Buyer publishes only the commitment hash while escrow stays live on-chain.</p>
              <div className="node-meter">
                <span />
              </div>
            </div>
            <div className="floating-node secondary-node shell-card">
              <span className="node-tag">Privacy</span>
              <h3>Operator shield active</h3>
              <p>Strategy-sensitive intent data remains hidden until the flow reaches settlement.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section grid-two">
        <div className="shell-card comparison-panel">
          <div className="section-heading">
            <span className="section-tag">Public vs private</span>
            <h2>Why private intent settlement matters</h2>
          </div>
          <div className="comparison-grid">
            {comparisons.map((item) => (
              <div key={item.title} className={`comparison-card ${item.tone}`}>
                <strong>{item.title}</strong>
                <div className="comparison-box">
                  {item.rows.map((row) => (
                    <span key={row}>{row}</span>
                  ))}
                </div>
                <em>{item.result}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="flow-card-stack">
          {pages.map((page) => (
            <Link key={page.href} href={page.href} className="shell-card action-card">
              <span className="section-tag compact">{page.accent}</span>
              <h2>{page.title}</h2>
              <p>{page.body}</p>
              <span className="action-link">Open flow</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
