// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {HarvestRedemption} from "../src/HarvestRedemption.sol";
import {ShardToken} from "../src/ShardToken.sol";
import {TestToken} from "../src/mocks/TestToken.sol";

/// Token malicioso: dice ser emitido por `issuer` y "acepta" transferFrom sin mover nada.
contract LyingShard {
    address public immutable issuer;
    uint256 public constant totalSupply = 1_000 ether;

    constructor(address issuer_) {
        issuer = issuer_;
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        return true;
    }
}

contract HarvestRedemptionTest is Test {
    uint256 constant SUPPLY = 1_000_000 ether;
    uint256 constant PROCEEDS = 120_000e6;
    bytes32 constant EVIDENCE_HASH = keccak256("liquidacion-acopio-2026");
    string constant EVIDENCE_URI = "ipfs://liquidacion-acopio-2026";

    TestToken usdc;
    ShardToken shard;
    HarvestRedemption redemption;

    address issuer = makeAddr("issuer");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address stranger = makeAddr("stranger");

    function setUp() public {
        usdc = new TestToken("USD Coin", "USDC", 6);
        shard = new ShardToken(
            "Shard Soja 2026",
            "SOJA26",
            ShardToken.AssetInfo({assetType: "Soja", unit: "tn", quantity: 100, campaign: "2025/26"}),
            issuer,
            issuer,
            SUPPLY
        );
        redemption = new HarvestRedemption(address(usdc));

        vm.startPrank(issuer);
        shard.transfer(alice, 600_000 ether);
        shard.transfer(bob, 300_000 ether);
        vm.stopPrank();

        usdc.mint(issuer, PROCEEDS);
    }

    function _settle(uint256 amount) internal {
        vm.startPrank(issuer);
        usdc.approve(address(redemption), amount);
        redemption.settle(address(shard), amount, EVIDENCE_URI, EVIDENCE_HASH);
        vm.stopPrank();
    }

    function _redeem(address holder, uint256 shards) internal returns (uint256 payout) {
        vm.startPrank(holder);
        shard.approve(address(redemption), shards);
        payout = redemption.redeem(address(shard), shards);
        vm.stopPrank();
    }

    function test_RevertWhen_ZeroPaymentToken() public {
        vm.expectRevert(HarvestRedemption.ZeroAddress.selector);
        new HarvestRedemption(address(0));
    }

    function test_SettleStoresSettlementAndPullsProceeds() public {
        vm.startPrank(issuer);
        usdc.approve(address(redemption), PROCEEDS);
        vm.expectEmit(true, true, false, true);
        emit HarvestRedemption.Settled(address(shard), issuer, PROCEEDS, SUPPLY, EVIDENCE_HASH, EVIDENCE_URI);
        redemption.settle(address(shard), PROCEEDS, EVIDENCE_URI, EVIDENCE_HASH);
        vm.stopPrank();

        HarvestRedemption.Settlement memory s = redemption.settlementOf(address(shard));
        assertEq(s.amount, PROCEEDS);
        assertEq(s.totalSupply, SUPPLY);
        assertEq(s.evidenceHash, EVIDENCE_HASH);
        assertEq(s.evidenceURI, EVIDENCE_URI);
        assertEq(s.settledAt, block.timestamp);
        assertTrue(redemption.isSettled(address(shard)));
        assertEq(usdc.balanceOf(address(redemption)), PROCEEDS);
        assertEq(usdc.balanceOf(issuer), 0);
    }

    function test_RevertWhen_NonIssuerSettles() public {
        usdc.mint(stranger, PROCEEDS);
        vm.startPrank(stranger);
        usdc.approve(address(redemption), PROCEEDS);
        vm.expectRevert(HarvestRedemption.NotIssuer.selector);
        redemption.settle(address(shard), PROCEEDS, EVIDENCE_URI, EVIDENCE_HASH);
        vm.stopPrank();
    }

    function test_RevertWhen_SettleTwice() public {
        _settle(PROCEEDS / 2);
        vm.startPrank(issuer);
        usdc.approve(address(redemption), PROCEEDS / 2);
        vm.expectRevert(HarvestRedemption.AlreadySettled.selector);
        redemption.settle(address(shard), PROCEEDS / 2, EVIDENCE_URI, EVIDENCE_HASH);
        vm.stopPrank();
    }

    function test_RevertWhen_SettleZero() public {
        vm.prank(issuer);
        vm.expectRevert(HarvestRedemption.ZeroAmount.selector);
        redemption.settle(address(shard), 0, EVIDENCE_URI, EVIDENCE_HASH);
    }

    function test_RevertWhen_SettleWithoutAllowance() public {
        vm.prank(issuer);
        vm.expectRevert(HarvestRedemption.TransferFailed.selector);
        redemption.settle(address(shard), PROCEEDS, EVIDENCE_URI, EVIDENCE_HASH);
    }

    function test_RedeemPaysProRata() public {
        _settle(PROCEEDS);

        // 600k de 1M shards -> 60% de 120.000 USDC.
        vm.startPrank(alice);
        shard.approve(address(redemption), 600_000 ether);
        vm.expectEmit(true, true, false, true);
        emit HarvestRedemption.Redeemed(address(shard), alice, 600_000 ether, 72_000e6);
        uint256 payout = redemption.redeem(address(shard), 600_000 ether);
        vm.stopPrank();

        assertEq(payout, 72_000e6);
        assertEq(usdc.balanceOf(alice), 72_000e6);
        assertEq(shard.balanceOf(alice), 0);
        assertEq(shard.balanceOf(address(redemption)), 600_000 ether);

        HarvestRedemption.Settlement memory s = redemption.settlementOf(address(shard));
        assertEq(s.redeemedShards, 600_000 ether);
        assertEq(s.paidOut, 72_000e6);
    }

    function test_EveryHolderRedeemsAndFundsAreExhausted() public {
        _settle(PROCEEDS);
        _redeem(alice, 600_000 ether);
        _redeem(bob, 300_000 ether);
        _redeem(issuer, 100_000 ether);

        assertEq(usdc.balanceOf(alice), 72_000e6);
        assertEq(usdc.balanceOf(bob), 36_000e6);
        assertEq(usdc.balanceOf(issuer), 12_000e6);
        assertEq(usdc.balanceOf(address(redemption)), 0);
    }

    function test_PartialRedemptions() public {
        _settle(PROCEEDS);
        _redeem(alice, 100_000 ether);
        _redeem(alice, 500_000 ether);
        assertEq(usdc.balanceOf(alice), 72_000e6);
    }

    function test_QuoteMatchesPayout() public {
        assertEq(redemption.quote(address(shard), 1 ether), 0);
        _settle(PROCEEDS);
        assertEq(redemption.quote(address(shard), 250_000 ether), 30_000e6);
        assertEq(_redeem(bob, 250_000 ether), 30_000e6);
    }

    function test_RevertWhen_RedeemBeforeSettlement() public {
        vm.startPrank(alice);
        shard.approve(address(redemption), 1 ether);
        vm.expectRevert(HarvestRedemption.NotSettled.selector);
        redemption.redeem(address(shard), 1 ether);
        vm.stopPrank();
    }

    function test_RevertWhen_RedeemZero() public {
        _settle(PROCEEDS);
        vm.prank(alice);
        vm.expectRevert(HarvestRedemption.ZeroAmount.selector);
        redemption.redeem(address(shard), 0);
    }

    function test_RevertWhen_RedeemMoreThanBalance() public {
        _settle(PROCEEDS);
        vm.startPrank(bob);
        shard.approve(address(redemption), 400_000 ether);
        vm.expectRevert(HarvestRedemption.TransferFailed.selector);
        redemption.redeem(address(shard), 400_000 ether);
        vm.stopPrank();
    }

    function test_RevertWhen_DustRoundsToZero() public {
        _settle(PROCEEDS);
        vm.startPrank(alice);
        shard.approve(address(redemption), 1);
        vm.expectRevert(HarvestRedemption.ZeroAmount.selector);
        redemption.redeem(address(shard), 1);
        vm.stopPrank();
    }

    function test_LyingTokenCannotDrainOtherSettlements() public {
        _settle(PROCEEDS);

        address attacker = makeAddr("attacker");
        LyingShard fake = new LyingShard(attacker);
        usdc.mint(attacker, 1_000e6);

        vm.startPrank(attacker);
        usdc.approve(address(redemption), 1_000e6);
        redemption.settle(address(fake), 1_000e6, "", bytes32(0));
        // Cobra todo lo que depositó, pero no un USDC más: lo demás es de SOJA26.
        redemption.redeem(address(fake), 1_000 ether);
        vm.expectRevert(HarvestRedemption.ExceedsSettlement.selector);
        redemption.redeem(address(fake), 1 ether);
        vm.stopPrank();

        assertEq(usdc.balanceOf(attacker), 1_000e6);
        assertEq(usdc.balanceOf(address(redemption)), PROCEEDS);
    }

    function testFuzz_PayoutsNeverExceedProceeds(uint256 proceeds, uint256 aliceShards, uint256 bobShards) public {
        proceeds = bound(proceeds, 1, 1e15);
        aliceShards = bound(aliceShards, 1, 600_000 ether);
        bobShards = bound(bobShards, 1, 300_000 ether);
        usdc.mint(issuer, proceeds);
        _settle(proceeds);

        uint256 paid;
        if (redemption.quote(address(shard), aliceShards) > 0) paid += _redeem(alice, aliceShards);
        if (redemption.quote(address(shard), bobShards) > 0) paid += _redeem(bob, bobShards);
        if (redemption.quote(address(shard), 100_000 ether) > 0) paid += _redeem(issuer, 100_000 ether);

        assertLe(paid, proceeds);
        assertEq(usdc.balanceOf(address(redemption)), proceeds - paid);
    }
}
