"""Simulate a vendor agent fulfilling an AgentPay intent."""

from __future__ import annotations

import argparse
import os
from decimal import Decimal
from typing import Optional

from web3 import Web3

from intent_hash import generate_intent_hash, normalize_price_to_wei


AGENTPAY_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "intentHash", "type": "bytes32"},
            {"internalType": "string", "name": "serviceName", "type": "string"},
            {"internalType": "uint256", "name": "quotedPriceWei", "type": "uint256"},
            {"internalType": "string", "name": "secretNonce", "type": "string"},
        ],
        "name": "fulfillIntent",
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
    parser = argparse.ArgumentParser(
        description="Fulfill an AgentPay intent as a vendor and receive the escrowed payment."
    )
    parser.add_argument("intent_hash", help="Hex-encoded bytes32 intent hash")
    parser.add_argument("service_name", help="Service name revealed during fulfillment")
    parser.add_argument("price", help="Quoted price in ETH, for example 0.05")
    parser.add_argument("nonce", help="The secret nonce that opens the commitment")
    parser.add_argument("--rpc-url", required=True, help="HTTP RPC endpoint for the target EVM chain")
    parser.add_argument("--contract", required=True, help="Deployed AgentPay contract address")
    parser.add_argument(
        "--private-key",
        help="Vendor private key. Prefer using VENDOR_PRIVATE_KEY in the environment.",
    )
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

    private_key = resolve_private_key(args.private_key, "VENDOR_PRIVATE_KEY")
    account = web3.eth.account.from_key(private_key)
    contract = web3.eth.contract(
        address=Web3.to_checksum_address(args.contract),
        abi=AGENTPAY_ABI,
    )

    quoted_price_wei = normalize_price_to_wei(args.price)
    computed_intent_hash = generate_intent_hash(args.service_name, quoted_price_wei, args.nonce)
    provided_intent_hash = Web3.to_hex(Web3.to_bytes(hexstr=args.intent_hash))

    if provided_intent_hash.lower() != computed_intent_hash.lower():
        raise SystemExit(
            "Provided intent hash does not match the revealed preimage. Refusing to submit."
        )

    tx_nonce = web3.eth.get_transaction_count(account.address)
    balance_before = web3.eth.get_balance(account.address)

    transaction = contract.functions.fulfillIntent(
        Web3.to_bytes(hexstr=provided_intent_hash),
        args.service_name,
        quoted_price_wei,
        args.nonce,
    ).build_transaction(
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
    receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=args.confirm_timeout)
    balance_after = web3.eth.get_balance(account.address)

    gas_price = receipt.get("effectiveGasPrice", transaction["gasPrice"])
    gas_cost = receipt["gasUsed"] * gas_price
    received_amount_wei = balance_after - balance_before + gas_cost

    print(f"Computed intent hash: {computed_intent_hash}")
    print(f"Transaction hash: {tx_hash.hex()}")
    print(f"Confirmed in block: {receipt['blockNumber']}")
    print(f"Transaction status: {receipt['status']}")
    print(f"Received payment (wei): {received_amount_wei}")
    print(f"Received payment (ETH): {Decimal(received_amount_wei) / Decimal(10 ** 18)}")


if __name__ == "__main__":
    main()
