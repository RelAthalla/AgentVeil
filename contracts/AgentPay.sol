// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

/// @title AgentPay private intent escrow
/// @notice Locks buyer funds against a private commitment and releases them on proof.
contract AgentPay {
    struct Intent {
        address buyer;
        uint256 amount;
        bytes32 intentHash;
        bool settled;
    }

    mapping(bytes32 => Intent) public intents;

    event IntentCreated(bytes32 indexed intentHash, address indexed buyer, uint256 amount);
    event IntentSettled(
        bytes32 indexed intentHash,
        address indexed buyer,
        address indexed vendor,
        uint256 amount,
        bytes32 proofHash
    );

    error IntentAlreadyExists();
    error IntentNotFound();
    error InvalidAmount();
    error IntentAlreadySettled();
    error InvalidProof();
    error TransferFailed();

    /// @notice Creates a private intent commitment and locks native funds in escrow.
    function createIntent(bytes32 intentHash) external payable {
        if (msg.value == 0) revert InvalidAmount();
        if (intents[intentHash].buyer != address(0)) revert IntentAlreadyExists();

        intents[intentHash] = Intent({
            buyer: msg.sender,
            amount: msg.value,
            intentHash: intentHash,
            settled: false
        });

        emit IntentCreated(intentHash, msg.sender, msg.value);
    }

    /// @notice Fulfills an existing private intent by presenting the matching proof hash.
    /// @dev This starter version compares the supplied proof hash directly to the stored commitment.
    function fulfillIntent(bytes32 intentHash, bytes32 proofHash) external {
        Intent storage intent = intents[intentHash];

        if (intent.buyer == address(0)) revert IntentNotFound();
        if (intent.settled) revert IntentAlreadySettled();
        if (intent.intentHash != proofHash) revert InvalidProof();

        intent.settled = true;

        (bool success, ) = payable(msg.sender).call{value: intent.amount}("");
        if (!success) revert TransferFailed();

        emit IntentSettled(intentHash, intent.buyer, msg.sender, intent.amount, proofHash);
    }
}
