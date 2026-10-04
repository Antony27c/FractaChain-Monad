// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {console} from "forge-std/Script.sol";
import {TestToken} from "../src/mocks/TestToken.sol";
import {Deploy} from "./Deploy.s.sol";

contract DeployLocal is Deploy {
    uint256 constant ANVIL_PK = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 constant LOCAL_USDC_MINT = 1_000_000e6;

    function run() external override returns (Deployed memory d) {
        uint256 pk = vm.envOr("PRIVATE_KEY", ANVIL_PK);
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);
        TestToken usdc = new TestToken("USD Coin", "USDC", 6);
        usdc.mint(deployer, LOCAL_USDC_MINT);
        d = _deploy(deployer, address(usdc), true, true);
        vm.stopBroadcast();

        console.log("Mock USDC        :", address(usdc));
        console.log("KycRegistry      :", address(d.kyc));
        console.log("IssuanceFactory  :", address(d.factory));
        console.log("Sample ShardToken:", d.token);
        console.log("Sample Offering  :", d.offering);
    }
}
