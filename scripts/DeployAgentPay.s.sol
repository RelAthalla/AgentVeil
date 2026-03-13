// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script} from "forge-std/Script.sol";
import {AgentPay} from "../contracts/AgentPay.sol";

contract DeployAgentPay is Script {
    function run() external returns (AgentPay deployed) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address initialOwner = vm.envAddress("INITIAL_OWNER");

        vm.startBroadcast(deployerPrivateKey);
        deployed = new AgentPay(initialOwner);
        vm.stopBroadcast();
    }
}
