// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IIntentVerifier} from "./IIntentVerifier.sol";

/// @title AgentPay private intent escrow
/// @notice Locks buyer funds against a private commitment and releases them after verifier approval.
contract AgentPay {
    enum IntentStatus {
        None,
        Active,
        Settled,
        Refunded
    }

    struct Intent {
        address buyer;
        address expectedVendor;
        uint256 amount;
        uint64 createdAt;
        uint64 deadline;
        bytes32 intentHash;
        IntentStatus status;
    }

    IIntentVerifier public immutable verifier;
    mapping(bytes32 => Intent) private intents;

    event IntentCreated(
        bytes32 indexed intentHash,
        address indexed buyer,
        address indexed expectedVendor,
        uint256 amount,
        uint64 deadline
    );
    event IntentSettled(
        bytes32 indexed intentHash,
        address indexed buyer,
        address indexed vendor,
        uint256 amount,
        uint64 settledAt
    );
    event IntentRefunded(
        bytes32 indexed intentHash,
        address indexed buyer,
        uint256 amount,
        uint64 refundedAt
    );

    error InvalidVerifier();
    error InvalidIntentHash();
    error IntentAlreadyExists();
    error IntentNotFound();
    error InvalidAmount();
    error InvalidDeadline();
    error IntentNotActive();
    error IntentExpired();
    error RefundUnavailable();
    error UnauthorizedBuyer();
    error UnauthorizedVendor();
    error InvalidProof();
    error AmountMismatch();
    error TransferFailed();

    constructor(address verifierAddress) {
        if (verifierAddress == address(0)) revert InvalidVerifier();
        verifier = IIntentVerifier(verifierAddress);
    }

    /// @notice Creates a private intent commitment and locks native funds in escrow.
    /// @param intentHash Commitment hash computed off-chain from the service metadata.
    /// @param deadline Unix timestamp after which the buyer may refund if unsettled.
    /// @param expectedVendor Optional vendor binding. Use address(0) for open fulfillment.
    function createIntent(bytes32 intentHash, uint64 deadline, address expectedVendor) external payable {
        if (intentHash == bytes32(0)) revert InvalidIntentHash();
        if (msg.value == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();
        if (intents[intentHash].buyer != address(0)) revert IntentAlreadyExists();

        intents[intentHash] = Intent({
            buyer: msg.sender,
            expectedVendor: expectedVendor,
            amount: msg.value,
            createdAt: uint64(block.timestamp),
            deadline: deadline,
            intentHash: intentHash,
            status: IntentStatus.Active
        });

        emit IntentCreated(intentHash, msg.sender, expectedVendor, msg.value, deadline);
    }

    /// @notice Fulfills an intent by submitting the commitment preimage for verifier approval.
    function fulfillIntent(
        bytes32 intentHash,
        string calldata serviceName,
        uint256 quotedPriceWei,
        string calldata secretNonce
    ) external {
        Intent storage intent = intents[intentHash];

        if (intent.buyer == address(0)) revert IntentNotFound();
        if (intent.status != IntentStatus.Active) revert IntentNotActive();
        if (block.timestamp >= intent.deadline) revert IntentExpired();
        if (intent.expectedVendor != address(0) && msg.sender != intent.expectedVendor) {
            revert UnauthorizedVendor();
        }
        if (quotedPriceWei != intent.amount) revert AmountMismatch();
        if (!verifier.verify(intent.intentHash, serviceName, quotedPriceWei, secretNonce)) {
            revert InvalidProof();
        }

        uint256 payout = intent.amount;
        intent.amount = 0;
        intent.status = IntentStatus.Settled;

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        if (!success) revert TransferFailed();

        emit IntentSettled(intentHash, intent.buyer, msg.sender, payout, uint64(block.timestamp));
    }

    /// @notice Refunds an expired unsettled intent back to the buyer.
    function refundIntent(bytes32 intentHash) external {
        Intent storage intent = intents[intentHash];

        if (intent.buyer == address(0)) revert IntentNotFound();
        if (intent.status != IntentStatus.Active) revert IntentNotActive();
        if (msg.sender != intent.buyer) revert UnauthorizedBuyer();
        if (block.timestamp < intent.deadline) revert RefundUnavailable();

        uint256 refundAmount = intent.amount;
        intent.amount = 0;
        intent.status = IntentStatus.Refunded;

        (bool success, ) = payable(intent.buyer).call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit IntentRefunded(intentHash, intent.buyer, refundAmount, uint64(block.timestamp));
    }

    function getIntent(bytes32 intentHash) external view returns (Intent memory) {
        return intents[intentHash];
    }

    function getIntentStatus(bytes32 intentHash) external view returns (IntentStatus) {
        Intent storage intent = intents[intentHash];
        if (intent.buyer == address(0)) revert IntentNotFound();
        return intent.status;
    }
}
