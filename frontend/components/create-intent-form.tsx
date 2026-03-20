"use client";

import { useMemo, useState } from "react";
import { ZeroAddress } from "ethers";

import { useWallet } from "@/components/wallet-provider";
import { buildIntentHash, createIntent, parseAgentPayError } from "@/lib/agentpay";

const defaultContract = process.env.NEXT_PUBLIC_AGENTPAY_ADDRESS ?? "";

function formatTimestamp(timestampSeconds: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestampSeconds * 1000);
}

export function CreateIntentForm() {
  const { connectWallet, signer } = useWallet();
  const [contractAddress, setContractAddress] = useState(defaultContract);
  const [serviceName, setServiceName] = useState("private-api-access");
  const [price, setPrice] = useState("0.01");
  const [nonce, setNonce] = useState("demo-001");
  const [expectedVendor, setExpectedVendor] = useState(ZeroAddress);
  const [deadlineSeconds, setDeadlineSeconds] = useState("3600");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState<string | null>(null);

  const intentHash = useMemo(() => {
    if (!serviceName || !price || !nonce) {
      return "";
    }

    try {
      return buildIntentHash(serviceName, price, nonce);
    } catch {
      return "";
    }
  }, [nonce, price, serviceName]);

  const deadlinePreview = useMemo(() => {
    const seconds = Number(deadlineSeconds);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return null;
    }

    return Math.floor(Date.now() / 1000) + seconds;
  }, [deadlineSeconds]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setTxHash(null);
    setStatus("Connecting wallet");

    try {
      const activeSigner = signer ?? (await connectWallet()).getSigner();
      const deadline = Math.floor(Date.now() / 1000) + Number(deadlineSeconds);

      setStatus("Awaiting wallet confirmation");
      const tx = await createIntent(contractAddress, await activeSigner, intentHash, price, deadline, expectedVendor);

      setTxHash(tx.hash);
      setStatus("Transaction sent");
      await tx.wait();
      setStatus("Intent confirmed on-chain");
    } catch (submissionError) {
      setStatus("Failed");
      setError(parseAgentPayError(submissionError, "Intent creation failed."));
    }
  };

  return (
    <section className="flow-layout">
      <div className="shell-card flow-panel">
        <span className="section-tag">Buyer Flow</span>
        <h1>Create Intent</h1>
        <p>
          The buyer generates a commitment locally, locks escrow, and publishes only the intent hash
          to the contract.
        </p>

        <form className="flow-form" onSubmit={handleSubmit}>
          <label>
            <span>AgentPay contract</span>
            <input value={contractAddress} onChange={(event) => setContractAddress(event.target.value)} placeholder="0x..." required />
          </label>

          <div className="form-grid two-column">
            <label>
              <span>Service name</span>
              <input value={serviceName} onChange={(event) => setServiceName(event.target.value)} required />
            </label>

            <label>
              <span>Nonce</span>
              <input value={nonce} onChange={(event) => setNonce(event.target.value)} required />
            </label>
          </div>

          <label>
            <span>Price in ETH</span>
            <input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" required />
          </label>

          <div className="form-grid two-column">
            <label>
              <span>Expected vendor</span>
              <input value={expectedVendor} onChange={(event) => setExpectedVendor(event.target.value)} placeholder="0x000... or zero address" required />
            </label>

            <label>
              <span>Refund delay (seconds)</span>
              <input value={deadlineSeconds} onChange={(event) => setDeadlineSeconds(event.target.value)} inputMode="numeric" min="1" required />
            </label>
          </div>

          <button className="primary-button submit-button" type="submit">
            Lock Escrow & Submit Intent
          </button>
        </form>
      </div>

      <aside className="sidebar-stack">
        <div className="shell-card side-card">
          <div className="side-header">
            <h2>Transaction status</h2>
            <span className="status-pill">{status}</span>
          </div>
          <div className="detail-box">
            <span>Latest transaction hash</span>
            <code>{txHash ?? "No transaction submitted yet."}</code>
          </div>
          <div className="detail-box">
            <span>Generated intent hash</span>
            <code>{intentHash || "Fill the form to derive a commitment hash."}</code>
          </div>
          <div className="detail-box">
            <span>Expected expiry</span>
            <code>{deadlinePreview ? formatTimestamp(deadlinePreview) : "Enter a positive delay in seconds."}</code>
          </div>
          {error ? <p className="inline-error">{error}</p> : null}
        </div>

        <div className="shell-card side-card muted-card">
          <h2>Flow steps</h2>
          <ol className="step-list">
            <li>
              <strong>Generate commitment</strong>
              <span>Hash the secret preimage locally in the browser.</span>
            </li>
            <li>
              <strong>Lock escrow</strong>
              <span>Send funds into the AgentPay contract.</span>
            </li>
            <li>
              <strong>Publish intent hash</strong>
              <span>Store only the public commitment on-chain.</span>
            </li>
          </ol>
        </div>
      </aside>
    </section>
  );
}
