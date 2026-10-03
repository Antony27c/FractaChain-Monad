# ShardChain: documentación del proyecto

> Documento vivo para el equipo. Estado: **planificación**, todavía no hay código.
> Última actualización: 3 de octubre de 2026.

## 1. Qué es ShardChain

Un mercado onchain de activos reales argentinos (RWA) sobre **Monad**. Un productor o pyme fracciona un activo (por ejemplo, una cosecha de soja) en tokens negociables llamados **shards**. Los shards se emiten en una **licitación primaria** y después se negocian en el order book de **Kuru**, un exchange que ya existe en Monad.

**Pitch:** mercado onchain de activos reales argentinos, con licitación primaria y mercado secundario sin matching offchain, sobre la liquidación rápida de Monad.

## 2. Problema y solución

**Problema.** Productores y pymes necesitan liquidez contra su campaña, pero el circuito tradicional (banco, warrant, Caja de Valores) es lento, caro y casi no tiene mercado secundario. Los inversores no tienen acceso a rendimiento con respaldo real.

**Solución.** Tokenización, licitación primaria y mercado secundario onchain, 24/7, con costos bajos.

## 3. Hackathon

Monad Metropolis, track **Onchain Finance & Trading**.

| Dato | Valor |
|---|---|
| Ventana de build | 1 de septiembre al 13 de octubre de 2026 (quedan 10 días) |
| Judging | 14 al 27 de octubre |
| Ganadores | 3 de noviembre |
| Premio del track | US$30.000 entre 3 equipos |

El track pide, entre otros ejemplos, "order books totalmente onchain que no necesiten un motor de matching offchain". Dice también que es ideal para equipos que ya lanzaron un producto de trading, así que la demo tiene que ser muy sólida.

**Premios de sponsors a los que apuntamos**
- **Kuru**, "Bring New Assets and Markets to Kuru": US$5.000. Las bases completas no están en la página de Metropolis, solo enlazan a kuru.io. **Hay que leerlas.**
- **Privy**, US$5.000. Elegido como wallet embebida (ver decisión 10). Dynamic queda descartado. Las bases del bounty están en la plataforma de inscripción y hay que leerlas.
- **Envio**, "Best Use of Envio": US$1.000. Solo si sobra tiempo (indexer del historial).

## 4. Qué es Kuru y por qué lo usamos

**Monad** es la blockchain. **Kuru** es una aplicación que ya existe dentro de Monad: un exchange descentralizado con un order book totalmente onchain (CLOB), combinado con liquidez tipo AMM. ShardChain **no construye su propio order book**: lista los shards en Kuru.

Por qué:
- Tiene dos premios en juego (el del track y el bounty de Kuru).
- Ahorra el trabajo más riesgoso del plan original (matching, escrow, tests del order book).
- Kuru es el sponsor y su bounty premia justamente traer activos nuevos.

Lo que dice la documentación de Kuru (docs.kuru.io):
- El `Router` despliega mercados con `deployProxy(...)`. Acepta cualquier par de ERC-20 (tipo `NO_NATIVE`). Figura como función `public` sin restricción de acceso. **No está confirmado que sea permisionless**: se comprueba al probar el deploy.
- Un mercado se crea con precisiones calculadas por `ParamCreator.calculatePrecisions` del SDK (`@kuru-labs/kuru-sdk`). La doc advierte que parámetros mal elegidos impiden poner órdenes límite.
- Los saldos de las órdenes viven en un `MarginAccount` central.
- Cada mercado tiene un vault AMM que se siembra con liquidez inicial.

## 5. Decisiones tomadas

| # | Decisión | Detalle |
|---|---|---|
| 1 | Mercado secundario en Kuru | No hay `OrderBook.sol` propio. |
| 2 | KYC solo en la licitación primaria | Un `KycRegistry` define quién puede participar en el `Offering`. El shard es un ERC-20 normal que circula libre en Kuru. |
| 3 | Un shard es una fracción del valor de venta de la cosecha | Sin liquidación onchain en el MVP. |
| 4 | Licitación a precio fijo, primero en llegar | Con soft cap, hard cap y deadline. Si supera el hard cap, la contribución revierte. |
| 5 | Moneda de pago: el USDC oficial de testnet de Kuru | Ver sección 7: tiene restricciones. |
| 6 | Demo: un solo lote de soja | Si no llegamos, parte queda en mock. |
| 7 | Sin backend Express | El frontend lee onchain. |
| 8 | El mercado en Kuru se crea con un script offchain | Cuando termina la licitación, un script usa el SDK de Kuru para calcular las precisiones, llamar a `deployProxy` y sembrar el vault. En la UI, el emisor lo ve como un botón "Abrir mercado". |
| 9 | `CreditVault` y stack Stellar | Fuera del MVP. Todo lo de Stellar (Soroban, stellar-sdk, Freighter, XLM) se elimina. |
| 10 | Wallet: Privy | Wallet embebida con login por email o redes. Coincide con la wallet de Kuru y suma al bounty de Privy. Se descartó Dynamic. |

**Consecuencia de la decisión 2.** No podemos presentar el mercado secundario como "regulado". Es honesto decir: "KYC en la emisión, mercado secundario abierto en Kuru". El motivo es que el token solo ve contratos (MarginAccount, mercado), no usuarios finales. Una allowlist en el token que incluya a Kuru sería KYC de fachada.

## 6. Arquitectura

```
Productor ──> IssuanceFactory ──crea──> ShardToken (ERC-20)
                    │                        │
                    └──crea──> Offering <── inversores (KycRegistry)
                                   │ finalize
                                   v
                      Mercado en Kuru (shard / USDC)
                                   │
                                   v
                  Inversores compran y venden en el order book
```

