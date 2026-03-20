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

const AGENTPAY_ERROR_MESSAGES: Record<string, string> = {
  "0x0ac00304": "An intent with this hash already exists.",
  "0x61ae6483": "Intent not found.",
  "0x2c5211c6": "Payment amount must be greater than zero.",
  "0x769d11e4": "Deadline must be in the future.",
  "0x414c0601": "Intent is no longer active.",
  "0x408b2234": "Intent expired. Create a new intent or refund this one.",
  "0x551a40dc": "Refund is not available yet.",
  "0x4862d1fc": "Only the original buyer can refund this intent.",
  "0xe67f38b2": "This wallet is not the authorized vendor for the intent.",
  "0x09bde339": "The revealed service data does not match the stored commitment.",
  "0x55e97b0d": "Quoted price does not match the escrowed amount.",
  "0x90b8ec18": "Native token transfer failed.",
};

const abiCoder = AbiCoder.defaultAbiCoder();

export const AGENTPAY_ABI = [
  "function createIntent(bytes32 intentHash, uint64 deadline, address expectedVendor) payable",
  "function fulfillIntent(bytes32 intentHash, string serviceName, uint256 quotedPriceWei, string secretNonce)",
  "function refundIntent(bytes32 intentHash)",
  "function getIntent(bytes32 intentHash) view returns ((address buyer, address expectedVendor, uint256 amount, uint64 createdAt, uint64 deadline, bytes32 intentHash, uint8 status))",
] as const;

export type IntentRecord = {
  buyer: string;
  expectedVendor: string | null;
  amountWei: string;
  amountEth: string;
  createdAt: number;
  deadline: number;
  intentHash: string;
  status: number;
  exists: boolean;
  settled: boolean;
  isExpired: boolean;
  canFulfill: boolean;
  canRefund: boolean;
  statusLabel: string;
};

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function extractHexData(value: unknown): string | null {
  if (typeof value === "string" && isHexString(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const directCandidates = [record.data, record.revert, record.reason];

  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && isHexString(candidate)) {
      return candidate;
    }
  }

  const nestedCandidates = [record.error, record.info, record.cause];

  for (const candidate of nestedCandidates) {
    const nested = extractHexData(candidate);
    if (nested) {
      return nested;
    }
  }

  return null;
}

export function parseAgentPayError(error: unknown, fallbackMessage: string) {
  const revertData = extractHexData(error);
  const selector = revertData?.slice(0, 10).toLowerCase();

  if (selector && AGENTPAY_ERROR_MESSAGES[selector]) {
    return AGENTPAY_ERROR_MESSAGES[selector];
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function buildIntentHash(serviceName: string, price: string, nonce: string) {
  const quotedPriceWei = parseUnits(price, 18);
  const payload = abiCoder.encode(["string", "uint256", "string"], [serviceName, quotedPriceWei, nonce]);

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

export async function refundIntent(
  contractAddress: string,
  runner: ContractRunner,
  intentHash: string,
): Promise<TransactionResponse> {
  const contract = getWriteContract(contractAddress, runner);
  return contract.refundIntent(normalizeIntentHash(intentHash));
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
  const isExpired = exists && status === 1 && deadline <= nowInSeconds();
  const statusLabel = !exists
    ? "Missing"
    : settled
      ? "Settled"
      : status === 3
        ? "Refunded"
        : isExpired
          ? "Expired"
          : status === 1
            ? "Active"
            : "Unknown";

  return {
    buyer,
    expectedVendor: expectedVendor === ZeroAddress ? null : expectedVendor,
    amountWei: amount.toString(),
    amountEth: formatEther(amount),
    createdAt,
    deadline,
    intentHash: String(intent.intentHash),
    status,
    exists,
    settled,
    isExpired,
    canFulfill: exists && status === 1 && !isExpired,
    canRefund: exists && status === 1 && isExpired,
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
