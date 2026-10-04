// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {KycRegistry} from "../src/KycRegistry.sol";
import {IssuanceFactory} from "../src/IssuanceFactory.sol";
import {ShardToken} from "../src/ShardToken.sol";
import {TestToken} from "../src/mocks/TestToken.sol";

/// Local development only. Deploys everything to an anvil chain with a mock USDC
/// and writes the addresses to frontend/.env.development.local.
contract DeployLocal is Script {
    address constant ACCOUNT_1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
    address constant ACCOUNT_2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    address constant ACCOUNT_3 = 0x90F79bf6EB2c4f870365E785982E1f101E93b906;
    address constant ACCOUNT_4 = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65;

    function run() external {
        uint256 pk = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        TestToken usdc = new TestToken("USD Coin (local)", "USDC", 6);
        address[5] memory accounts = [deployer, ACCOUNT_1, ACCOUNT_2, ACCOUNT_3, ACCOUNT_4];
        for (uint256 i; i < accounts.length; ++i) {
            usdc.mint(accounts[i], 1_000_000e6);
        }

        KycRegistry kyc = new KycRegistry(deployer);
        kyc.setVerified(deployer, true);
        kyc.setVerified(ACCOUNT_1, true);
        kyc.setOpenVerification(true);

        IssuanceFactory factory = new IssuanceFactory(address(kyc), address(usdc));
        (address token, address offering) = factory.createIssuance(
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

        vm.stopBroadcast();

        string memory env = string.concat(
            "NEXT_PUBLIC_NETWORK=local\n",
            "NEXT_PUBLIC_DEV_MODE=true\n",
            "NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545\n",
            "NEXT_PUBLIC_KYC=",
            vm.toString(address(kyc)),
            "\n",
            "NEXT_PUBLIC_FACTORY=",
            vm.toString(address(factory)),
            "\n",
            "NEXT_PUBLIC_USDC=",
            vm.toString(address(usdc)),
            "\n"
        );
        vm.writeFile("../frontend/.env.development.local", env);

        console.log("USDC (mock)     :", address(usdc));
        console.log("KycRegistry     :", address(kyc));
        console.log("IssuanceFactory :", address(factory));
        console.log("Sample token    :", token);
        console.log("Sample offering :", offering);
        console.log("Wrote frontend/.env.development.local");
    }
}
