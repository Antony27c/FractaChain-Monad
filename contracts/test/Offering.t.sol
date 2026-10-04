// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {Offering} from "../src/Offering.sol";
import {ShardToken} from "../src/ShardToken.sol";
import {KycRegistry} from "../src/KycRegistry.sol";
import {TestToken} from "../src/mocks/TestToken.sol";
import {FalseToken, NoReturnToken} from "../src/mocks/WeirdTokens.sol";

contract OfferingTest is Test {
    uint256 constant SUPPLY = 1_000_000 ether;
    uint256 constant PRICE = 100_000; // 0.10 USDC (6 decimals) per shard
    uint256 constant SOFT_CAP = 40_000e6;
    uint256 constant HARD_CAP = 100_000e6;

    KycRegistry kyc;
    TestToken usdc;
    ShardToken shard;
    Offering offering;

    address registryOwner = makeAddr("registryOwner");
    address issuer = makeAddr("issuer");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address stranger = makeAddr("stranger");

    uint256 deadline;

    function setUp() public {
        deadline = block.timestamp + 7 days;
        kyc = new KycRegistry(registryOwner);
        usdc = new TestToken("USD Coin", "USDC", 6);
        shard = new ShardToken(
            "Shard Soja",
            "SOJA",
            ShardToken.AssetInfo({assetType: "Soja", unit: "tn", quantity: 100, campaign: "2025/26"}),
            issuer,
            address(this),
            SUPPLY
        );
        offering = new Offering(
            address(shard), address(usdc), address(kyc), issuer, PRICE, SOFT_CAP, HARD_CAP, deadline
        );
        shard.transfer(address(offering), SUPPLY);

        vm.startPrank(registryOwner);
        kyc.setVerified(alice, true);
        kyc.setVerified(bob, true);
        vm.stopPrank();

        _fund(alice, 200_000e6);
        _fund(bob, 200_000e6);
    }

    function _fund(address who, uint256 amount) internal {
        usdc.mint(who, amount);
        vm.prank(who);
        usdc.approve(address(offering), type(uint256).max);
    }

    function _contribute(address who, uint256 amount) internal {
        vm.prank(who);
        offering.contribute(amount);
    }

    function test_InitialState() public view {
        assertEq(uint256(offering.status()), uint256(Offering.Status.Active));
        assertEq(offering.totalRaised(), 0);
        assertEq(offering.shardsFor(1e6), 10 ether);
    }

    function test_RevertWhen_InvalidParams() public {
        vm.expectRevert(Offering.InvalidParams.selector);
        new Offering(address(shard), address(usdc), address(kyc), issuer, 0, SOFT_CAP, HARD_CAP, deadline);
        vm.expectRevert(Offering.InvalidParams.selector);
        new Offering(address(shard), address(usdc), address(kyc), issuer, PRICE, HARD_CAP + 1, HARD_CAP, deadline);
        vm.expectRevert(Offering.InvalidParams.selector);
        new Offering(address(shard), address(usdc), address(kyc), issuer, PRICE, SOFT_CAP, HARD_CAP, block.timestamp);
        vm.expectRevert(Offering.ZeroAddress.selector);
        new Offering(address(0), address(usdc), address(kyc), issuer, PRICE, SOFT_CAP, HARD_CAP, deadline);
    }

    function test_RevertWhen_PriceAboveShardUnit() public {
        vm.expectRevert(Offering.InvalidParams.selector);
        new Offering(address(shard), address(usdc), address(kyc), issuer, 1e18 + 1, SOFT_CAP, HARD_CAP, deadline);
    }

    function test_RevertWhen_SameShardAndPaymentToken() public {
        vm.expectRevert(Offering.InvalidParams.selector);
        new Offering(address(shard), address(shard), address(kyc), issuer, PRICE, SOFT_CAP, HARD_CAP, deadline);
    }

    function test_ContributeTwiceAccumulates() public {
        _contribute(alice, 1_000e6);
        _contribute(alice, 2_000e6);

        assertEq(offering.contributions(alice), 3_000e6);
        assertEq(offering.totalRaised(), 3_000e6);
    }

    function test_RevertWhen_ContributeAfterFinalize() public {
        _contribute(alice, 50_000e6);
        vm.warp(deadline);
        offering.finalize();

        vm.prank(alice);
        vm.expectRevert(Offering.NotActive.selector);
        offering.contribute(1_000e6);
    }

    function test_FinalizeEmptyAfterDeadline() public {
        vm.warp(deadline);
        offering.finalize();

        assertEq(uint256(offering.status()), uint256(Offering.Status.Failed));
        assertEq(shard.balanceOf(issuer), SUPPLY);
        assertEq(shard.balanceOf(address(offering)), 0);
        assertEq(usdc.balanceOf(address(offering)), 0);
        assertEq(usdc.balanceOf(issuer), 0);
    }

    function test_SmallestContributionStillGetsShards() public {
        _contribute(alice, 1);
        assertGt(offering.shardsFor(1), 0);
    }

    function test_RevokedKycCanStillClaim() public {
        _contribute(alice, 50_000e6);
        vm.warp(deadline);
        offering.finalize();

        vm.prank(registryOwner);
        kyc.setVerified(alice, false);

        vm.prank(alice);
        offering.claim();
        assertEq(shard.balanceOf(alice), 500_000 ether);
    }

    function test_RevokedKycCanStillRefund() public {
        _contribute(alice, 10_000e6);
        vm.warp(deadline);
        offering.finalize();

        vm.prank(registryOwner);
        kyc.setVerified(alice, false);

        vm.prank(alice);
        offering.refund();
        assertEq(usdc.balanceOf(alice), 200_000e6);
    }

    function test_Contribute() public {
        _contribute(alice, 1_000e6);

        assertEq(offering.contributions(alice), 1_000e6);
        assertEq(offering.totalRaised(), 1_000e6);
        assertEq(usdc.balanceOf(address(offering)), 1_000e6);
        assertEq(usdc.balanceOf(alice), 199_000e6);
    }

    function test_RevertWhen_NotVerified() public {
        usdc.mint(stranger, 1_000e6);
        vm.startPrank(stranger);
        usdc.approve(address(offering), type(uint256).max);
        vm.expectRevert(Offering.NotVerified.selector);
        offering.contribute(1_000e6);
        vm.stopPrank();
    }

    function test_RevertWhen_ZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(Offering.ZeroAmount.selector);
        offering.contribute(0);
    }

    function test_RevertWhen_HardCapExceeded() public {
        _contribute(alice, 90_000e6);
        vm.prank(bob);
        vm.expectRevert(Offering.HardCapExceeded.selector);
        offering.contribute(10_001e6);
    }

    function test_RevertWhen_ContributeAfterDeadline() public {
        vm.warp(deadline);
        vm.prank(alice);
        vm.expectRevert(Offering.OfferingEnded.selector);
        offering.contribute(1_000e6);
    }

    function test_RevertWhen_NotFunded() public {
        Offering empty = new Offering(
            address(shard), address(usdc), address(kyc), issuer, PRICE, SOFT_CAP, HARD_CAP, deadline
        );
        vm.startPrank(alice);
        usdc.approve(address(empty), type(uint256).max);
        vm.expectRevert(Offering.NotFunded.selector);
        empty.contribute(1_000e6);
        vm.stopPrank();
    }

    function test_RevertWhen_FinalizeTooEarly() public {
        _contribute(alice, 50_000e6);
        vm.expectRevert(Offering.CannotFinalizeYet.selector);
        offering.finalize();
    }

    function test_FinalizeSuccessAfterDeadline() public {
        _contribute(alice, 30_000e6);
        _contribute(bob, 20_000e6);
        vm.warp(deadline);

        offering.finalize();

        assertEq(uint256(offering.status()), uint256(Offering.Status.Succeeded));
        assertEq(usdc.balanceOf(issuer), 50_000e6);
        assertEq(shard.balanceOf(issuer), SUPPLY - 500_000 ether);
        assertEq(shard.balanceOf(address(offering)), 500_000 ether);
    }

    function test_FinalizeEarlyWhenHardCapReached() public {
        _contribute(alice, 60_000e6);
        _contribute(bob, 40_000e6);

        offering.finalize();

        assertEq(uint256(offering.status()), uint256(Offering.Status.Succeeded));
        assertEq(usdc.balanceOf(issuer), HARD_CAP);
        assertEq(shard.balanceOf(issuer), 0);
    }

    function test_FinalizeFailsBelowSoftCap() public {
        _contribute(alice, 10_000e6);
        vm.warp(deadline);

        offering.finalize();

        assertEq(uint256(offering.status()), uint256(Offering.Status.Failed));
        assertEq(usdc.balanceOf(issuer), 0);
        assertEq(shard.balanceOf(issuer), SUPPLY);
        assertEq(usdc.balanceOf(address(offering)), 10_000e6);
    }

    function test_RevertWhen_FinalizeTwice() public {
        vm.warp(deadline);
        offering.finalize();
        vm.expectRevert(Offering.NotActive.selector);
        offering.finalize();
    }

    function test_Claim() public {
        _contribute(alice, 30_000e6);
        _contribute(bob, 20_000e6);
        vm.warp(deadline);
        offering.finalize();

        vm.prank(alice);
        offering.claim();
        vm.prank(bob);
        offering.claim();

        assertEq(shard.balanceOf(alice), 300_000 ether);
        assertEq(shard.balanceOf(bob), 200_000 ether);
        assertEq(shard.balanceOf(address(offering)), 0);
        assertEq(offering.contributions(alice), 0);
    }

    function test_RevertWhen_ClaimTwice() public {
        _contribute(alice, 50_000e6);
        vm.warp(deadline);
        offering.finalize();

        vm.startPrank(alice);
        offering.claim();
        vm.expectRevert(Offering.NothingToClaim.selector);
        offering.claim();
        vm.stopPrank();
    }

    function test_RevertWhen_ClaimBeforeFinalize() public {
        _contribute(alice, 50_000e6);
        vm.prank(alice);
        vm.expectRevert(Offering.NotSucceeded.selector);
        offering.claim();
    }

    function test_RevertWhen_ClaimWithoutContribution() public {
        _contribute(alice, 50_000e6);
        vm.warp(deadline);
        offering.finalize();
        vm.prank(stranger);
        vm.expectRevert(Offering.NothingToClaim.selector);
        offering.claim();
    }

    function test_Refund() public {
        _contribute(alice, 10_000e6);
        _contribute(bob, 5_000e6);
        vm.warp(deadline);
        offering.finalize();

        vm.prank(alice);
        offering.refund();
        vm.prank(bob);
        offering.refund();

        assertEq(usdc.balanceOf(alice), 200_000e6);
        assertEq(usdc.balanceOf(bob), 200_000e6);
        assertEq(usdc.balanceOf(address(offering)), 0);
        assertEq(offering.contributions(alice), 0);
    }

    function test_RevertWhen_RefundTwice() public {
        _contribute(alice, 10_000e6);
        vm.warp(deadline);
        offering.finalize();

        vm.startPrank(alice);
        offering.refund();
        vm.expectRevert(Offering.NothingToRefund.selector);
        offering.refund();
        vm.stopPrank();
    }

    function test_RevertWhen_RefundWhileActive() public {
        _contribute(alice, 10_000e6);
        vm.prank(alice);
        vm.expectRevert(Offering.NotFailed.selector);
        offering.refund();
    }

    function test_RevertWhen_RefundAfterSuccess() public {
        _contribute(alice, 50_000e6);
        vm.warp(deadline);
        offering.finalize();

        vm.prank(alice);
        vm.expectRevert(Offering.NotFailed.selector);
        offering.refund();
    }

    function test_RevertWhen_ClaimAfterFailure() public {
        _contribute(alice, 10_000e6);
        vm.warp(deadline);
        offering.finalize();

        vm.prank(alice);
        vm.expectRevert(Offering.NotSucceeded.selector);
        offering.claim();
    }

    function test_RevertWhen_RefundWithoutContribution() public {
        _contribute(alice, 10_000e6);
        vm.warp(deadline);
        offering.finalize();

        vm.prank(stranger);
        vm.expectRevert(Offering.NothingToRefund.selector);
        offering.refund();
    }

    function _offeringWithPayment(TestToken shard_, FalseToken pay) internal returns (Offering o) {
        o = new Offering(
            address(shard_), address(pay), address(kyc), issuer, PRICE, SOFT_CAP, HARD_CAP, deadline
        );
        shard_.mint(address(o), SUPPLY);
    }

    function test_RevertWhen_ContributePullReturnsFalse() public {
        FalseToken pay = new FalseToken(6);
        Offering o = _offeringWithPayment(new TestToken("Shard", "SH", 18), pay);
        pay.mint(alice, 10_000e6);
        vm.prank(alice);
        pay.approve(address(o), type(uint256).max);

        pay.setFailTransferFrom(true);
        vm.prank(alice);
        vm.expectRevert(Offering.TransferFailed.selector);
        o.contribute(1_000e6);

        assertEq(o.totalRaised(), 0);
        assertEq(o.contributions(alice), 0);
        assertEq(pay.balanceOf(alice), 10_000e6);
    }

    function test_FinalizeRetriableWhenPaymentPushFails() public {
        FalseToken pay = new FalseToken(6);
        Offering o = _offeringWithPayment(new TestToken("Shard", "SH", 18), pay);
        pay.mint(alice, 50_000e6);
        vm.startPrank(alice);
        pay.approve(address(o), type(uint256).max);
        o.contribute(50_000e6);
        vm.stopPrank();
        vm.warp(deadline);

        pay.setFailTransfer(true);
        vm.expectRevert(Offering.TransferFailed.selector);
        o.finalize();
        assertEq(uint256(o.status()), uint256(Offering.Status.Active));

        pay.setFailTransfer(false);
        o.finalize();
        assertEq(uint256(o.status()), uint256(Offering.Status.Succeeded));
        assertEq(pay.balanceOf(issuer), 50_000e6);
    }

    function test_RefundRetriableWhenPaymentPushFails() public {
        FalseToken pay = new FalseToken(6);
        Offering o = _offeringWithPayment(new TestToken("Shard", "SH", 18), pay);
        pay.mint(alice, 10_000e6);
        vm.startPrank(alice);
        pay.approve(address(o), type(uint256).max);
        o.contribute(10_000e6);
        vm.stopPrank();
        vm.warp(deadline);
        o.finalize();
        assertEq(uint256(o.status()), uint256(Offering.Status.Failed));

        pay.setFailTransfer(true);
        vm.prank(alice);
        vm.expectRevert(Offering.TransferFailed.selector);
        o.refund();
        assertEq(o.contributions(alice), 10_000e6);

        pay.setFailTransfer(false);
        vm.prank(alice);
        o.refund();
        assertEq(pay.balanceOf(alice), 10_000e6);
        assertEq(o.contributions(alice), 0);
    }

    function test_NoReturnPaymentTokenWorks() public {
        NoReturnToken pay = new NoReturnToken(6);
        TestToken shard_ = new TestToken("Shard", "SH", 18);
        Offering o = new Offering(
            address(shard_), address(pay), address(kyc), issuer, PRICE, SOFT_CAP, HARD_CAP, deadline
        );
        shard_.mint(address(o), SUPPLY);
        pay.mint(alice, 60_000e6);

        vm.startPrank(alice);
        pay.approve(address(o), type(uint256).max);
        o.contribute(50_000e6);
        vm.stopPrank();
        vm.warp(deadline);
        o.finalize();

        assertEq(uint256(o.status()), uint256(Offering.Status.Succeeded));
        assertEq(pay.balanceOf(issuer), 50_000e6);

        vm.prank(alice);
        o.claim();
        assertEq(shard_.balanceOf(alice), 500_000 ether);
        assertEq(pay.balanceOf(address(o)), 0);
    }

    function testFuzz_AllocationsNeverExceedSupply(uint256 a, uint256 b) public {
        a = bound(a, 1, 60_000e6);
        b = bound(b, 1, HARD_CAP - a);
        _contribute(alice, a);
        _contribute(bob, b);
        vm.warp(deadline);
        if (a + b < SOFT_CAP) return;

        offering.finalize();
        vm.prank(alice);
        offering.claim();
        vm.prank(bob);
        offering.claim();

        assertLe(shard.balanceOf(alice) + shard.balanceOf(bob), SUPPLY);
        assertEq(shard.balanceOf(alice) + shard.balanceOf(bob) + shard.balanceOf(issuer) + shard.balanceOf(address(offering)), SUPPLY);
    }
}
