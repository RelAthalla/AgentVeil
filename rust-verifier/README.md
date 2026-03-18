# rust-verifier

Ink! v6 / PolkaVM verifier for AgentPay commitments.

## Local workflow

1. Install toolchain

```bash
rustup component add rust-src
cargo install --locked --force --version 6.0.0-beta.1 cargo-contract
```

2. Start a local revive-compatible node

```bash
ink-node
```

3. Build

```bash
cargo contract build --release
```

4. Instantiate

```bash
cargo contract instantiate --suri //Alice
```

## Demo value expected by current AgentPay flow

For the existing example payload:

- `service_name = "dataset-market"`
- `quoted_price_wei = 10000000000000000`
- `secret_nonce = "mysecret123"`

The expected hash is:

```text
2516fdf9fdbd598244091cd34da58b65ea51753f9b270b2e0c9674a9e2c20273
```


