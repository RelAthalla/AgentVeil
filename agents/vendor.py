#!/usr/bin/env python3
"""Simulate a vendor agent fulfilling an AgentPay intent."""

from __future__ import annotations

import argparse
from decimal import Decimal

from web3 import Web3


AGENTPAY_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "intentHash", "type": "bytes32"},
            {"internalType": "bytes32", "name": "proofHash", "type": "bytes32"},
        ],
        "name": "fulfillIntent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    }
]


def normalize_intent_hash(intent_hash: str) -> bytes:
    return Web3.to_bytes(hexstr=intent_hash)


def generate_proof_data(intent_hash: str) -> tuple[str, bytes]:
    normalized_hex = Web3.to_hex(normalize_intent_hash(intent_hash))
    proof_data = f"vendor-proof::{normalized_hex}"

    # The starter contract verifies proofHash by directly comparing it to intentHash.
    proof_hash = Web3.to_bytes(hexstr=normalized_hex)
    return proof_data, proof_hash


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fulfill an AgentPay intent as a vendor and receive the escrowed payment."
    )
    parser.add_argument("intent_hash", help="Hex-encoded bytes32 intent hash")
    parser.add_argument("--rpc-url", required=True, help="HTTP RPC endpoint for the target EVM chain")
    parser.add_argument("--private-key", required=True, help="Private key for the vendor wallet")
    parser.add_argument("--contract", required=True, help="Deployed AgentPay contract address")
    parser.add_argument(
        "--confirm-timeout",
        type=int,
        default=120,
        help="Seconds to wait for transaction confirmation",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    web3 = Web3(Web3.HTTPProvider(args.rpc_url))
    if not web3.is_connected():
        raise SystemExit("Unable to connect to the RPC endpoint.")

    account = web3.eth.account.from_key(args.private_key)
    contract = web3.eth.contract(
        address=Web3.to_checksum_address(args.contract),
        abi=AGENTPAY_ABI,
    )

    intent_hash = normalize_intent_hash(args.intent_hash)
    proof_data, proof_hash = generate_proof_data(args.intent_hash)
    nonce = web3.eth.get_transaction_count(account.address)
    balance_before = web3.eth.get_balance(account.address)

    transaction = contract.functions.fulfillIntent(intent_hash, proof_hash).build_transaction(
        {
            "from": account.address,
            "nonce": nonce,
            "chainId": web3.eth.chain_id,
            "gasPrice": web3.eth.gas_price,
        }
    )

    transaction["gas"] = web3.eth.estimate_gas(transaction)

    signed_transaction = account.sign_transaction(transaction)
    tx_hash = web3.eth.send_raw_transaction(signed_transaction.raw_transaction)
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=args.confirm_timeout)
    balance_after = web3.eth.get_balance(account.address)

    gas_price = receipt.get("effectiveGasPrice", transaction["gasPrice"])
    gas_cost = receipt["gasUsed"] * gas_price
    received_amount_wei = balance_after - balance_before + gas_cost

    print(f"Proof data: {proof_data}")
    print(f"Transaction hash: {tx_hash.hex()}")
    print(f"Confirmed in block: {receipt['blockNumber']}")
    print(f"Transaction status: {receipt['status']}")
    print(f"Received payment (wei): {received_amount_wei}")
    print(f"Received payment (ETH): {Decimal(received_amount_wei) / Decimal(10 ** 18)}")


if __name__ == "__main__":
    main()
