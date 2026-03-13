import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  ZeroAddress,
  formatEther,
  isAddress,
  isHexString,
  keccak256,
  parseEther,
  toUtf8Bytes,
  type ContractRunner,
  type Eip1193Provider,
  type TransactionResponse,
} from "ethers";

export const AGENTPAY_ABI = [
  "function createIntent(bytes32 intentHash) payable",
  "function fulfillIntent(bytes32 intentHash, bytes32 proofHash)",
  "function intents(bytes32) view returns (address buyer, uint256 amount, bytes32 intentHash, bool settled)",
] as const;

export type IntentRecord = {
  buyer: string;
  amountWei: string;
  amountEth: string;
  intentHash: string;
  settled: boolean;
  exists: boolean;
  statusLabel: string;
};

export function buildIntentHash(serviceName: string, price: string, nonce: string) {
  return keccak256(toUtf8Bytes(`${serviceName}${price}${nonce}`));
}

export function buildProofHash(intentHash: string) {
  return normalizeIntentHash(intentHash);
}

export function normalizeIntentHash(intentHash: string) {
  const candidate = intentHash.trim();

  if (!isHexString(candidate, 32)) {
    throw new Error("Intent hash must be a 32-byte hex value.");
  }

  return candidate;
}

export function validateContractAddress(address: string) {
  if (!isAddress(address)) {
    throw new Error("Contract address is not a valid EVM address.");
  }

  return address;
}

export function getWriteContract(contractAddress: string, runner: ContractRunner) {
  return new Contract(validateContractAddress(contractAddress), AGENTPAY_ABI, runner);
}

export function getReadContract(contractAddress: string, provider: BrowserProvider | JsonRpcProvider) {
  return new Contract(validateContractAddress(contractAddress), AGENTPAY_ABI, provider);
}

export async function createIntent(
  contractAddress: string,
  runner: ContractRunner,
  intentHash: string,
  valueEth: string,
): Promise<TransactionResponse> {
  const contract = getWriteContract(contractAddress, runner);
  return contract.createIntent(normalizeIntentHash(intentHash), {
    value: parseEther(valueEth),
  });
}

export async function fulfillIntent(
  contractAddress: string,
  runner: ContractRunner,
  intentHash: string,
  proofHash: string,
): Promise<TransactionResponse> {
  const contract = getWriteContract(contractAddress, runner);
  return contract.fulfillIntent(normalizeIntentHash(intentHash), normalizeIntentHash(proofHash));
}

export function getExplorerProvider(): BrowserProvider | JsonRpcProvider {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

  if (rpcUrl) {
    return new JsonRpcProvider(rpcUrl);
  }

  if (typeof window !== "undefined" && window.ethereum) {
    return new BrowserProvider(window.ethereum as Eip1193Provider);
  }

  throw new Error("Set NEXT_PUBLIC_RPC_URL or open the app in a browser with an injected wallet.");
}

export async function getIntent(
  contractAddress: string,
  provider: BrowserProvider | JsonRpcProvider,
  intentHash: string,
): Promise<IntentRecord> {
  const contract = getReadContract(contractAddress, provider);
  const normalizedHash = normalizeIntentHash(intentHash);
  const intent = await contract.intents(normalizedHash);

  const buyer = String(intent.buyer);
  const amount = BigInt(intent.amount);
  const settled = Boolean(intent.settled);
  const exists = buyer !== ZeroAddress;

  return {
    buyer,
    amountWei: amount.toString(),
    amountEth: formatEther(amount),
    intentHash: String(intent.intentHash),
    settled,
    exists,
    statusLabel: !exists ? "Missing" : settled ? "Settled" : "Open",
  };
}

export async function fetchIntent(
  contractAddress: string,
  provider: BrowserProvider | JsonRpcProvider,
  intentHash: string,
): Promise<IntentRecord> {
  return getIntent(contractAddress, provider, intentHash);
}
