// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {KycRegistry} from "../src/KycRegistry.sol";
import {Offering} from "../src/Offering.sol";
import {TestToken} from "../src/mocks/TestToken.sol";
import {ReentrantToken} from "../src/mocks/ReentrantToken.sol";

contract SecurityTest is Test {
    uint256 constant SUPPLY = 1_000_000 ether;
    uint256 constant PRICE = 100_000;
    uint256 constant SOFT = 40_000e6;
    uint256 constant HARD = 100_000e6;
    uint256 constant DURATION = 7 days;

    KycRegistry kyc;
    address investor = address(0xA11CE);

    function _newOffering(ReentrantToken pay, TestToken shard) internal returns (Offering o) {
        kyc = new KycRegistry(address(this));
        kyc.setVerified(investor, true);
        o = new Offering(
            address(shard), address(pay), address(kyc), address(this), PRICE, SOFT, HARD, block.timestamp + DURATION
        );
        shard.mint(address(o), SUPPLY);
    }

    function test_Reentrancy_ContributeBlocked() public {
        ReentrantToken pay = new ReentrantToken(6);
        Offering o = _newOffering(pay, new TestToken("Shard", "SH", 18));
        pay.mint(investor, HARD);
        pay.arm(address(o), abi.encodeCall(Offering.contribute, (50_000e6)));

        vm.prank(investor);
        o.contribute(HARD);

        assertEq(o.contributions(investor), HARD);
        assertEq(o.totalRaised(), HARD);
        assertFalse(pay.hookSucceeded());
    }

    function test_Reentrancy_FinalizeBlockedDuringContribute() public {
        ReentrantToken pay = new ReentrantToken(6);
        Offering o = _newOffering(pay, new TestToken("Shard", "SH", 18));
        pay.mint(investor, HARD);
        pay.arm(address(o), abi.encodeCall(Offering.finalize, ()));

        vm.prank(investor);
        o.contribute(HARD);

        assertFalse(pay.hookSucceeded());
        assertTrue(o.status() == Offering.Status.Active);

        o.finalize();
        assertTrue(o.status() == Offering.Status.Succeeded);
    }

    function test_Reentrancy_RefundBlocked() public {
        ReentrantToken pay = new ReentrantToken(6);
        Offering o = _newOffering(pay, new TestToken("Shard", "SH", 18));
        uint256 paid = SOFT - 1e6;
        pay.mint(investor, paid);

        vm.prank(investor);
        o.contribute(paid);
        vm.warp(block.timestamp + DURATION + 1);
        o.finalize();
        assertTrue(o.status() == Offering.Status.Failed);

        pay.arm(address(o), abi.encodeCall(Offering.refund, ()));
        vm.prank(investor);
        o.refund();

        assertFalse(pay.hookSucceeded());
        assertEq(pay.balanceOf(investor), paid);
        assertEq(o.contributions(investor), 0);
    }

    function test_Reentrancy_ClaimBlocked() public {
        ReentrantToken pay = new ReentrantToken(6);
        ReentrantToken shard = new ReentrantToken(18);
        kyc = new KycRegistry(address(this));
        kyc.setVerified(investor, true);
        Offering o = new Offering(
            address(shard), address(pay), address(kyc), address(this), PRICE, SOFT, HARD, block.timestamp + DURATION
        );
        shard.mint(address(o), SUPPLY);
        pay.mint(investor, HARD);

        vm.prank(investor);
        o.contribute(HARD);
        o.finalize();
        assertTrue(o.status() == Offering.Status.Succeeded);

        shard.arm(address(o), abi.encodeCall(Offering.claim, ()));
        vm.prank(investor);
        o.claim();

        assertFalse(shard.hookSucceeded());
        assertEq(shard.balanceOf(investor), o.shardsFor(HARD));
        assertEq(o.contributions(investor), 0);
    }
}
