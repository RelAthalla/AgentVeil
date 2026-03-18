"""Refund an expired AgentPay intent back to the buyer."""

from __future__ import annotations

import argparse
import os
from typing import Optional

from web3 import Web3


AGENTPAY_ABI = [
    {
        "inputs": [{"internalType": "bytes32", "name": "intentHash", "type": "bytes32"}],
        "name": "refundIntent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]


def resolve_private_key(cli_value: Optional[str], env_var: str) -> str:
    private_key = cli_value or os.getenv(env_var)
    if not private_key:
        raise SystemExit(
            f"Missing private key. Pass --private-key or set the {env_var} environment variable."
        )
    return private_key


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Refund an expired AgentPay intent.")
    parser.add_argument("intent_hash", help="Hex-encoded bytes32 intent hash")
    parser.add_argument("--rpc-url", required=True, help="HTTP RPC endpoint for the target EVM chain")
    parser.add_argument("--contract", required=True, help="Deployed AgentPay contract address")
    parser.add_argument(
        "--private-key",
        help="Buyer private key. Prefer using BUYER_PRIVATE_KEY in the environment.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    web3 = Web3(Web3.HTTPProvider(args.rpc_url))
    if not web3.is_connected():
        raise SystemExit("Unable to connect to the RPC endpoint.")

    private_key = resolve_private_key(args.private_key, "BUYER_PRIVATE_KEY")
    account = web3.eth.account.from_key(private_key)
    contract = web3.eth.contract(
        address=Web3.to_checksum_address(args.contract),
        abi=AGENTPAY_ABI,
    )

    tx_nonce = web3.eth.get_transaction_count(account.address)
    transaction = contract.functions.refundIntent(Web3.to_bytes(hexstr=args.intent_hash)).build_transaction(
        {
            "from": account.address,
            "nonce": tx_nonce,
            "chainId": web3.eth.chain_id,
            "gasPrice": web3.eth.gas_price,
        }
    )

    transaction["gas"] = web3.eth.estimate_gas(transaction)

    signed_transaction = account.sign_transaction(transaction)
    tx_hash = web3.eth.send_raw_transaction(signed_transaction.raw_transaction)

    print(f"Refund transaction hash: {tx_hash.hex()}")


if __name__ == "__main__":
    main()
