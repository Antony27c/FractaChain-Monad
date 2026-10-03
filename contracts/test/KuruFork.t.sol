// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {TestToken} from "../src/mocks/TestToken.sol";

interface IKuruRouter {
    function deployProxy(
        uint8 _type,
        address _baseAssetAddress,
        address _quoteAssetAddress,
        uint96 _sizePrecision,
        uint32 _pricePrecision,
        uint32 _tickSize,
        uint96 _minSize,
        uint96 _maxSize,
        uint256 _takerFeeBps,
        uint256 _makerFeeBps,
        uint96 _kuruAmmSpread
    ) external returns (address proxy);

    function verifiedMarket(address market) external view returns (
        uint32 pricePrecision,
        uint96 sizePrecision,
        address baseAssetAddress,
        uint256 baseAssetDecimals,
        address quoteAssetAddress,
        uint256 quoteAssetDecimals,
        uint32 tickSize,
        uint96 minSize,
        uint96 maxSize,
        uint256 takerFeeBps,
        uint256 makerFeeBps
    );
}

contract KuruForkTest is Test {
    IKuruRouter constant ROUTER = IKuruRouter(0x7EFbE105Ca7415dE98F96622173458ac1c054630);
    address constant KURU_USDC = 0x3bA3d39AFcf8bb994f7964B3e0171Ea2Ba361570;

    function test_AnyoneCanDeployMarket() public {
        if (address(ROUTER).code.length == 0) vm.skip(true);
        address stranger = makeAddr("stranger");
        vm.deal(stranger, 10 ether);
        TestToken shard = new TestToken("Shard Soja", "SOJA", 18);

        vm.prank(stranger);
        address market = ROUTER.deployProxy(
            0, address(shard), KURU_USDC, 10_000_000_000, 1_000_000_000, 100, 100_000_000, 10_000_000_000_000_000, 30, 10, 100
        );

        assertTrue(market != address(0));
        assertGt(market.code.length, 0);
        emit log_named_address("market", market);
    }
}
