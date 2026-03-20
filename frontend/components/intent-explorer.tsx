"use client";

import { useState } from "react";

import { getExplorerProvider, getIntent, parseAgentPayError } from "@/lib/agentpay";

const defaultContract = process.env.NEXT_PUBLIC_AGENTPAY_ADDRESS ?? "";

function formatTimestamp(timestampSeconds: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestampSeconds * 1000);
}

export function IntentExplorer() {
  const [contractAddress, setContractAddress] = useState(defaultContract);
  const [intentHash, setIntentHash] = useState("");
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<Awaited<ReturnType<typeof getIntent>> | null>(null);

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("Loading intent");
    setError(null);
    setIntent(null);

    try {
      const provider = getExplorerProvider();
      const record = await getIntent(contractAddress, provider, intentHash);
      setIntent(record);
      setStatus("Intent loaded");
    } catch (lookupError) {
      setStatus("Failed");
      setError(parseAgentPayError(lookupError, "Explorer lookup failed."));
    }
  };

  return (
    <section className="flow-layout">
      <div className="shell-card flow-panel">
        <span className="section-tag">Read Flow</span>
        <h1>Intent Explorer</h1>
        <p>
          Query the public commitment state for any buyer intent, inspect the escrow amount, and see
          whether the private settlement has already been claimed.
        </p>

        <form className="flow-form" onSubmit={handleLookup}>
          <label>
            <span>AgentPay contract</span>
            <input value={contractAddress} onChange={(event) => setContractAddress(event.target.value)} placeholder="0x..." required />
          </label>

          <label>
            <span>Intent hash</span>
            <input value={intentHash} onChange={(event) => setIntentHash(event.target.value)} placeholder="0x..." required />
          </label>

          <button className="primary-button submit-button" type="submit">
            Load Intent
          </button>

          <div className="empty-state">
            {intent ? "Lookup complete. Review the state panel for full intent details." : "Run a lookup to inspect the contract state."}
          </div>
        </form>
      </div>

      <aside className="sidebar-stack">
        <div className="shell-card side-card">
          <div className="side-header">
            <h2>Explorer state</h2>
            <span className="status-pill">{status}</span>
          </div>
          {error ? <p className="inline-error">{error}</p> : null}
          <div className="detail-box">
            <span>Intent status</span>
            <strong>{intent ? intent.statusLabel : "Run a lookup to inspect the contract state."}</strong>
          </div>
        </div>

        <div className="shell-card side-card">
          <h2>Intent fields</h2>
          <div className="field-list">
            <div>
              <span>Commitment hash</span>
              <code>{intent?.intentHash ?? "-"}</code>
            </div>
            <div>
              <span>Escrow amount</span>
              <code>{intent ? `${intent.amountEth} ETH` : "-"}</code>
            </div>
            <div>
              <span>Buyer</span>
              <code>{intent?.buyer ?? "-"}</code>
            </div>
            <div>
              <span>Expected vendor</span>
              <code>{intent?.expectedVendor ?? (intent ? "Open fulfillment" : "-")}</code>
            </div>
            <div>
              <span>Created at</span>
              <code>{intent ? formatTimestamp(intent.createdAt) : "-"}</code>
            </div>
            <div>
              <span>Deadline</span>
              <code>{intent ? formatTimestamp(intent.deadline) : "-"}</code>
            </div>
            <div>
              <span>Settlement availability</span>
              <code>
                {intent
                  ? intent.canFulfill
                    ? "Can fulfill now"
                    : intent.canRefund
                      ? "Refund available"
                      : "Not fulfillable"
                  : "-"}
              </code>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
