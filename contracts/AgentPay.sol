// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title AgentPay Shield settlement contract
/// @notice Stores private intent commitments while settling value on an EVM chain.
contract AgentPay {
    address public immutable owner;

    mapping(bytes32 => bool) public settledIntents;

    event IntentSettled(
        bytes32 indexed intentHash,
        address indexed payer,
        address indexed payee,
        uint256 amount,
        bytes32 proofCommitment
    );

    error InvalidOwner();
    error InvalidPayee();
    error InvalidAmount();
    error IncorrectValue();
    error IntentAlreadySettled();
    error TransferFailed();

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert InvalidOwner();
        owner = initialOwner;
    }

    /// @notice Settles a private payment intent without exposing the underlying payload.
    /// @param intentHash Unique hash that represents the private intent/nullifier.
    /// @param payee Recipient that receives the payment.
    /// @param amount Settlement amount in the native token.
    /// @param proofCommitment Commitment to an off-chain proof verified by the wider stack.
    function settleIntent(
        bytes32 intentHash,
        address payable payee,
        uint256 amount,
        bytes32 proofCommitment
    ) external payable {
        if (settledIntents[intentHash]) revert IntentAlreadySettled();
        if (payee == address(0)) revert InvalidPayee();
        if (amount == 0) revert InvalidAmount();
        if (msg.value != amount) revert IncorrectValue();

        settledIntents[intentHash] = true;

        (bool success, ) = payee.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit IntentSettled(intentHash, msg.sender, payee, amount, proofCommitment);
    }
}
