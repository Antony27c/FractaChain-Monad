// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {HarvestRedemption} from "../src/HarvestRedemption.sol";

/// Despliega HarvestRedemption para el token de pago de la demo (por defecto el mUSDC).
contract DeployRedemption is Script {
    address constant DEMO_MUSDC = 0xBf11e27C5C26E11E4B213fBCc5d5EDBb29453d36;

    function run() external returns (HarvestRedemption redemption) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address paymentToken = vm.envOr("PAYMENT_TOKEN", DEMO_MUSDC);

        vm.startBroadcast(pk);
        redemption = new HarvestRedemption(paymentToken);
        vm.stopBroadcast();

        console.log("HarvestRedemption:", address(redemption));
        console.log("PaymentToken     :", paymentToken);
    }
}
