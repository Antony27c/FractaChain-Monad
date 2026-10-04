# Script para abrir el mercado en Kuru

`open-market.ts` se ejecuta cuando termina la licitación. Con el SDK de Kuru (`@kuru-labs/kuru-sdk`):
1. Calcula las precisiones del mercado según el precio.
2. Crea el mercado shard/USDC con el Router de Kuru.
3. Siembra el vault con shards y USDC al precio indicado.

> El primer depósito fija el precio del vault y no se corrige después. Revisa los valores con `DRY_RUN=true` antes de enviar.

## Uso
```bash
cd scripts/kuru
npm install
```

Simulación, no envía nada (muestra precisiones, montos y saldos):
```bash
PRIVATE_KEY=0x... BASE_TOKEN=<direccion del ShardToken> SEED_BASE=500000 DRY_RUN=true npm run open-market
```

Ejecución real en Monad testnet (la wallet debe tener los shards, el USDC y MON para el gas):
```bash
PRIVATE_KEY=0x... BASE_TOKEN=<direccion del ShardToken> SEED_BASE=500000 npm run open-market
```

## Variables
| Variable | Por defecto | Qué es |
|---|---|---|
| `PRIVATE_KEY` | (obligatoria) | Wallet que abre el mercado. Usa una de prueba. |
| `BASE_TOKEN` | (obligatoria) | Dirección del `ShardToken`. |
| `SEED_BASE` | (obligatoria) | Cantidad de shards a poner en el vault. El USDC sale de multiplicar por `PRICE`. |
| `PRICE` | `0.1` | USDC por shard. |
| `QUOTE_TOKEN` | USDC de Kuru en testnet | Moneda de cotización. |
| `RPC_URL` | `https://testnet-rpc.monad.xyz` | RPC. |
| `KURU_ROUTER` | Router de Kuru en testnet | Dirección del Router. |
| `MAX_PRICE` / `MIN_SIZE` / `TICK_BPS` | `10` / `1` / `100` | Parámetros de `calculatePrecisions`. |
| `TAKER_FEE_BPS` / `MAKER_FEE_BPS` / `AMM_SPREAD` | `30` / `10` / `100` | Comisiones y spread del vault. |

## Cómo se probó
Sobre un fork local de Monad testnet (`anvil --fork-url ...`) con tokens de prueba: el mercado se creó, el vault quedó con 500.000 shards y 50.000 USDC, y el libro mostró bid ≈ 0,099 y ask 0,100. No se probó todavía en la testnet real, ni con el USDC de Kuru.
