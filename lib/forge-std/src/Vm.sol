// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

interface Vm {
    function deal(address who, uint256 newBalance) external;
    function envAddress(string calldata name) external returns (address value);
    function envUint(string calldata name) external returns (uint256 value);
    function prank(address msgSender) external;
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}
