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

Copia `.env.example` a `.env` y completa `MONAD_TESTNET_RPC_URL` para desplegar.
