import Link from "next/link";

const pages = [
  {
    href: "/create-intent",
    title: "Create Intent",
    body: "Generate a private commitment, lock escrow, and submit from your wallet.",
    accent: "Escrow",
  },
  {
    href: "/fulfill-intent",
    title: "Fulfill Intent",
    body: "Reveal the original preimage and receive the escrowed payout.",
    accent: "Settlement",
  },
  {
    href: "/intent-explorer",
    title: "Intent Explorer",
    body: "Query commitment state, inspect escrow, and check settlement status.",
    accent: "Read",
  },
  {
    href: "/refund-intent",
    title: "Refund Intent",
    body: "Return escrow to buyer after deadline if settlement never happened.",
    accent: "Recovery",
  },
];

export default function HomePage() {
  return (
    <section className="hero-layout">
      <div className="shell-card hero-panel">
        <span className="section-tag">Polkadot Infrastructure</span>
        <h1>Private agent payments, simplified.</h1>
        <p>
          Wrap the AgentPay contract into practical flows. Move from commitment to settlement
          without raw calldata.
        </p>

        <div className="hero-actions">
          <Link href="/create-intent" className="primary-button hero-link">
            Create Intent
          </Link>
          <Link href="/intent-explorer" className="secondary-button hero-link">
            Explore
          </Link>
        </div>

        <div className="hero-stats">
          <div>
            <strong>4</strong>
            <span>Flows</span>
          </div>
          <div>
            <strong>0%</strong>
            <span>Raw Calldata</span>
          </div>
          <div>
            <strong>E2E</strong>
            <span>Workflow</span>
          </div>
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
  );
}
