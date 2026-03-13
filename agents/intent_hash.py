#!/usr/bin/env python3
"""Generate an AgentPay intent hash from service data."""

from __future__ import annotations

import argparse
from web3 import Web3


def build_intent_payload(service_name: str, price: str, nonce: str) -> str:
    return f"{service_name}{price}{nonce}"


def generate_intent_hash(service_name: str, price: str, nonce: str) -> str:
    payload = build_intent_payload(service_name, price, nonce)
    return Web3.keccak(text=payload).hex()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a keccak256 intent hash from service name, price, and nonce."
    )
    parser.add_argument("service_name", help="Service name for the private intent")
    parser.add_argument("price", help="Quoted price for the service")
    parser.add_argument("nonce", help="Unique nonce to avoid hash collisions")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    intent_hash = generate_intent_hash(args.service_name, args.price, args.nonce)
    print(intent_hash)


if __name__ == "__main__":
    main()
