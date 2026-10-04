// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {ShardToken} from "../src/ShardToken.sol";

contract ShardTokenTest is Test {
    ShardToken token;
    address issuer = makeAddr("issuer");
    address holder = makeAddr("holder");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    uint256 constant SUPPLY = 1_000_000 ether;

    event Transfer(address indexed from, address indexed to, uint256 value);

    function setUp() public {
        token = new ShardToken(
            "Shard Soja 2026",
            "SOJA26",
            ShardToken.AssetInfo({assetType: "Soja", unit: "tn", quantity: 100, campaign: "2025/26"}),
            issuer,
            holder,
            SUPPLY
        );
    }

    function test_Metadata() public view {
        assertEq(token.name(), "Shard Soja 2026");
        assertEq(token.symbol(), "SOJA26");
        assertEq(token.decimals(), 18);
        assertEq(token.issuer(), issuer);

        ShardToken.AssetInfo memory info = token.asset();
        assertEq(info.assetType, "Soja");
        assertEq(info.unit, "tn");
        assertEq(info.quantity, 100);
        assertEq(info.campaign, "2025/26");
    }

    function test_SupplyGoesToInitialHolder() public view {
        assertEq(token.totalSupply(), SUPPLY);
        assertEq(token.balanceOf(holder), SUPPLY);
        assertEq(token.balanceOf(issuer), 0);
    }

    function test_RevertWhen_ZeroHolderOrIssuer() public {
        ShardToken.AssetInfo memory info;
        vm.expectRevert(ShardToken.ZeroAddress.selector);
        new ShardToken("A", "A", info, issuer, address(0), 1);
        vm.expectRevert(ShardToken.ZeroAddress.selector);
        new ShardToken("A", "A", info, address(0), holder, 1);
    }

    function test_Transfer() public {
        vm.expectEmit(true, true, false, true);
        emit Transfer(holder, alice, 10 ether);
        vm.prank(holder);
        token.transfer(alice, 10 ether);

        assertEq(token.balanceOf(alice), 10 ether);
        assertEq(token.balanceOf(holder), SUPPLY - 10 ether);
    }

    function test_RevertWhen_TransferExceedsBalance() public {
        vm.prank(alice);
        vm.expectRevert(ShardToken.InsufficientBalance.selector);
        token.transfer(bob, 1);
    }

    function test_RevertWhen_TransferToZero() public {
        vm.prank(holder);
        vm.expectRevert(ShardToken.ZeroAddress.selector);
        token.transfer(address(0), 1);
    }

    function test_ApproveAndTransferFrom() public {
        vm.prank(holder);
        token.approve(alice, 5 ether);

        vm.prank(alice);
        token.transferFrom(holder, bob, 3 ether);

        assertEq(token.balanceOf(bob), 3 ether);
        assertEq(token.allowance(holder, alice), 2 ether);
    }

    function test_RevertWhen_TransferFromExceedsAllowance() public {
        vm.prank(holder);
        token.approve(alice, 1 ether);

        vm.prank(alice);
        vm.expectRevert(ShardToken.InsufficientAllowance.selector);
        token.transferFrom(holder, bob, 2 ether);
    }

    function test_InfiniteAllowanceIsNotDecreased() public {
        vm.prank(holder);
        token.approve(alice, type(uint256).max);

        vm.prank(alice);
        token.transferFrom(holder, bob, 1 ether);

        assertEq(token.allowance(holder, alice), type(uint256).max);
    }

    function testFuzz_TransferKeepsSupply(uint256 amount) public {
        amount = bound(amount, 0, SUPPLY);
        vm.prank(holder);
        token.transfer(alice, amount);

        assertEq(token.balanceOf(holder) + token.balanceOf(alice), SUPPLY);
        assertEq(token.totalSupply(), SUPPLY);
    }
}
