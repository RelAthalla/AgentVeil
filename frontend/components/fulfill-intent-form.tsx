"use client";

import { useMemo, useState } from "react";

import { useWallet } from "@/components/wallet-provider";
import { buildProofHash, fulfillIntent } from "@/lib/agentpay";

const defaultContract = process.env.NEXT_PUBLIC_AGENTPAY_ADDRESS ?? "";

export function FulfillIntentForm() {
  const { connectWallet, provider } = useWallet();
  const [contractAddress, setContractAddress] = useState(defaultContract);
  const [intentHash, setIntentHash] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState<string | null>(null);

  const proofHash = useMemo(() => {
    if (!intentHash) {
      return "";
    }

    try {
      return buildProofHash(intentHash);
    } catch {
      return "";
    }
  }, [intentHash]);

  const proofData = proofHash ? `vendor-proof::${proofHash}` : "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setTxHash(null);
    setStatus("Connecting wallet");

    try {
      const activeProvider = provider ?? (await connectWallet());
      const signer = await activeProvider.getSigner();

      setStatus("Awaiting wallet confirmation");
      const tx = await fulfillIntent(contractAddress, signer, intentHash, proofHash);

      setTxHash(tx.hash);
      setStatus("Settlement transaction sent");
      await tx.wait();
      setStatus("Vendor payment received");
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Intent fulfillment failed.";
      setStatus("Failed");
      setError(message);
    }
  };

  return (
    <section className="page-grid">
      <div className="panel glass-panel">
        <span className="eyebrow">Vendor Flow</span>
        <h1>Fulfill Intent</h1>
        <p>
          For the current starter contract, the vendor proves fulfillment by submitting a proof hash
          that matches the buyer&apos;s original intent hash.
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

          <div className="output-card">
            <span>Generated proof data</span>
            <code>{proofData || "Enter a valid intent hash to derive proof data."}</code>
          </div>

          <div className="output-card">
            <span>Proof hash sent to contract</span>
            <code>{proofHash || "Proof hash will appear here."}</code>
          </div>

          <button className="primary-button" type="submit">
            Fulfill Intent
          </button>
        </form>
      </div>

      <aside className="panel side-panel">
        <h2>Settlement status</h2>
        <div className="status-pill">{status}</div>
        <div className="stacked-output">
          <span>Latest transaction hash</span>
          <code>{txHash ?? "No settlement transaction submitted yet."}</code>
        </div>
        {error ? <p className="inline-error">{error}</p> : null}
      </aside>
    </section>
  );
}
