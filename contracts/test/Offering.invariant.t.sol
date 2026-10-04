// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {KycRegistry} from "../src/KycRegistry.sol";
import {Offering} from "../src/Offering.sol";
import {TestToken} from "../src/mocks/TestToken.sol";

contract OfferingHandler is Test {
    uint256 public constant SUPPLY = 1_000_000 ether;
    uint256 public constant PRICE = 100_000;
    uint256 public constant SOFT = 40_000e6;
    uint256 public constant HARD = 100_000e6;
    uint256 public constant DURATION = 7 days;

    KycRegistry public kyc;
    TestToken public pay;
    TestToken public shard;
    Offering public offering;
    address public issuer;
    address public unverified;
    address[] public actors;

    uint256 public ghostMinted;
    uint256 public ghostClaimedPaid;
    uint256 public ghostClaimedShards;
    uint256 public ghostRefunded;
    bool public sawFinal;

    constructor() {
        issuer = address(this);
        kyc = new KycRegistry(issuer);
        pay = new TestToken("USD Coin", "USDC", 6);
        shard = new TestToken("Shard Soja", "SOJA", 18);
        offering = new Offering(
            address(shard), address(pay), address(kyc), issuer, PRICE, SOFT, HARD, block.timestamp + DURATION
        );
        shard.mint(address(offering), SUPPLY);

        for (uint256 i; i < 6; ++i) {
            address actor = address(uint160(0xA000 + i));
            actors.push(actor);
            kyc.setVerified(actor, true);
        }
        unverified = address(0xBAD);
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[bound(seed, 0, actors.length - 1)];
    }

    function contribute(uint256 actorSeed, uint256 amountSeed) external {
        if (offering.status() != Offering.Status.Active) return;
        address actor = _actor(actorSeed);
        uint256 amount = bound(amountSeed, 1, HARD + 50_000e6);
        pay.mint(actor, amount);
        ghostMinted += amount;
        vm.startPrank(actor);
        pay.approve(address(offering), amount);
        try offering.contribute(amount) {} catch {}
        vm.stopPrank();
    }

    function contributeUnverified(uint256 amountSeed) external {
        if (offering.status() != Offering.Status.Active) return;
        uint256 amount = bound(amountSeed, 1, 10_000e6);
        pay.mint(unverified, amount);
        ghostMinted += amount;
        vm.startPrank(unverified);
        pay.approve(address(offering), amount);
        try offering.contribute(amount) {} catch {}
        vm.stopPrank();
    }

    function warp(uint256 secsSeed) external {
        vm.warp(block.timestamp + bound(secsSeed, 0, DURATION * 2));
    }

    function finalize() external {
        try offering.finalize() {} catch {}
        if (offering.status() != Offering.Status.Active) sawFinal = true;
    }

    function claim(uint256 actorSeed) external {
        address actor = _actor(actorSeed);
        uint256 paid = offering.contributions(actor);
        vm.prank(actor);
        try offering.claim() {
            ghostClaimedPaid += paid;
            ghostClaimedShards += offering.shardsFor(paid);
        } catch {}
    }

    function refund(uint256 actorSeed) external {
        address actor = _actor(actorSeed);
        uint256 paid = offering.contributions(actor);
        vm.prank(actor);
        try offering.refund() {
            ghostRefunded += paid;
        } catch {}
    }

    function actorsCount() external view returns (uint256) {
        return actors.length;
    }

    function actorAt(uint256 i) external view returns (address) {
        return actors[i];
    }
}

contract OfferingInvariantTest is Test {
    OfferingHandler internal h;

    function setUp() public {
        h = new OfferingHandler();
        targetContract(address(h));
    }

    function _sumContrib() internal view returns (uint256 sum) {
        uint256 n = h.actorsCount();
        for (uint256 i; i < n; ++i) sum += h.offering().contributions(h.actorAt(i));
    }

    function invariant_NeverExceedsHardCap() public view {
        assertLe(h.offering().totalRaised(), h.HARD());
    }

    function invariant_OnlyVerifiedContributed() public view {
        assertEq(h.offering().contributions(h.unverified()), 0);
    }

    function invariant_ActiveSumsClose() public view {
        Offering o = h.offering();
        if (o.status() == Offering.Status.Active) {
            assertEq(_sumContrib(), o.totalRaised());
            assertEq(h.pay().balanceOf(address(o)), o.totalRaised());
        }
    }

    function invariant_SuccessNeedsSoftCap() public view {
        Offering o = h.offering();
        if (o.status() == Offering.Status.Succeeded) {
            assertGe(o.totalRaised(), h.SOFT());
            assertEq(h.pay().balanceOf(address(o)), 0);
            assertEq(h.pay().balanceOf(h.issuer()), o.totalRaised());
            assertEq(_sumContrib() + h.ghostClaimedPaid(), o.totalRaised());
            assertEq(
                h.shard().balanceOf(address(o)),
                o.shardsFor(o.totalRaised()) - h.ghostClaimedShards()
            );
        }
    }

    function invariant_FailureBelowSoftCap() public view {
        Offering o = h.offering();
        if (o.status() == Offering.Status.Failed) {
            assertLt(o.totalRaised(), h.SOFT());
            assertEq(h.shard().balanceOf(address(o)), 0);
            assertEq(_sumContrib(), o.totalRaised() - h.ghostRefunded());
            assertEq(h.pay().balanceOf(address(o)), _sumContrib());
        }
    }

    function invariant_StatusIsMonotonic() public view {
        if (h.sawFinal()) assertTrue(h.offering().status() != Offering.Status.Active);
    }
}
