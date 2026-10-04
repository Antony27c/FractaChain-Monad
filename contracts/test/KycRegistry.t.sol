// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {KycRegistry} from "../src/KycRegistry.sol";

contract KycRegistryTest is Test {
    KycRegistry registry;
    address owner = makeAddr("owner");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    event VerificationSet(address indexed account, bool verified);

    function setUp() public {
        registry = new KycRegistry(owner);
    }

    function test_OwnerIsSet() public view {
        assertEq(registry.owner(), owner);
    }

    function test_RevertWhen_ZeroOwner() public {
        vm.expectRevert(KycRegistry.ZeroAddress.selector);
        new KycRegistry(address(0));
    }

    function test_OwnerCanVerifyAndRevoke() public {
        vm.startPrank(owner);
        vm.expectEmit(true, false, false, true);
        emit VerificationSet(alice, true);
        registry.setVerified(alice, true);
        assertTrue(registry.isVerified(alice));

        registry.setVerified(alice, false);
        assertFalse(registry.isVerified(alice));
        vm.stopPrank();
    }

    function test_RevertWhen_NonOwnerVerifies() public {
        vm.prank(alice);
        vm.expectRevert(KycRegistry.NotOwner.selector);
        registry.setVerified(alice, true);
    }

    function test_BatchVerify() public {
        address[] memory accounts = new address[](2);
        accounts[0] = alice;
        accounts[1] = bob;

        vm.prank(owner);
        registry.setVerifiedBatch(accounts, true);

        assertTrue(registry.isVerified(alice));
        assertTrue(registry.isVerified(bob));
    }

    function test_VerifyMyselfRevertsWhenClosed() public {
        vm.prank(alice);
        vm.expectRevert(KycRegistry.OpenVerificationDisabled.selector);
        registry.verifyMyself();
    }

    function test_VerifyMyselfWhenOpen() public {
        vm.prank(owner);
        registry.setOpenVerification(true);

        vm.prank(alice);
        registry.verifyMyself();

        assertTrue(registry.isVerified(alice));
        assertFalse(registry.isVerified(bob));
    }

    function test_TransferOwnership() public {
        vm.prank(owner);
        registry.transferOwnership(alice);
        assertEq(registry.owner(), alice);

        vm.prank(owner);
        vm.expectRevert(KycRegistry.NotOwner.selector);
        registry.setVerified(bob, true);
    }

    function testFuzz_UnverifiedByDefault(address account) public view {
        assertFalse(registry.isVerified(account));
    }
}
