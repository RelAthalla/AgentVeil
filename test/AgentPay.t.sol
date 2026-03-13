// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {AgentPay} from "../contracts/AgentPay.sol";

contract AgentPayTest is Test {
    AgentPay internal agentPay;

    address internal constant OWNER = address(0xA11CE);
    address payable internal constant VENDOR = payable(address(0xBEEF));

    function setUp() public {
        vm.deal(address(this), 10 ether);
        agentPay = new AgentPay(OWNER);
    }

    function testSetsInitialOwner() public view {
        assertEq(agentPay.owner(), OWNER, "owner mismatch");
    }

    function testSettlesPrivateIntentAndTransfersValue() public {
        bytes32 intentHash = keccak256("intent-1");
        bytes32 proofCommitment = keccak256("proof-1");
        uint256 amount = 1 ether;
        uint256 balanceBefore = VENDOR.balance;

        agentPay.settleIntent{value: amount}(intentHash, VENDOR, amount, proofCommitment);

        assertTrue(agentPay.settledIntents(intentHash), "intent should be marked settled");
        assertEq(VENDOR.balance, balanceBefore + amount, "vendor should receive payment");
    }

    function testRejectsReplayForSameIntentHash() public {
        bytes32 intentHash = keccak256("intent-2");
        uint256 amount = 0.5 ether;

        agentPay.settleIntent{value: amount}(intentHash, VENDOR, amount, keccak256("proof-a"));

        (bool success, ) = address(agentPay).call{value: amount}(
            abi.encodeCall(
                AgentPay.settleIntent, (intentHash, VENDOR, amount, keccak256("proof-b"))
            )
        );

        assertTrue(!success, "replayed intent should fail");
    }
}
