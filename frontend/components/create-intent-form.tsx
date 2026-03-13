"use client";

import { useMemo, useState } from "react";

import { useWallet } from "@/components/wallet-provider";
import { buildIntentHash, createIntent } from "@/lib/agentpay";

const defaultContract = process.env.NEXT_PUBLIC_AGENTPAY_ADDRESS ?? "";

export function CreateIntentForm() {
  const { connectWallet, provider } = useWallet();
  const [contractAddress, setContractAddress] = useState(defaultContract);
  const [serviceName, setServiceName] = useState("private-api-access");
  const [price, setPrice] = useState("0.01");
  const [nonce, setNonce] = useState("demo-001");
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setTxHash(null);
    setStatus("Connecting wallet");

    try {
      const activeProvider = provider ?? (await connectWallet());
      const signer = await activeProvider.getSigner();

      setStatus("Awaiting wallet confirmation");
      const tx = await createIntent(contractAddress, signer, intentHash, price);

      setTxHash(tx.hash);
      setStatus("Transaction sent");
      await tx.wait();
      setStatus("Intent confirmed on-chain");
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Intent creation failed.";
      setStatus("Failed");
      setError(message);
    }
  };

  return (
    <section className="page-grid">
      <div className="panel glass-panel">
        <span className="eyebrow">Buyer Flow</span>
        <h1>Create Intent</h1>
        <p>
          The buyer generates a commitment locally, locks ETH in escrow, and publishes only the
          intent hash to the contract.
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

          <div className="output-card">
            <span>Generated intent hash</span>
            <code>{intentHash || "Fill the form to derive a hash."}</code>
          </div>

          <button className="primary-button" type="submit">
            Create Intent
          </button>
        </form>
      </div>

      <aside className="panel side-panel">
        <h2>Transaction status</h2>
        <div className="status-pill">{status}</div>
        <div className="stacked-output">
          <span>Latest transaction hash</span>
          <code>{txHash ?? "No transaction submitted yet."}</code>
        </div>
        {error ? <p className="inline-error">{error}</p> : null}
      </aside>
    </section>
  );
}
