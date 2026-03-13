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

Set these environment variables before deployment:

```bash
export POLKADOT_HUB_RPC_URL=https://your-polkadot-hub-rpc
export PRIVATE_KEY=0x...
export INITIAL_OWNER=0x...
```

Then run:

```bash
forge script scripts/DeployAgentPay.s.sol:DeployAgentPay \
  --rpc-url $POLKADOT_HUB_RPC_URL \
  --broadcast
```

## Notes

- Solidity is pinned to `0.8.20`.
- `contracts` is configured as the Foundry source directory in `foundry.toml`.
- `AgentPay.sol` is a starter settlement contract that records private intent hashes and settles native-token payments.
