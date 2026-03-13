// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {AgentPay} from "../contracts/AgentPay.sol";

contract AgentPayTest is Test {
    AgentPay internal agentPay;

    address payable internal constant VENDOR = payable(address(0xBEEF));

    function setUp() public {
        vm.deal(address(this), 10 ether);
        agentPay = new AgentPay();
    }

    function testCreatesIntentAndLocksFunds() public {
        bytes32 intentHash = keccak256("intent-1");
        uint256 amount = 1 ether;

        agentPay.createIntent{value: amount}(intentHash);

        (address buyer, uint256 escrowedAmount, bytes32 storedIntentHash, bool settled) =
            agentPay.intents(intentHash);

        assertEq(buyer, address(this), "buyer mismatch");
        assertEq(escrowedAmount, amount, "amount mismatch");
        assertEq(storedIntentHash, intentHash, "intent hash mismatch");
        assertTrue(!settled, "intent should start unsettled");
    }

    function testFulfillsIntentAndReleasesFundsToVendor() public {
        bytes32 intentHash = keccak256("intent-2");
        uint256 amount = 1 ether;
        uint256 balanceBefore = VENDOR.balance;

        agentPay.createIntent{value: amount}(intentHash);

        vm.prank(VENDOR);
        agentPay.fulfillIntent(intentHash, intentHash);

        (, uint256 escrowedAmount, , bool settled) = agentPay.intents(intentHash);

        assertEq(VENDOR.balance, balanceBefore + amount, "vendor should receive payment");
        assertEq(escrowedAmount, amount, "stored amount mismatch");
        assertTrue(settled, "intent should be marked settled");
    }

    function testRejectsInvalidProofHash() public {
        bytes32 intentHash = keccak256("intent-3");
        uint256 amount = 0.5 ether;

        agentPay.createIntent{value: amount}(intentHash);

        vm.prank(VENDOR);
        (bool success, ) = address(agentPay).call(
            abi.encodeCall(AgentPay.fulfillIntent, (intentHash, keccak256("wrong-proof")))
        );

        assertTrue(!success, "invalid proof should fail");
    }

    function testRejectsReplayForSameIntentHash() public {
        bytes32 intentHash = keccak256("intent-4");
        uint256 amount = 0.25 ether;

        agentPay.createIntent{value: amount}(intentHash);

        vm.prank(VENDOR);
        agentPay.fulfillIntent(intentHash, intentHash);

        vm.prank(VENDOR);
        (bool success, ) = address(agentPay).call(
            abi.encodeCall(AgentPay.fulfillIntent, (intentHash, intentHash))
        );

        assertTrue(!success, "replayed intent should fail");
    }
}
