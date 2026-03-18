// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIntentVerifier {
    function verify(
        bytes32 intentHash,
        string calldata serviceName,
        uint256 quotedPriceWei,
        string calldata secretNonce
    ) external view returns (bool);
}
