# AgentPay Shield

Foundry smart contract scaffold for a Polkadot Hub compatible EVM deployment.

## Structure

```text
agentpay-shield
|-- contracts
|   `-- AgentPay.sol
|-- scripts
|   `-- DeployAgentPay.s.sol
|-- test
|   `-- AgentPay.t.sol
|-- agents
|-- frontend
|   |-- app
|   |-- components
|   `-- lib
|-- lib
|   `-- forge-std
|-- foundry.toml
`-- README.md
```

## Requirements

- Foundry installed locally
- RPC URL for a Polkadot Hub compatible EVM endpoint
- Deploy wallet private key and desired contract owner address

## Build

```bash
forge build
```

## Test

```bash
forge test
```

## Deploy

Deploy the Rust verifier separately first, then set these environment variables before deploying
`AgentPay`:

```bash
export POLKADOT_HUB_RPC_URL=https://your-polkadot-hub-rpc
export PRIVATE_KEY=0x...
export VERIFIER_ADDRESS=0x...
```

Then run:

```bash
forge script scripts/DeployAgentPay.s.sol:DeployAgentPay \
  --rpc-url $POLKADOT_HUB_RPC_URL \
  --broadcast
```

## Notes

- `scripts/DeployAgentPay.s.sol` now attaches `AgentPay` to an already deployed verifier via `VERIFIER_ADDRESS`.
- `contracts/SimpleIntentVerifier.sol` can still be kept as a local Solidity reference/mock for Foundry tests.
- `contracts` is configured as the Foundry source directory in `foundry.toml`.
- `AgentPay.sol` is a starter settlement contract that records private intent hashes and settles native-token payments.
