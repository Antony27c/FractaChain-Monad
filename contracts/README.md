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

Copia `.env.example` a `.env` y completa `MONAD_TESTNET_RPC_URL` para desplegar.
