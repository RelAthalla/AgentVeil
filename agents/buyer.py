#!/usr/bin/env python3
"""Simulate an AI buyer agent creating a private AgentPay intent."""

from __future__ import annotations

import argparse
from decimal import Decimal

from web3 import Web3


AGENTPAY_ABI = [
    {
        "inputs": [{"internalType": "bytes32", "name": "intentHash", "type": "bytes32"}],
        "name": "createIntent",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function",
    }
]


def build_intent_payload(service_name: str, price: str, nonce: str) -> str:
    return f"{service_name}{price}{nonce}"


def generate_intent_hash(web3: Web3, service_name: str, price: str, nonce: str) -> bytes:
    payload = build_intent_payload(service_name, price, nonce)
    return web3.keccak(text=payload)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create an AgentPay intent and send the escrow payment to the contract."
    )
    parser.add_argument("service_name", help="Service name requested by the buyer")
    parser.add_argument("price", help="Service price in ETH, for example 0.05")
    parser.add_argument("nonce", help="Unique nonce for the intent")
    parser.add_argument("--rpc-url", required=True, help="HTTP RPC endpoint for the target EVM chain")
    parser.add_argument("--private-key", required=True, help="Private key for the buyer wallet")
    parser.add_argument("--contract", required=True, help="Deployed AgentPay contract address")
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

    intent_hash = generate_intent_hash(web3, args.service_name, args.price, args.nonce)
    value = web3.to_wei(Decimal(args.price), "ether")
    nonce = web3.eth.get_transaction_count(account.address)

    transaction = contract.functions.createIntent(intent_hash).build_transaction(
        {
            "from": account.address,
            "value": value,
            "nonce": nonce,
            "chainId": web3.eth.chain_id,
            "gasPrice": web3.eth.gas_price,
        }
    )

    transaction["gas"] = web3.eth.estimate_gas(transaction)

    signed_transaction = account.sign_transaction(transaction)
    tx_hash = web3.eth.send_raw_transaction(signed_transaction.raw_transaction)

    print(f"Intent hash: {intent_hash.hex()}")
    print(f"Transaction hash: {tx_hash.hex()}")


if __name__ == "__main__":
    main()
