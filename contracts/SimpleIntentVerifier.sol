// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIntentVerifier} from "./IIntentVerifier.sol";

/// @title SimpleIntentVerifier
/// @notice MVP verifier that recomputes the commitment from the cleartext preimage.
/// @dev This is a stub verifier for hackathon use. It preserves the architecture shape so it
/// can later be replaced by a PolkaVM/ZK-backed verifier without changing the escrow flow.
contract SimpleIntentVerifier is IIntentVerifier {
    function computeIntentHash(
        string calldata serviceName,
        uint256 quotedPriceWei,
        string calldata secretNonce
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(serviceName, quotedPriceWei, secretNonce));
    }

    function verify(
        bytes32 intentHash,
        string calldata serviceName,
        uint256 quotedPriceWei,
        string calldata secretNonce
    ) external pure override returns (bool) {
        return keccak256(abi.encode(serviceName, quotedPriceWei, secretNonce)) == intentHash;
    }
}
