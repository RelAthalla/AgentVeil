import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  ZeroAddress,
  AbiCoder,
  formatEther,
  isAddress,
  isHexString,
  keccak256,
  parseUnits,
  parseEther,
  type ContractRunner,
  type Eip1193Provider,
  type TransactionResponse,
} from "ethers";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export const AGENTPAY_ABI = [
  "function createIntent(bytes32 intentHash, uint64 deadline, address expectedVendor) payable",
  "function fulfillIntent(bytes32 intentHash, string serviceName, uint256 quotedPriceWei, string secretNonce)",
  "function getIntent(bytes32 intentHash) view returns ((address buyer, address expectedVendor, uint256 amount, uint64 createdAt, uint64 deadline, bytes32 intentHash, uint8 status))",
] as const;

export type IntentRecord = {
  buyer: string;
  expectedVendor: string;
  amountWei: string;
  amountEth: string;
  createdAt: number;
  deadline: number;
  intentHash: string;
  status: number;
  exists: boolean;
  settled: boolean;
  statusLabel: string;
};

export function buildIntentHash(serviceName: string, price: string, nonce: string) {
  const quotedPriceWei = parseUnits(price, 18);
  const payload = AbiCoder.defaultAbiCoder().encode(
    ["string", "uint256", "string"],
    [serviceName, quotedPriceWei, nonce],
  );

  return keccak256(payload);
}

export function toQuotedPriceWei(price: string) {
  return parseUnits(price, 18);
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
  deadline: number,
  expectedVendor: string,
): Promise<TransactionResponse> {
  const contract = getWriteContract(contractAddress, runner);
  return contract.createIntent(normalizeIntentHash(intentHash), deadline, validateContractAddress(expectedVendor), {
    value: parseEther(valueEth),
  });
}

export async function fulfillIntent(
  contractAddress: string,
  runner: ContractRunner,
  intentHash: string,
  serviceName: string,
  quotedPriceWei: bigint,
  secretNonce: string,
): Promise<TransactionResponse> {
  const contract = getWriteContract(contractAddress, runner);
  return contract.fulfillIntent(normalizeIntentHash(intentHash), serviceName, quotedPriceWei, secretNonce);
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
  const intent = await contract.getIntent(normalizedHash);

  const buyer = String(intent.buyer);
  const expectedVendor = String(intent.expectedVendor);
  const amount = BigInt(intent.amount);
  const createdAt = Number(intent.createdAt);
  const deadline = Number(intent.deadline);
  const status = Number(intent.status);
  const exists = buyer !== ZeroAddress;
  const settled = exists && status === 2;
  const statusLabel =
    !exists ? "Missing" : status === 1 ? "Active" : status === 2 ? "Settled" : status === 3 ? "Refunded" : "Unknown";

  return {
    buyer,
    expectedVendor,
    amountWei: amount.toString(),
    amountEth: formatEther(amount),
    createdAt,
    deadline,
    intentHash: String(intent.intentHash),
    status,
    exists,
    settled,
    statusLabel,
  };
}

export async function fetchIntent(
  contractAddress: string,
  provider: BrowserProvider | JsonRpcProvider,
  intentHash: string,
): Promise<IntentRecord> {
  return getIntent(contractAddress, provider, intentHash);
}
