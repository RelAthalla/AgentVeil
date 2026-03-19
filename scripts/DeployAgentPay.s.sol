// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {AgentPay} from "../contracts/AgentPay.sol";

contract DeployAgentPay is Script {
    function run() external returns (AgentPay deployedAgentPay) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address verifierAddress = vm.envAddress("VERIFIER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);
        deployedAgentPay = new AgentPay(verifierAddress);
        vm.stopBroadcast();

        console2.log("Using verifier at", verifierAddress);
        console2.log("AgentPay deployed at", address(deployedAgentPay));
    }
}
