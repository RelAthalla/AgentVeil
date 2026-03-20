"use client";

import { useState } from "react";

import { useWallet } from "@/components/wallet-provider";
import { getExplorerProvider, getIntent, parseAgentPayError, refundIntent } from "@/lib/agentpay";

const defaultContract = process.env.NEXT_PUBLIC_AGENTPAY_ADDRESS ?? "";

function formatTimestamp(timestampSeconds: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestampSeconds * 1000);
}

export function RefundIntentForm() {
  const { connectWallet, signer } = useWallet();
  const [contractAddress, setContractAddress] = useState(defaultContract);
  const [intentHash, setIntentHash] = useState("");
  const [lookupStatus, setLookupStatus] = useState("Idle");
  const [refundStatus, setRefundStatus] = useState("Idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<Awaited<ReturnType<typeof getIntent>> | null>(null);

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLookupStatus("Loading intent");
    setError(null);
    setIntent(null);
    setTxHash(null);

    try {
      const provider = getExplorerProvider();
      const record = await getIntent(contractAddress, provider, intentHash);
      setIntent(record);
      setLookupStatus("Intent loaded");
    } catch (lookupError) {
      setLookupStatus("Failed");
      setError(parseAgentPayError(lookupError, "Refund lookup failed."));
    }
  };

  const handleRefund = async () => {
    setError(null);
    setTxHash(null);
    setRefundStatus("Connecting wallet");

    try {
      if (!intent?.canRefund) {
        throw new Error("This intent is not refundable yet. Wait until the deadline has passed.");
      }

      const activeSigner = signer ?? (await connectWallet()).getSigner();
      setRefundStatus("Awaiting wallet confirmation");
      const tx = await refundIntent(contractAddress, await activeSigner, intentHash);
      setTxHash(tx.hash);
      setRefundStatus("Refund transaction sent");
      await tx.wait();
      setRefundStatus("Refund completed");
    } catch (refundError) {
      setRefundStatus("Failed");
      setError(parseAgentPayError(refundError, "Refund failed."));
    }
  };

  return (
    <section className="flow-layout">
      <div className="shell-card flow-panel">
        <span className="section-tag">Recovery Flow</span>
        <h1>Refund Intent</h1>
        <p>
          Load an intent first, confirm the deadline has passed, and refund the escrow back to the
          original buyer wallet.
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

          <button className="secondary-button submit-button" type="submit">
            Check Refund Status
          </button>

          <button className="primary-button submit-button" type="button" onClick={handleRefund}>
            Submit Refund Intent
          </button>
        </form>
      </div>

      <aside className="sidebar-stack">
        <div className="shell-card side-card">
          <div className="side-header">
            <h2>Refund status</h2>
            <span className="status-pill">{refundStatus}</span>
          </div>
          <div className="detail-box">
            <span>Lookup state</span>
            <strong>{lookupStatus}</strong>
          </div>
          <div className="detail-box">
            <span>Latest transaction hash</span>
            <code>{txHash ?? "No refund transaction submitted yet."}</code>
          </div>
          {error ? <p className="inline-error">{error}</p> : null}
        </div>

        <div className="shell-card side-card warning-card">
          <h2>Refund eligibility</h2>
          <div className="field-list compact-fields">
            <div>
              <span>Status</span>
              <code>{intent?.statusLabel ?? "-"}</code>
            </div>
            <div>
              <span>Buyer</span>
              <code>{intent?.buyer ?? "-"}</code>
            </div>
            <div>
              <span>Deadline</span>
              <code>{intent ? formatTimestamp(intent.deadline) : "-"}</code>
            </div>
            <div>
              <span>Refund availability</span>
              <code>{intent ? (intent.canRefund ? "Buyer can refund now" : "Not refundable yet") : "-"}</code>
            </div>
          </div>
        </div>
      </aside>
    </section>
  );
}
