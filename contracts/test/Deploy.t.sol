// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {Offering} from "../src/Offering.sol";
import {ShardToken} from "../src/ShardToken.sol";
import {TestToken} from "../src/mocks/TestToken.sol";

contract DeployTest is Test {
    uint256 constant PK = 0xA11CE;

    function _run(bool open, bool sample) internal returns (Deploy.Deployed memory d) {
        TestToken usdc = new TestToken("USD Coin", "USDC", 6);
        vm.setEnv("PRIVATE_KEY", vm.toString(PK));
        vm.setEnv("PAYMENT_TOKEN", vm.toString(address(usdc)));
        vm.setEnv("OPEN_VERIFICATION", open ? "true" : "false");
        vm.setEnv("CREATE_SAMPLE", sample ? "true" : "false");
        vm.deal(vm.addr(PK), 10 ether);
        d = new Deploy().run();
    }

    // Environment variables are process-wide and Foundry runs tests in parallel,
    // so both scenarios run sequentially inside a single test.
    function test_DeployScenarios() public {
        address deployer = vm.addr(PK);

        Deploy.Deployed memory a = _run(false, false);
        assertEq(a.kyc.owner(), deployer);
        assertTrue(a.kyc.isVerified(deployer));
        assertFalse(a.kyc.openVerification());
        assertEq(a.factory.issuancesCount(), 0);
        assertEq(a.token, address(0));

        Deploy.Deployed memory b = _run(true, true);
        assertTrue(b.kyc.openVerification());
        assertEq(b.factory.issuancesCount(), 1);

        ShardToken token = ShardToken(b.token);
        Offering offering = Offering(b.offering);
        assertEq(token.symbol(), "SOJA26");
        assertEq(token.balanceOf(b.offering), 1_000_000 ether);
        assertEq(offering.issuer(), deployer);
        assertEq(offering.softCap(), 40_000e6);
        assertEq(offering.hardCap(), 100_000e6);
        assertEq(offering.pricePerShard(), 100_000);
    }
}
