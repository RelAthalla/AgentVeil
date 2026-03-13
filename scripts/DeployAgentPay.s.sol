// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {AgentPay} from "../contracts/AgentPay.sol";

contract DeployAgentPay is Script {
    function run() external returns (AgentPay deployed) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        deployed = new AgentPay();
        vm.stopBroadcast();

        console2.log("AgentPay deployed at", address(deployed));
    }
}
