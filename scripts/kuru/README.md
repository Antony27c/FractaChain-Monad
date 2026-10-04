# Script para abrir el mercado en Kuru

`open-market.ts` se ejecuta cuando termina la licitación. Con el SDK de Kuru (`@kuru-labs/kuru-sdk`):
1. Calcula las precisiones del mercado según el precio.
2. Crea el mercado shard/USDC con el Router de Kuru.
3. Siembra el vault con shards y USDC al precio indicado.

> El primer depósito fija el precio del vault y no se corrige después. Revisa los valores con `--dry-run` antes de enviar.

## Uso
```bash
cd scripts/kuru
npm install
```

### Modo offering (recomendado)

Lee el token, la moneda de pago y el precio directamente del contrato `Offering`, y exige que la licitación haya terminado con éxito (`status = Succeeded`). Es el modo que usa el botón "Abrir mercado" del frontend:

```bash
PRIVATE_KEY=0x... npm run open-market -- --offering <direccion del Offering> --seed 500000
```

### Modo manual

```bash
PRIVATE_KEY=0x... BASE_TOKEN=<direccion del ShardToken> SEED_BASE=500000 npm run open-market
```

### Simulación

`--dry-run` muestra precisiones, montos y saldos, y no envía nada (devuelve el JSON igual):

```bash
PRIVATE_KEY=0x... npm run open-market -- --offering <addr> --seed 500000 --dry-run
```

### Salida JSON

El último bloque de stdout es siempre un JSON con el resultado (`market`, `vault`, `seedTx`, `base`, `quote`, `price`, `seedBase`, `seedQuote`, `dryRun`). Con `--json` los logs se van a stderr y stdout queda solo con el JSON, listo para que lo parsee otro proceso:

```bash
PRIVATE_KEY=0x... npm run open-market -- --offering <addr> --seed 500000 --json | jq .market
```

## Argumentos y variables

| Flag | Variable equivalente | Qué es |
|---|---|---|
| `--offering <addr>` | `OFFERING` | Dirección del `Offering`. Resuelve `BASE_TOKEN`, `QUOTE_TOKEN` y `PRICE` onchain. |
| `--seed <n>` | `SEED_BASE` | (obligatoria) Cantidad de shards a poner en el vault. El USDC sale de multiplicar por el precio. |
| `--dry-run` | `DRY_RUN=true` | Simula sin enviar transacciones. |
| `--json` | — | Logs a stderr; stdout solo el JSON final. |
| — | `PRIVATE_KEY` | (obligatoria) Wallet que abre el mercado. Usa una de prueba. |
| — | `BASE_TOKEN` | Dirección del `ShardToken` (solo modo manual). |
| — | `PRICE` | `0.1`. Precio en USDC por shard (solo modo manual). |
| — | `QUOTE_TOKEN` | USDC de Kuru en testnet. Moneda de cotización (solo modo manual). |
| — | `RPC_URL` | `https://testnet-rpc.monad.xyz`. |
| — | `KURU_ROUTER` | Router de Kuru en testnet. |
| — | `MAX_PRICE` / `MIN_SIZE` / `TICK_BPS` | `10` / `1` / `100`. Parámetros de `calculatePrecisions`. |
| — | `TAKER_FEE_BPS` / `MAKER_FEE_BPS` / `AMM_SPREAD` | `30` / `10` / `100`. Comisiones y spread del vault. |

## Cómo se probó
Sobre un fork local de Monad testnet (`anvil --fork-url https://testnet-rpc.monad.xyz --fork-chain-id 10143 --fork-block-number <bloque>`) con tokens de prueba: el mercado se creó, el vault quedó con 500.000 shards y 50.000 USDC, y el libro mostró bid ≈ 0,099 y ask 0,100. El modo `--offering` se probó con el flujo completo: contribute → finalize → claim → open-market. No se probó todavía en la testnet real, ni con el USDC de Kuru.

El `--dry-run` también corre sobre un anvil local sin fork (deploy con `DeployLocal.s.sol`): resuelve token, moneda y precio del `Offering` y verifica saldos, pero el deploy real del mercado necesita el fork porque el Router de Kuru no existe en anvil plano. En modo manual sobre anvil hay que pasar `QUOTE_TOKEN` con la dirección del USDC mock.
