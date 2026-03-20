"use client";

import { useMemo, useState } from "react";

import { useWallet } from "@/components/wallet-provider";
import { buildIntentHash, fulfillIntent, parseAgentPayError, toQuotedPriceWei } from "@/lib/agentpay";

const defaultContract = process.env.NEXT_PUBLIC_AGENTPAY_ADDRESS ?? "";

export function FulfillIntentForm() {
  const { connectWallet, signer } = useWallet();
  const [contractAddress, setContractAddress] = useState(defaultContract);
  const [intentHash, setIntentHash] = useState("");
  const [serviceName, setServiceName] = useState("private-api-access");
  const [price, setPrice] = useState("0.01");
  const [nonce, setNonce] = useState("demo-001");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState<string | null>(null);

  const recomputedIntentHash = useMemo(() => {
    if (!serviceName || !price || !nonce) {
      return "";
    }

    try {
      return buildIntentHash(serviceName, price, nonce);
    } catch {
      return "";
    }
  }, [nonce, price, serviceName]);

  const hashMatches = intentHash.trim().toLowerCase() === recomputedIntentHash.toLowerCase();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setTxHash(null);
    setStatus("Connecting wallet");

    try {
      if (!hashMatches) {
        throw new Error("Intent hash does not match the revealed service, price, and nonce.");
      }

      const activeSigner = signer ?? (await connectWallet()).getSigner();

      setStatus("Awaiting wallet confirmation");
      const tx = await fulfillIntent(
        contractAddress,
        await activeSigner,
        intentHash,
        serviceName,
        toQuotedPriceWei(price),
        nonce,
      );

      setTxHash(tx.hash);
      setStatus("Settlement transaction sent");
      await tx.wait();
      setStatus("Vendor payment received");
    } catch (submissionError) {
      setStatus("Failed");
      setError(parseAgentPayError(submissionError, "Intent fulfillment failed."));
    }
  };

  return (
    <section className="flow-layout">
      <div className="shell-card flow-panel">
        <span className="section-tag">Vendor Flow</span>
        <h1>Fulfill Intent</h1>
        <p>
          Reveal the original preimage so the stored commitment can be checked and the escrow can be
          released to the fulfiller.
        </p>

        <form className="flow-form" onSubmit={handleSubmit}>
          <label>
            <span>AgentPay contract</span>
            <input value={contractAddress} onChange={(event) => setContractAddress(event.target.value)} placeholder="0x..." required />
          </label>

          <label>
            <span>Intent hash</span>
            <input value={intentHash} onChange={(event) => setIntentHash(event.target.value)} placeholder="0x..." required />
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

          <label>
            <span>Secret preimage</span>
            <input value={nonce} onChange={(event) => setNonce(event.target.value)} placeholder="Enter secret preimage..." required />
          </label>

          <button className="primary-button submit-button" type="submit">
            Submit Settlement Proof
          </button>
        </form>
      </div>

      <aside className="sidebar-stack">
        <div className="shell-card side-card">
          <div className="side-header">
            <h2>Settlement status</h2>
            <span className="status-pill">{status}</span>
          </div>
          <div className="detail-box">
            <span>Latest transaction hash</span>
            <code>{txHash ?? "No settlement transaction submitted yet."}</code>
          </div>
          <div className="detail-box">
            <span>Recomputed intent hash</span>
            <code>{recomputedIntentHash || "Fill the form to derive the matching reveal hash."}</code>
          </div>
          <div className="detail-box">
            <span>Preflight validation</span>
            <strong>{hashMatches ? "Intent hash matches the revealed preimage." : "Intent hash does not match yet."}</strong>
          </div>
          {error ? <p className="inline-error">{error}</p> : null}
        </div>

        <div className="shell-card side-card success-card">
          <h2>How settlement works</h2>
          <p>
            The preimage is hashed client-side and compared against the on-chain commitment. Only the
            matching preimage unlocks the escrowed funds.
          </p>
        </div>
      </aside>
    </section>
  );
}
