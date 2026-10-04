// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {console} from "forge-std/Script.sol";
import {TestToken} from "../src/mocks/TestToken.sol";
import {Deploy} from "./Deploy.s.sol";

/// Local development only. Deploys the whole stack to anvil with a mock USDC and
/// writes the addresses to frontend/.env.development.local.
contract DeployLocal is Deploy {
    uint256 constant ANVIL_PK = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 constant LOCAL_USDC_MINT = 1_000_000e6;

    /// Anvil accounts the frontend dev picker offers (see frontend/src/lib/dev.ts).
    address constant INVESTOR_A = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address constant INVESTOR_B = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    address constant INVESTOR_C = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;

    string constant ENV_PATH = "../frontend/.env.development.local";

    function run() external override returns (Deployed memory d) {
        uint256 pk = vm.envOr("PRIVATE_KEY", ANVIL_PK);
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);
        TestToken usdc = new TestToken("USD Coin", "USDC", 6);
        address[4] memory funded = [deployer, INVESTOR_A, INVESTOR_B, INVESTOR_C];
        for (uint256 i; i < funded.length; ++i) {
            usdc.mint(funded[i], LOCAL_USDC_MINT);
        }

        d = _deploy(deployer, address(usdc), true, true);
        // Investor A ships verified so the dev picker has a verified and an
        // unverified investor without anyone calling verifyMyself() first.
        d.kyc.setVerified(INVESTOR_A, true);
        vm.stopBroadcast();

        console.log("Mock USDC        :", address(usdc));
        console.log("KycRegistry      :", address(d.kyc));
        console.log("IssuanceFactory  :", address(d.factory));
        console.log("Sample ShardToken:", d.token);
        console.log("Sample Offering  :", d.offering);

        if (vm.envOr("WRITE_FRONTEND_ENV", true)) {
            vm.writeFile(
                ENV_PATH,
                string.concat(
                    "NEXT_PUBLIC_NETWORK=local\n",
                    "NEXT_PUBLIC_DEV_MODE=true\n",
                    "NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545\n",
                    "NEXT_PUBLIC_KYC=",
                    vm.toString(address(d.kyc)),
                    "\n",
                    "NEXT_PUBLIC_FACTORY=",
                    vm.toString(address(d.factory)),
                    "\n",
                    "NEXT_PUBLIC_USDC=",
                    vm.toString(address(usdc)),
                    "\n"
                )
            );
            console.log("Wrote frontend/.env.development.local");
        }
    }
}
