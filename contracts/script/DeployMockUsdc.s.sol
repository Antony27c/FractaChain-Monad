// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {TestToken} from "../src/mocks/TestToken.sol";

contract DeployMockUsdc is Script {
    function run() external returns (TestToken token) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        token = new TestToken("Mock USDC", "mUSDC", 6);
        token.mint(vm.addr(pk), 200_000e6);
        vm.stopBroadcast();
        console.log("mUSDC:", address(token));
    }
}
