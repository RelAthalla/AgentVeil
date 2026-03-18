"""Simulate a buyer agent creating a private AgentPay intent."""

from __future__ import annotations

import argparse
import os
from typing import Optional

from web3 import Web3

from intent_hash import generate_intent_hash, normalize_price_to_wei


AGENTPAY_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "intentHash", "type": "bytes32"},
            {"internalType": "uint64", "name": "deadline", "type": "uint64"},
            {"internalType": "address", "name": "expectedVendor", "type": "address"},
        ],
        "name": "createIntent",
        "outputs": [],
        "stateMutability": "payable",
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
    parser = argparse.ArgumentParser(
        description="Create an AgentPay intent and send the escrow payment to the contract."
    )
    parser.add_argument("service_name", help="Service name requested by the buyer")
    parser.add_argument("price", help="Service price in ETH, for example 0.05")
    parser.add_argument("nonce", help="Unique nonce for the intent")
    parser.add_argument("--rpc-url", required=True, help="HTTP RPC endpoint for the target EVM chain")
    parser.add_argument("--contract", required=True, help="Deployed AgentPay contract address")
    parser.add_argument(
        "--expected-vendor",
        default="0x0000000000000000000000000000000000000000",
        help="Optional vendor address allowed to fulfill this intent. Default is open fulfillment.",
    )
    parser.add_argument(
        "--deadline-seconds",
        type=int,
        default=300,
        help="How many seconds from now until the intent becomes refundable.",
    )
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

    quoted_price_wei = normalize_price_to_wei(args.price)
    intent_hash_hex = generate_intent_hash(args.service_name, quoted_price_wei, args.nonce)
    intent_hash = Web3.to_bytes(hexstr=intent_hash_hex)

    latest_block = web3.eth.get_block("latest")
    deadline = int(latest_block["timestamp"]) + args.deadline_seconds
    expected_vendor = Web3.to_checksum_address(args.expected_vendor)
    tx_nonce = web3.eth.get_transaction_count(account.address)

    transaction = contract.functions.createIntent(intent_hash, deadline, expected_vendor).build_transaction(
        {
            "from": account.address,
            "value": quoted_price_wei,
            "nonce": tx_nonce,
            "chainId": web3.eth.chain_id,
            "gasPrice": web3.eth.gas_price,
        }
    )

    transaction["gas"] = web3.eth.estimate_gas(transaction)

    signed_transaction = account.sign_transaction(transaction)
    tx_hash = web3.eth.send_raw_transaction(signed_transaction.raw_transaction)

    print(f"Intent hash: {intent_hash_hex}")
    print(f"Quoted price (wei): {quoted_price_wei}")
    print(f"Expected vendor: {expected_vendor}")
    print(f"Refund deadline: {deadline}")
    print(f"Transaction hash: {tx_hash.hex()}")


if __name__ == "__main__":
    main()