**Contratos propios (Solidity + Foundry, Monad testnet)**
- `KycRegistry.sol`: lista de direcciones verificadas. En la demo, un botón "verificarme" las autoriza (mock).
- `ShardToken.sol`: ERC-20 con metadata del activo (tipo, cantidad, campaña).
- `IssuanceFactory.sol`: crea el token y su `Offering`.
- `Offering.sol`: licitación primaria con `contribute`, `finalize` y `refund`. Si no se llega al soft cap al deadline, cada inversor reclama su reembolso.

**Integración con Kuru (offchain, con el SDK)**
- Calcular precisiones, llamar a `deployProxy` y sembrar el vault tras la licitación.

**Frontend:** Next.js + wagmi + viem. Wallet embebida con Privy.

**Direcciones de Kuru en testnet.** La documentación de Kuru da dos juegos de direcciones. Verificado el 3 de octubre en Monad testnet:

| Contrato | Página "Contract Addresses" | Quick Start del SDK |
|---|---|---|
| Router | `0x7EFbE105Ca7415dE98F96622173458ac1c054630` (tiene código) | `0x1f5A250c4A506DA4cE584173c6ed1890B1bf7187` (**sin código**) |
| MarginAccount | `0xd029C2D98ff85D8F64799017fE00a59B1159CE02` (tiene código) | `0xdDDaBd30785bA8b45e434a1f134BDf304d6125d9` (**sin código**) |

**Se usan las de la página "Contract Addresses".** Las del Quick Start están desactualizadas. Además, el `marginAccountAddress()` del Router vigente devuelve el MarginAccount de esa misma columna.

**Sobre `deployProxy`.** Una simulación (`eth_call`) desde una cuenta cualquiera, con parámetros de prueba, revirtió sin mensaje. Eso **no confirma ni descarta** que sea permisionless: puede ser por permisos o por parámetros inválidos. Sigue pendiente probarlo con parámetros reales y un token real.

## 7. Moneda de pago: USDC de testnet de Kuru

Verificado consultando Monad testnet:
- Dirección: `0x3bA3d39AFcf8bb994f7964B3e0171Ea2Ba361570`, símbolo `USDC`, **6 decimales**.
- **No parece tener un mint libre.** Una llamada de prueba a `mint(address,uint256)` desde una cuenta cualquiera revierte, y el contrato no expone `owner()`. No es una prueba concluyente: podría tener otra función de mint.
- Las guías de la comunidad lo consiguen **cambiando MON por tUSDC en la UI de Kuru**. No encontré un faucet oficial de USDC.

Implicancias:
- Para tener fondos de demo hay que swapear MON (que sí tiene faucet en faucet.monad.xyz) por USDC en Kuru, y el volumen disponible es limitado.
- Para pagar la licitación y sembrar el mercado hace falta bastante USDC. Si no alcanza, el plan B es un `mUSDC` propio, que no se puede usar con el bounty de Kuru como moneda "oficial".

## 8. Plan de trabajo (10 días, hasta el 13 de octubre)

| Días | Objetivo |
|---|---|
| 1-2 (3-4 oct) | Repo y entorno Foundry para Monad. `KycRegistry`, `ShardToken`, `IssuanceFactory`, `Offering` con tests. Probar un `deployProxy` en testnet para confirmar que es permisionless. |
| 3-4 | Deploy en testnet. Script de integración con Kuru: crear mercado shard/USDC y sembrar liquidez. |
| 5-7 | Frontend: licitación (contribuir, reembolsar) y vista del mercado. |
| 8 | Wallet embebida, pulido y flujo completo de punta a punta. |
| 9-10 | Video de demo, README, lectura final de las bases de Kuru y envío. |

## 9. Preguntas abiertas

1. **¿Alcanza el USDC de testnet de Kuru?** Probar el swap MON a USDC y estimar cuánto se consigue.
2. **¿`deployProxy` de Kuru es permisionless?** Probar con parámetros reales (ver sección 6). Las direcciones vigentes ya están verificadas.
3. **Bases de los bounties de Kuru y Privy:** qué se exige para que cuenten. Probar el primer día que Privy funcione en Monad testnet.
4. **Parámetros del lote de demo:** supply de shards, decimales, precio, soft cap y hard cap.
5. **Roles del equipo.**

## 10. Glosario

- **Shard:** token ERC-20 que representa una fracción del valor de venta de un lote de activo real.
- **Lote:** activo concreto que se tokeniza (por ejemplo, 100 tn de soja de una campaña).
- **Emisor:** productor o pyme que fracciona un lote.
- **Offering (licitación primaria):** venta inicial de shards a precio fijo, con soft cap, hard cap y deadline.
- **Soft cap / hard cap:** mínimo que debe recaudarse para que la emisión sea válida / máximo que se acepta.
- **Reembolso:** devolución automática de las contribuciones si no se alcanza el soft cap.
- **KYC Registry:** lista de direcciones verificadas que pueden participar en la licitación.
- **Mercado secundario:** negociación de shards en el order book de Kuru después de la licitación.
- **Mercado de Kuru:** par shard/USDC desplegado con el Router de Kuru.

## 11. Roadmap (fuera del MVP)

- Liquidación de la cosecha y redención de shards.
- Forwards de cosecha con escrow.
- Acciones del Merval tokenizadas, con proof of reserve (Chainlink CRE).
- Crédito contra shards (`CreditVault`), con tasa según historial onchain.
- Perpetuos con funding por bloque.
- Un wrapper permisionado que extienda el KYC al mercado secundario.

## 12. Origen y reglas

Idea inspirada en Fractachain (github.com/Erosmart/fractachain), hecha en Stellar. ShardChain es un repo nuevo, con todo el código construido durante el hackathon.
