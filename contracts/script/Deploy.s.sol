// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {KycRegistry} from "../src/KycRegistry.sol";
import {IssuanceFactory} from "../src/IssuanceFactory.sol";
import {ShardToken} from "../src/ShardToken.sol";

contract Deploy is Script {
    address constant KURU_TESTNET_USDC = 0x3bA3d39AFcf8bb994f7964B3e0171Ea2Ba361570;

    struct Deployed {
        KycRegistry kyc;
        IssuanceFactory factory;
        address token;
        address offering;
    }

    function run() external returns (Deployed memory d) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address paymentToken = vm.envOr("PAYMENT_TOKEN", KURU_TESTNET_USDC);
        bool openVerification = vm.envOr("OPEN_VERIFICATION", true);
        bool createSample = vm.envOr("CREATE_SAMPLE", true);

        vm.startBroadcast(pk);
        d = _deploy(vm.addr(pk), paymentToken, openVerification, createSample);
        vm.stopBroadcast();

        console.log("KycRegistry     :", address(d.kyc));
        console.log("IssuanceFactory :", address(d.factory));
        console.log("PaymentToken    :", paymentToken);
        if (createSample) {
            console.log("Sample ShardToken:", d.token);
            console.log("Sample Offering  :", d.offering);
        }
    }

    function _deploy(address deployer, address paymentToken, bool openVerification, bool createSample)
        internal
        returns (Deployed memory d)
    {
        d.kyc = new KycRegistry(deployer);
        d.kyc.setVerified(deployer, true);
        if (openVerification) d.kyc.setOpenVerification(true);

        d.factory = new IssuanceFactory(address(d.kyc), paymentToken);

        if (createSample) {
            (d.token, d.offering) = d.factory.createIssuance(
                IssuanceFactory.CreateParams({
                    name: "Shard Soja 2026",
                    symbol: "SOJA26",
                    asset: ShardToken.AssetInfo({assetType: "Soja", unit: "tn", quantity: 100, campaign: "2025/26"}),
                    supply: 1_000_000 ether,
                    pricePerShard: 100_000,
                    softCap: 40_000e6,
                    hardCap: 100_000e6,
                    duration: 7 days
                })
            );
        }
    }
}
