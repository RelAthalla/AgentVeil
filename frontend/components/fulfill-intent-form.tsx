"use client";

import { useMemo, useState } from "react";

import { useWallet } from "@/components/wallet-provider";
import { buildIntentHash, fulfillIntent, toQuotedPriceWei } from "@/lib/agentpay";

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setTxHash(null);
    setStatus("Connecting wallet");

    try {
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
          The vendor reveals the original preimage so the verifier contract can confirm it matches
          the buyer&apos;s on-chain commitment hash.
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

          <div className="output-card">
            <span>Recomputed intent hash</span>
            <code>{recomputedIntentHash || "Fill the form to derive the revealed preimage hash."}</code>
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
