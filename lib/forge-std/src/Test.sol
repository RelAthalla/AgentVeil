// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Vm} from "./Vm.sol";

abstract contract Test {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function assertEq(address left, address right) internal pure {
        require(left == right, "assertEq(address) failed");
    }

    function assertEq(address left, address right, string memory message) internal pure {
        require(left == right, message);
    }

    function assertEq(uint256 left, uint256 right) internal pure {
        require(left == right, "assertEq(uint256) failed");
    }

    function assertEq(uint256 left, uint256 right, string memory message) internal pure {
        require(left == right, message);
    }

    function assertEq(bytes32 left, bytes32 right, string memory message) internal pure {
        require(left == right, message);
    }

    function assertTrue(bool condition, string memory message) internal pure {
        require(condition, message);
    }
}
