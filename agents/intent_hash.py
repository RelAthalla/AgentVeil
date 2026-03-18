"""Generate an AgentPay intent hash from typed service data."""

from __future__ import annotations

import argparse
from decimal import Decimal, InvalidOperation

from eth_abi import encode
from web3 import Web3


def normalize_price_to_wei(price_eth: str) -> int:
    try:
        return int(Web3.to_wei(Decimal(price_eth), "ether"))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"Invalid ETH price: {price_eth}") from exc


def build_intent_payload(service_name: str, quoted_price_wei: int, nonce: str) -> bytes:
    return encode(["string", "uint256", "string"], [service_name, quoted_price_wei, nonce])


def generate_intent_hash(service_name: str, quoted_price_wei: int, nonce: str) -> str:
    payload = build_intent_payload(service_name, quoted_price_wei, nonce)
    return Web3.keccak(payload).hex()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a keccak256 AgentPay intent hash from typed service data."
    )
    parser.add_argument("service_name", help="Service name for the private intent")
    parser.add_argument("price", help="Quoted price in ETH, for example 0.05")
    parser.add_argument("nonce", help="Unique nonce to avoid hash collisions")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    quoted_price_wei = normalize_price_to_wei(args.price)
    intent_hash = generate_intent_hash(args.service_name, quoted_price_wei, args.nonce)
    print(intent_hash)


if __name__ == "__main__":
    main()
