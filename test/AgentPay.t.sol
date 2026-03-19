// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentPay} from "../contracts/AgentPay.sol";
import {IIntentVerifier} from "../contracts/IIntentVerifier.sol";

contract MockIntentVerifier is IIntentVerifier {
    function verify(
        bytes32 intentHash,
        string calldata serviceName,
        uint256 quotedPriceWei,
        string calldata secretNonce
    ) external pure returns (bool) {
        return keccak256(abi.encode(serviceName, quotedPriceWei, secretNonce)) == intentHash;
    }
}

contract AgentPayTest is Test {
    AgentPay internal agentPay;
    MockIntentVerifier internal verifier;

    address internal constant BUYER = address(0xA11CE);
    address payable internal constant VENDOR = payable(address(0xBEEF));
    address internal constant OTHER_VENDOR = address(0xCAFE);

    string internal constant SERVICE_NAME = "market-sentiment-feed";
    string internal constant SECRET_NONCE = "nonce-123";
    uint256 internal constant PRICE = 1 ether;
    uint64 internal constant DEADLINE_OFFSET = 1 days;

    function setUp() public {
        vm.deal(BUYER, 10 ether);
        vm.deal(VENDOR, 1 ether);
        vm.deal(OTHER_VENDOR, 1 ether);

        verifier = new MockIntentVerifier();
        agentPay = new AgentPay(address(verifier));
    }

    function testCreatesIntentAndLocksFunds() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(BUYER);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, VENDOR);

        AgentPay.Intent memory intent = agentPay.getIntent(intentHash);
        assertEq(intent.buyer, BUYER, "buyer mismatch");
        assertEq(intent.expectedVendor, VENDOR, "expected vendor mismatch");
        assertEq(intent.amount, PRICE, "amount mismatch");
        assertEq(intent.createdAt, uint64(block.timestamp), "createdAt mismatch");
        assertEq(intent.deadline, deadline, "deadline mismatch");
        assertEq(intent.intentHash, intentHash, "intent hash mismatch");
        assertEq(uint256(intent.status), uint256(AgentPay.IntentStatus.Active), "status mismatch");
    }

    function testRejectsZeroValueIntent() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(BUYER);
        vm.expectRevert(AgentPay.InvalidAmount.selector);
        agentPay.createIntent{value: 0}(intentHash, deadline, VENDOR);
    }

    function testRejectsDuplicateIntentHash() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(BUYER);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, VENDOR);

        vm.prank(BUYER);
        vm.expectRevert(AgentPay.IntentAlreadyExists.selector);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, VENDOR);
    }

    function testFulfillsIntentAndReleasesFundsToBoundVendor() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);
        uint256 vendorBalanceBefore = VENDOR.balance;

        vm.prank(BUYER);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, VENDOR);

        vm.prank(VENDOR);
        agentPay.fulfillIntent(intentHash, SERVICE_NAME, PRICE, SECRET_NONCE);

        AgentPay.Intent memory intent = agentPay.getIntent(intentHash);
        assertEq(VENDOR.balance, vendorBalanceBefore + PRICE, "vendor should receive payment");
        assertEq(intent.amount, 0, "amount should be zero after payout");
        assertEq(uint256(intent.status), uint256(AgentPay.IntentStatus.Settled), "status mismatch");
    }

    function testAllowsOpenIntentWhenVendorUnbound() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);
        uint256 vendorBalanceBefore = OTHER_VENDOR.balance;

        vm.prank(BUYER);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, address(0));

        vm.prank(OTHER_VENDOR);
        agentPay.fulfillIntent(intentHash, SERVICE_NAME, PRICE, SECRET_NONCE);

        assertEq(OTHER_VENDOR.balance, vendorBalanceBefore + PRICE, "open intent should pay fulfiller");
    }

    function testRejectsInvalidProofData() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(BUYER);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, VENDOR);

        vm.prank(VENDOR);
        vm.expectRevert(AgentPay.InvalidProof.selector);
        agentPay.fulfillIntent(intentHash, SERVICE_NAME, PRICE, "wrong-nonce");
    }

    function testRejectsAmountMismatchBetweenEscrowAndProof() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(BUYER);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, VENDOR);

        vm.prank(VENDOR);
        vm.expectRevert(AgentPay.AmountMismatch.selector);
        agentPay.fulfillIntent(intentHash, SERVICE_NAME, PRICE - 1, SECRET_NONCE);
    }

    function testRejectsWrongVendorWhenVendorIsBound() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(BUYER);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, VENDOR);

        vm.prank(OTHER_VENDOR);
        vm.expectRevert(AgentPay.UnauthorizedVendor.selector);
        agentPay.fulfillIntent(intentHash, SERVICE_NAME, PRICE, SECRET_NONCE);
    }

    function testRejectsUnknownIntent() public {
        vm.prank(VENDOR);
        vm.expectRevert(AgentPay.IntentNotFound.selector);
        agentPay.fulfillIntent(bytes32(uint256(123)), SERVICE_NAME, PRICE, SECRET_NONCE);
    }

    function testRefundBeforeDeadlineReverts() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(BUYER);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, VENDOR);

        vm.prank(BUYER);
        vm.expectRevert(AgentPay.RefundUnavailable.selector);
        agentPay.refundIntent(intentHash);
    }

    function testRefundAfterDeadlineReturnsFunds() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);
        uint256 buyerBalanceBefore = BUYER.balance;

        vm.prank(BUYER);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, VENDOR);

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.prank(BUYER);
        agentPay.refundIntent(intentHash);

        AgentPay.Intent memory intent = agentPay.getIntent(intentHash);
        assertEq(BUYER.balance, buyerBalanceBefore, "buyer should recover escrowed funds");
        assertEq(intent.amount, 0, "amount should be zero after refund");
        assertEq(uint256(intent.status), uint256(AgentPay.IntentStatus.Refunded), "status mismatch");
    }

    function testCannotFulfillAfterRefund() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(BUYER);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, VENDOR);

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.prank(BUYER);
        agentPay.refundIntent(intentHash);

        vm.prank(VENDOR);
        vm.expectRevert(AgentPay.IntentNotActive.selector);
        agentPay.fulfillIntent(intentHash, SERVICE_NAME, PRICE, SECRET_NONCE);
    }

    function testCannotFulfillAfterDeadline() public {
        bytes32 intentHash = _intentHash(SERVICE_NAME, PRICE, SECRET_NONCE);
        uint64 deadline = uint64(block.timestamp + DEADLINE_OFFSET);

        vm.prank(BUYER);
        agentPay.createIntent{value: PRICE}(intentHash, deadline, VENDOR);

        vm.warp(block.timestamp + DEADLINE_OFFSET + 1);

        vm.prank(VENDOR);
        vm.expectRevert(AgentPay.IntentExpired.selector);
        agentPay.fulfillIntent(intentHash, SERVICE_NAME, PRICE, SECRET_NONCE);
    }

    function _intentHash(
        string memory serviceName,
        uint256 quotedPriceWei,
        string memory secretNonce
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(serviceName, quotedPriceWei, secretNonce));
    }
}
