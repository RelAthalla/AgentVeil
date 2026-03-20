import Link from "next/link";

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
    body: "Act as the vendor, reveal the original preimage, and receive the escrowed payout.",
    accent: "Settlement",
  },
  {
    href: "/intent-explorer",
    title: "Intent Explorer",
    body: "Query public commitment state, inspect escrow, and check whether settlement already happened.",
    accent: "Read Flow",
  },
  {
    href: "/refund-intent",
    title: "Refund Intent",
    body: "Return escrow to the buyer after the deadline if settlement never happened.",
    accent: "Recovery",
  },
];

export default function HomePage() {
  return (
    <section className="hero-layout">
      <div className="shell-card hero-panel">
        <span className="section-tag">Polkadot-ready infrastructure</span>
        <h1>Private agent payments with a cleaner operator workflow.</h1>
        <p>
          This frontend wraps the AgentPay contract into practical flows so a buyer and a vendor can
          move from commitment creation to settlement and refund without dropping into raw calldata.
        </p>

        <div className="hero-actions">
          <Link href="/create-intent" className="primary-button hero-link">
            Create Intent
          </Link>
          <Link href="/intent-explorer" className="secondary-button hero-link">
            Explore Intents
          </Link>
        </div>

        <div className="hero-stats">
          <div>
            <strong>4</strong>
            <span>Practical Flows</span>
          </div>
          <div>
            <strong>0%</strong>
            <span>Raw Calldata</span>
          </div>
          <div>
            <strong>E2E</strong>
            <span>Operator Workflow</span>
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
