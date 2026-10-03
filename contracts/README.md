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
