#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod commitment_verifier {
    use ink::env::hash::{HashOutput, Keccak256};
    use ink::prelude::{string::String, vec::Vec};

    /// Stateless verifier that mirrors Solidity's
    /// `keccak256(abi.encode(string,uint256,string))`.
    ///
    /// This contract is intended to replace the role of `SimpleIntentVerifier.sol`
    /// in a PolkaVM / pallet-revive deployment.
    #[ink(storage)]
    #[derive(Default)]
    pub struct CommitmentVerifier {}

    impl CommitmentVerifier {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {}
        }

        /// Returns a small version marker for frontend / integration checks.
        #[ink(message)]
        pub fn version(&self) -> String {
            String::from("commitment-verifier/0.1.0")
        }

        /// Returns the raw ABI-encoded payload for:
        /// abi.encode(service_name, quoted_price_wei, secret_nonce)
        #[ink(message)]
        pub fn encode_payload(
            &self,
            service_name: String,
            quoted_price_wei: u128,
            secret_nonce: String,
        ) -> Vec<u8> {
            abi_encode_string_uint256_string(
                service_name.as_bytes(),
                quoted_price_wei,
                secret_nonce.as_bytes(),
            )
        }

        /// Computes the EVM-compatible commitment hash.
        #[ink(message)]
        pub fn compute_hash(
            &self,
            service_name: String,
            quoted_price_wei: u128,
            secret_nonce: String,
        ) -> [u8; 32] {
            compute_commitment_hash(
                service_name.as_bytes(),
                quoted_price_wei,
                secret_nonce.as_bytes(),
            )
        }

        /// Convenience helper for UIs and scripts.
        #[ink(message)]
        pub fn compute_hash_hex(
            &self,
            service_name: String,
            quoted_price_wei: u128,
            secret_nonce: String,
        ) -> String {
            let hash = self.compute_hash(service_name, quoted_price_wei, secret_nonce);
            to_lower_hex(&hash)
        }

        /// Returns true iff the provided hash matches the revealed preimage.
        #[ink(message)]
        pub fn verify(
            &self,
            intent_hash: [u8; 32],
            service_name: String,
            quoted_price_wei: u128,
            secret_nonce: String,
        ) -> bool {
            self.compute_hash(service_name, quoted_price_wei, secret_nonce) == intent_hash
        }

        /// Same as `verify`, but accepts a 64-char hex string with optional 0x prefix.
        #[ink(message)]
        pub fn verify_hex(
            &self,
            intent_hash_hex: String,
            service_name: String,
            quoted_price_wei: u128,
            secret_nonce: String,
        ) -> bool {
            let Some(intent_hash) = parse_h256_hex(&intent_hash_hex) else {
                return false;
            };

            self.verify(intent_hash, service_name, quoted_price_wei, secret_nonce)
        }
    }

    fn compute_commitment_hash(
        service_name: &[u8],
        quoted_price_wei: u128,
        secret_nonce: &[u8],
    ) -> [u8; 32] {
        let encoded = abi_encode_string_uint256_string(service_name, quoted_price_wei, secret_nonce);
        let mut output = <Keccak256 as HashOutput>::Type::default();
        ink::env::hash_bytes::<Keccak256>(&encoded, &mut output);
        output
    }

    fn abi_encode_string_uint256_string(
        service_name: &[u8],
        quoted_price_wei: u128,
        secret_nonce: &[u8],
    ) -> Vec<u8> {
        let head_size: usize = 32 * 3;
        let service_tail_size = 32 + padded_len(service_name.len());
        let nonce_offset = head_size + service_tail_size;

        let mut out = Vec::with_capacity(head_size + service_tail_size + 32 + padded_len(secret_nonce.len()));

        // Head
        push_u256_from_usize(&mut out, head_size);
        push_u256_from_u128(&mut out, quoted_price_wei);
        push_u256_from_usize(&mut out, nonce_offset);

        // Tail 1: service_name
        push_u256_from_usize(&mut out, service_name.len());
        push_padded_bytes(&mut out, service_name);

        // Tail 2: secret_nonce
        push_u256_from_usize(&mut out, secret_nonce.len());
        push_padded_bytes(&mut out, secret_nonce);

        out
    }

    fn padded_len(len: usize) -> usize {
        if len == 0 {
            0
        } else {
            ((len + 31) / 32) * 32
        }
    }

    fn push_padded_bytes(out: &mut Vec<u8>, bytes: &[u8]) {
        out.extend_from_slice(bytes);
        let padding = padded_len(bytes.len()) - bytes.len();
        if padding > 0 {
            out.resize(out.len() + padding, 0u8);
        }
    }

    fn push_u256_from_usize(out: &mut Vec<u8>, value: usize) {
        let mut word = [0u8; 32];
        let usize_bytes = value.to_be_bytes();
        let start = 32 - usize_bytes.len();
        word[start..].copy_from_slice(&usize_bytes);
        out.extend_from_slice(&word);
    }

    fn push_u256_from_u128(out: &mut Vec<u8>, value: u128) {
        let mut word = [0u8; 32];
        let value_bytes = value.to_be_bytes();
        word[16..].copy_from_slice(&value_bytes);
        out.extend_from_slice(&word);
    }

    fn to_lower_hex(bytes: &[u8; 32]) -> String {
        const HEX: &[u8; 16] = b"0123456789abcdef";
        let mut out = String::with_capacity(64);
        for byte in bytes {
            out.push(HEX[(byte >> 4) as usize] as char);
            out.push(HEX[(byte & 0x0f) as usize] as char);
        }
        out
    }

    fn parse_h256_hex(input: &str) -> Option<[u8; 32]> {
        let hex = input
            .strip_prefix("0x")
            .or_else(|| input.strip_prefix("0X"))
            .unwrap_or(input);

        if hex.len() != 64 {
            return None;
        }

        let mut out = [0u8; 32];
        let bytes = hex.as_bytes();
        let mut i = 0;
        while i < 32 {
            let hi = decode_nibble(bytes[i * 2])?;
            let lo = decode_nibble(bytes[i * 2 + 1])?;
            out[i] = (hi << 4) | lo;
            i += 1;
        }
        Some(out)
    }

    fn decode_nibble(byte: u8) -> Option<u8> {
        match byte {
            b'0'..=b'9' => Some(byte - b'0'),
            b'a'..=b'f' => Some(byte - b'a' + 10),
            b'A'..=b'F' => Some(byte - b'A' + 10),
            _ => None,
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        fn expected_demo_hash() -> [u8; 32] {
            [
                37, 22, 253, 249, 253, 189, 89, 130, 68, 9, 28, 211, 77, 165, 139, 101, 234,
                81, 117, 63, 155, 39, 11, 46, 12, 150, 116, 169, 226, 194, 2, 115,
            ]
        }

        #[ink::test]
        fn computes_known_hash_for_demo_payload() {
            let verifier = CommitmentVerifier::new();
            let hash = verifier.compute_hash(
                String::from("dataset-market"),
                10_000_000_000_000_000u128,
                String::from("mysecret123"),
            );
            assert_eq!(hash, expected_demo_hash());
        }

        #[ink::test]
        fn verifies_valid_preimage() {
            let verifier = CommitmentVerifier::new();
            assert!(verifier.verify(
                expected_demo_hash(),
                String::from("dataset-market"),
                10_000_000_000_000_000u128,
                String::from("mysecret123"),
            ));
        }

        #[ink::test]
        fn rejects_wrong_preimage() {
            let verifier = CommitmentVerifier::new();
            assert!(!verifier.verify(
                expected_demo_hash(),
                String::from("dataset-market"),
                10_000_000_000_000_000u128,
                String::from("wrong-secret"),
            ));
        }

        #[ink::test]
        fn verifies_hex_with_optional_prefix() {
            let verifier = CommitmentVerifier::new();
            let bare = String::from("2516fdf9fdbd598244091cd34da58b65ea51753f9b270b2e0c9674a9e2c20273");
            let prefixed = String::from("0x2516fdf9fdbd598244091cd34da58b65ea51753f9b270b2e0c9674a9e2c20273");

            assert!(verifier.verify_hex(
                bare,
                String::from("dataset-market"),
                10_000_000_000_000_000u128,
                String::from("mysecret123"),
            ));

            assert!(verifier.verify_hex(
                prefixed,
                String::from("dataset-market"),
                10_000_000_000_000_000u128,
                String::from("mysecret123"),
            ));
        }
    }
}
