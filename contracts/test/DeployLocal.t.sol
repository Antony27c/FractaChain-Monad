// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {DeployLocal} from "../script/DeployLocal.s.sol";
import {TestToken} from "../src/mocks/TestToken.sol";

contract DeployLocalTest is Test {
    uint256 constant PK = 0xA11CE;

    function test_DeployLocal() public {
        vm.setEnv("PRIVATE_KEY", vm.toString(PK));
        Deploy.Deployed memory d = new DeployLocal().run();

        address deployer = vm.addr(PK);
        TestToken usdc = TestToken(d.factory.paymentToken());
        assertEq(usdc.decimals(), 6);
        assertEq(usdc.balanceOf(deployer), 1_000_000e6);

        assertEq(d.kyc.owner(), deployer);
        assertTrue(d.kyc.openVerification());
        assertEq(d.factory.issuancesCount(), 1);
        assertEq(ShardTokenLike(d.token).balanceOf(d.offering), 1_000_000 ether);
    }
}

interface ShardTokenLike {
    function balanceOf(address) external view returns (uint256);
}
