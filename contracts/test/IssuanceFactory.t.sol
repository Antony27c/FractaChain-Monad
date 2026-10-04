// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {IssuanceFactory} from "../src/IssuanceFactory.sol";
import {Offering} from "../src/Offering.sol";
import {ShardToken} from "../src/ShardToken.sol";
import {KycRegistry} from "../src/KycRegistry.sol";
import {TestToken} from "../src/mocks/TestToken.sol";

contract IssuanceFactoryTest is Test {
    uint256 constant SUPPLY = 1_000_000 ether;

    KycRegistry kyc;
    TestToken usdc;
    IssuanceFactory factory;

    address registryOwner = makeAddr("registryOwner");
    address issuer = makeAddr("issuer");
    address investor = makeAddr("investor");
    address stranger = makeAddr("stranger");

    function setUp() public {
        kyc = new KycRegistry(registryOwner);
        usdc = new TestToken("USD Coin", "USDC", 6);
        factory = new IssuanceFactory(address(kyc), address(usdc));

        vm.startPrank(registryOwner);
        kyc.setVerified(issuer, true);
        kyc.setVerified(investor, true);
        vm.stopPrank();
    }

    function _params() internal pure returns (IssuanceFactory.CreateParams memory p) {
        p = IssuanceFactory.CreateParams({
            name: "Shard Soja 2026",
            symbol: "SOJA26",
            asset: ShardToken.AssetInfo({assetType: "Soja", unit: "tn", quantity: 100, campaign: "2025/26"}),
            supply: SUPPLY,
            pricePerShard: 100_000,
            softCap: 40_000e6,
            hardCap: 100_000e6,
            duration: 7 days
        });
    }

    function _create() internal returns (ShardToken token, Offering offering) {
        vm.prank(issuer);
        (address t, address o) = factory.createIssuance(_params());
        token = ShardToken(t);
        offering = Offering(o);
    }

    function test_CreateIssuance() public {
        (ShardToken token, Offering offering) = _create();

        assertEq(token.symbol(), "SOJA26");
        assertEq(token.issuer(), issuer);
        assertEq(token.totalSupply(), SUPPLY);
        assertEq(token.balanceOf(address(offering)), SUPPLY);
        assertEq(token.balanceOf(address(factory)), 0);

        assertEq(address(offering.shard()), address(token));
        assertEq(address(offering.paymentToken()), address(usdc));
        assertEq(address(offering.kyc()), address(kyc));
        assertEq(offering.issuer(), issuer);
        assertEq(offering.deadline(), block.timestamp + 7 days);
        assertEq(offering.softCap(), 40_000e6);
        assertEq(offering.hardCap(), 100_000e6);
    }

    function test_RegistersIssuances() public {
        assertEq(factory.issuancesCount(), 0);
        (ShardToken token, Offering offering) = _create();

        assertEq(factory.issuancesCount(), 1);
        IssuanceFactory.Issuance memory i = factory.issuanceAt(0);
        assertEq(i.issuer, issuer);
        assertEq(i.token, address(token));
        assertEq(i.offering, address(offering));
        assertEq(factory.getIssuances().length, 1);
    }

    function test_EmitsEvent() public {
        vm.expectEmit(true, true, false, false);
        emit IssuanceFactory.IssuanceCreated(0, issuer, address(0), address(0), "SOJA26", SUPPLY);
        _create();
    }

    function test_RevertWhen_IssuerNotVerified() public {
        IssuanceFactory.CreateParams memory p = _params();
        vm.prank(stranger);
        vm.expectRevert(IssuanceFactory.IssuerNotVerified.selector);
        factory.createIssuance(p);
    }

    function test_RevertWhen_ZeroSupplyOrDuration() public {
        IssuanceFactory.CreateParams memory p = _params();
        p.supply = 0;
        vm.prank(issuer);
        vm.expectRevert(IssuanceFactory.InvalidSupply.selector);
        factory.createIssuance(p);

        p = _params();
        p.duration = 0;
        vm.prank(issuer);
        vm.expectRevert(IssuanceFactory.InvalidDuration.selector);
        factory.createIssuance(p);
    }

    function test_RevertWhen_OfferingParamsInvalid() public {
        IssuanceFactory.CreateParams memory p = _params();
        p.pricePerShard = 0;
        vm.prank(issuer);
        vm.expectRevert(Offering.InvalidParams.selector);
        factory.createIssuance(p);

        p = _params();
        p.softCap = p.hardCap + 1;
        vm.prank(issuer);
        vm.expectRevert(Offering.InvalidParams.selector);
        factory.createIssuance(p);

        assertEq(factory.issuancesCount(), 0);
    }

    function test_RevertWhen_SupplyBelowHardCap() public {
        IssuanceFactory.CreateParams memory p = _params();
        p.supply = SUPPLY - 1;
        vm.prank(issuer);
        vm.expectRevert(IssuanceFactory.SupplyBelowHardCap.selector);
        factory.createIssuance(p);

        assertEq(factory.issuancesCount(), 0);
    }

    function test_RevertWhen_ZeroAddressInConstructor() public {
        vm.expectRevert(IssuanceFactory.ZeroAddress.selector);
        new IssuanceFactory(address(0), address(usdc));
        vm.expectRevert(IssuanceFactory.ZeroAddress.selector);
        new IssuanceFactory(address(kyc), address(0));
    }

    function test_FullFlow_Success() public {
        (ShardToken token, Offering offering) = _create();

        usdc.mint(investor, 50_000e6);
        vm.startPrank(investor);
        usdc.approve(address(offering), type(uint256).max);
        offering.contribute(50_000e6);
        vm.stopPrank();

        vm.warp(offering.deadline());
        offering.finalize();

        vm.prank(investor);
        offering.claim();

        assertEq(token.balanceOf(investor), 500_000 ether);
        assertEq(token.balanceOf(issuer), 500_000 ether);
        assertEq(usdc.balanceOf(issuer), 50_000e6);
    }

    function test_FullFlow_Refund() public {
        (, Offering offering) = _create();

        usdc.mint(investor, 10_000e6);
        vm.startPrank(investor);
        usdc.approve(address(offering), type(uint256).max);
        offering.contribute(10_000e6);
        vm.stopPrank();

        vm.warp(offering.deadline());
        offering.finalize();

        vm.prank(investor);
        offering.refund();

        assertEq(usdc.balanceOf(investor), 10_000e6);
    }

    function test_TwoIssuancesAreIndependent() public {
        _create();
        _create();
        assertEq(factory.issuancesCount(), 2);
        assertTrue(factory.issuanceAt(0).token != factory.issuanceAt(1).token);
        assertTrue(factory.issuanceAt(0).offering != factory.issuanceAt(1).offering);
    }
}
