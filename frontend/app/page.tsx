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
    body: "Act as the vendor, derive the proof hash for the starter contract, and receive payment.",
    accent: "Settlement",
  },
  {
    href: "/intent-explorer",
    title: "Intent Explorer",
    body: "Inspect an intent by hash, verify buyer, amount, and whether settlement is complete.",
    accent: "Visibility",
  },
];

export default function HomePage() {
  return (
    <section className="hero-grid">
      <div className="hero-copy panel glass-panel">
        <span className="eyebrow">AgentVeil</span>
        <h1>Private agent payments with a cleaner operator workflow.</h1>
        <p>
          This frontend wraps the AgentPay contract into three practical flows so a buyer and a
          vendor can move from intent creation to settlement without dropping into raw calldata.
        </p>
      </div>

      <div className="feature-stack">
        {pages.map((page) => (
          <Link key={page.href} href={page.href} className="feature-card panel">
            <span className="feature-tag">{page.accent}</span>
            <h2>{page.title}</h2>
            <p>{page.body}</p>
            <span className="feature-link">Open flow</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
