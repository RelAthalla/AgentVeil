"use client";

import { useState } from "react";

import { getExplorerProvider, getIntent } from "@/lib/agentpay";

const defaultContract = process.env.NEXT_PUBLIC_AGENTPAY_ADDRESS ?? "";

export function IntentExplorer() {
  const [contractAddress, setContractAddress] = useState(defaultContract);
  const [intentHash, setIntentHash] = useState("");
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<{
    buyer: string;
    amountEth: string;
    amountWei: string;
    settled: boolean;
    exists: boolean;
    statusLabel: string;
    intentHash: string;
  } | null>(null);

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
      const message = lookupError instanceof Error ? lookupError.message : "Explorer lookup failed.";
      setStatus("Failed");
      setError(message);
    }
  };

  return (
    <section className="page-grid">
      <div className="panel glass-panel">
        <span className="eyebrow">Read Flow</span>
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

          <button className="primary-button" type="submit">
            Load Intent
          </button>
        </form>
      </div>

      <aside className="panel side-panel">
        <h2>Explorer state</h2>
        <div className="status-pill">{status}</div>
        {error ? <p className="inline-error">{error}</p> : null}

        {intent ? (
          <div className="explorer-grid">
            <div className="output-card">
              <span>Status</span>
              <strong>{intent.statusLabel}</strong>
            </div>
            <div className="output-card">
              <span>Buyer</span>
              <code>{intent.buyer}</code>
            </div>
            <div className="output-card">
              <span>Amount</span>
              <strong>{intent.amountEth} ETH</strong>
              <code>{intent.amountWei} wei</code>
            </div>
            <div className="output-card">
              <span>Stored intent hash</span>
              <code>{intent.intentHash}</code>
            </div>
            <div className="output-card">
              <span>Settled</span>
              <strong>{intent.settled ? "Yes" : "No"}</strong>
            </div>
          </div>
        ) : (
          <div className="stacked-output">
            <span>Intent status</span>
            <code>Run a lookup to inspect the contract state.</code>
          </div>
        )}
      </aside>
    </section>
  );
}
