# Contratos de ShardChain

Solidity + Foundry, para Monad testnet (chain ID 10143).

## Requisitos
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

## Uso
```bash
git submodule update --init --recursive
forge build
forge test
```

Para correr también el test contra Kuru en Monad testnet (fork):
```bash
forge test --fork-url https://testnet-rpc.monad.xyz
```

## Deploy local (anvil)

`DeployLocal.s.sol` despliega un `TestToken` USDC mock (6 decimales, mint libre) con 1.000.000 USDC para el deployer y para las tres cuentas de anvil que ofrece el selector de dev del frontend, más `KycRegistry`, `IssuanceFactory` y el lote de soja de ejemplo. Deja verificados al emisor y al inversor A. Usa la clave de anvil por defecto; `PRIVATE_KEY` la puede sobreescribir.

```bash
anvil --port 8545
forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

También funciona sobre un fork (`anvil --fork-url https://testnet-rpc.monad.xyz --fork-chain-id 10143 --fork-block-number <bloque>`), que es lo que permite probar `scripts/kuru/open-market.ts` contra el código real del Router de Kuru.

El script escribe solo `frontend/.env.development.local` (ignorado por git) con `NEXT_PUBLIC_NETWORK`, `NEXT_PUBLIC_DEV_MODE`, `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_KYC`, `NEXT_PUBLIC_FACTORY` y `NEXT_PUBLIC_USDC`, así que no hay que copiar direcciones a mano. Para no escribirlo, `WRITE_FRONTEND_ENV=false`.

## Deploy en Monad testnet
Despliega `KycRegistry`, `IssuanceFactory` y un lote de soja de ejemplo (1.000.000 shards a 0,10 USDC, soft cap 40.000 USDC, hard cap 100.000 USDC, 7 días).

1. Usa una wallet **de prueba** con MON de https://faucet.monad.xyz (el deploy cuesta unos 0,75 MON).
2. Completa `PRIVATE_KEY` en `contracts/.env` (nunca se sube a git).
3. Simulación, sin gastar nada:
```bash
forge script script/Deploy.s.sol --fork-url https://testnet-rpc.monad.xyz
```
4. Deploy real:
```bash
forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast
```

Variables opcionales: `PAYMENT_TOKEN` (por defecto el USDC de Kuru), `OPEN_VERIFICATION` (por defecto `true`, permite que cualquiera se verifique con `verifyMyself()`) y `CREATE_SAMPLE` (por defecto `true`).

Copia `.env.example` a `.env` y completa `MONAD_TESTNET_RPC_URL` para desplegar.
