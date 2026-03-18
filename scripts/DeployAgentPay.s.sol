// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {AgentPay} from "../contracts/AgentPay.sol";
import {SimpleIntentVerifier} from "../contracts/SimpleIntentVerifier.sol";

contract DeployAgentPay is Script {
    function run() external returns (SimpleIntentVerifier deployedVerifier, AgentPay deployedAgentPay) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        deployedVerifier = new SimpleIntentVerifier();
        deployedAgentPay = new AgentPay(address(deployedVerifier));
        vm.stopBroadcast();

        console2.log("SimpleIntentVerifier deployed at", address(deployedVerifier));
        console2.log("AgentPay deployed at", address(deployedAgentPay));
    }
}
