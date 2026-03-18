# Suggested commits

1. `feat(polkavm): add ink! v6 rust verifier contract for AgentPay commitments`
   - add `rust-verifier/Cargo.toml`
   - add `rust-verifier/lib.rs`
   - add `rust-verifier/README.md`
   - add `rust-verifier/.gitignore`

2. `docs(polkavm): document local build and deployment flow for ink-node`
   - refine `rust-verifier/README.md`

3. `chore(repo): remove SimpleIntentVerifier.sol after Rust verifier demo is ready`
   - remove `contracts/SimpleIntentVerifier.sol`
   - keep `contracts/IIntentVerifier.sol` until the cross-VM integration layer is decided
