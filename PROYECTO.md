# FractaChain: documentación del proyecto

> Documento vivo para el equipo. Estado: **en build**, contratos con tests en verde y flujo completo probado en **Monad testnet real** (con un USDC mock).
> Última actualización: 6 de octubre de 2026.

## 1. Qué es FractaChain

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

**Monad** es la blockchain. **Kuru** es una aplicación que ya existe dentro de Monad: un exchange descentralizado con un order book totalmente onchain (CLOB), combinado con liquidez tipo AMM. FractaChain **no construye su propio order book**: lista los shards en Kuru.

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

**Contratos propios (Solidity + Foundry, Monad testnet).** Escritos y con tests (`contracts/`, 79 tests pasando: unitarios, fuzz e invariantes):
- `KycRegistry.sol`: lista de direcciones verificadas. Un dueño las aprueba, y con la verificación abierta cualquiera puede usar `verifyMyself()` (botón "verificarme" de la demo).
- `ShardToken.sol`: ERC-20 de 18 decimales con metadata del activo (tipo, unidad, cantidad, campaña) y supply fijo emitido una sola vez.
- `Offering.sol`: licitación primaria a precio fijo con `contribute`, `finalize`, `claim` y `refund`. Si se llega al soft cap, el USDC va al emisor y cada inversor retira sus shards; si no, cada inversor recupera su USDC. Revisión propia hecha: guardia de reentrancia en las 4 funciones y tests con token malicioso.
- `IssuanceFactory.sol`: crea el token y su `Offering` en una transacción y registra cada lote. Solo emisores verificados, y exige que el supply del lote alcance para vender el hard cap.
- `script/DeployLocal.s.sol`: deploy de todo el stack en anvil con un USDC mock, para dev local y para el frontend (`frontend/.env.development.local`).
- Guía para el frontend: `contracts/CONTRATOS.md`. ABIs en `contracts/abi/` (regenerados con la revisión).

**Lote de ejemplo (script de deploy):** 1.000.000 shards de soja (100 tn, campaña 2025/26) a 0,10 USDC, soft cap 40.000 USDC, hard cap 100.000 USDC, 7 días.

**Integración con Kuru (offchain, con el SDK):** `scripts/kuru/open-market.ts` calcula las precisiones, crea el mercado y siembra el vault. El modo `--offering <addr>` lee el token, la moneda y el precio del contrato y exige `status = Succeeded` (es el que invoca el botón "Abrir mercado"); `--json` deja stdout limpio para el frontend. Probado E2E sobre un fork local de la testnet: licitación completa (contribute → finalize → claim) y mercado creado con bid ≈ 0,099 y ask 0,100. Ver `scripts/kuru/README.md`.

**Probado en la testnet real (6 de octubre):** deploy de los contratos, licitación completa (`contribute` hasta el hard cap, `finalize`, `claim`) y `open-market.ts --offering`, que creó el mercado en el Router de Kuru con `deployProxy` y sembró el vault. Se hizo con un `mUSDC` propio (ver sección 7).

| Contrato | Dirección en Monad testnet |
|---|---|
| `KycRegistry` | `0xe42FF6D4d9ED6603873144D3B1C46B6317d45FC9` |
| `IssuanceFactory` | `0xdbb769E14687DFD90f319A225b5fF8eA423Bb68F` |
| `ShardToken` (SOJA26) | `0x3AbA80ACDc4F35666012e3bdF1c1bca56996630D` |
| `Offering` | `0x1929ada51d21911cA3545C18a08693a483f2C308` |
| `mUSDC` (mock, 6 decimales) | `0xBf11e27C5C26E11E4B213fBCc5d5EDBb29453d36` |
| Mercado SOJA26/mUSDC en Kuru | `0x24B6dB71754086e87eF0d0C0F83C067b58Fb9B7f` |
| Vault del mercado | `0xB6BDa4B1Abe3D8d0D82691BC0f3a6f9aa7536010` |

Hay un primer deploy anterior (con el USDC de Kuru como moneda de pago) que quedó sin uso: el lote de ejemplo pide 40.000 USDC de soft cap y no teníamos cómo conseguirlos.

Los cinco contratos están verificados en Sourcify (`exact_match`).

**Qué falta probar:** repetir el flujo con el USDC oficial de testnet de Kuru y el frontend contra estas direcciones.

**Frontend:** Next.js + wagmi + viem. Wallet embebida con Privy.

**Direcciones de Kuru en testnet.** La documentación de Kuru da dos juegos de direcciones. Verificado el 3 de octubre en Monad testnet:

| Contrato | Página "Contract Addresses" | Quick Start del SDK |
|---|---|---|
| Router | `0x7EFbE105Ca7415dE98F96622173458ac1c054630` (tiene código) | `0x1f5A250c4A506DA4cE584173c6ed1890B1bf7187` (**sin código**) |
| MarginAccount | `0xd029C2D98ff85D8F64799017fE00a59B1159CE02` (tiene código) | `0xdDDaBd30785bA8b45e434a1f134BDf304d6125d9` (**sin código**) |

**Se usan las de la página "Contract Addresses".** Las del Quick Start están desactualizadas. Además, el `marginAccountAddress()` del Router vigente devuelve el MarginAccount de esa misma columna.

**Sobre `deployProxy`.** Verificado con un test sobre un fork de Monad testnet (`contracts/test/KuruFork.t.sol`): una cuenta cualquiera desplegó un mercado para un token propio de 18 decimales contra el USDC de Kuru (6 decimales). El test usa precisiones de ejemplo (`sizePrecision` 1e10, `pricePrecision` 1e9, `tickSize` 100, `minSize` 1e8, `maxSize` 1e16, comisiones 30/10 bps y spread 100). El script `open-market.ts` usa en cambio las que calcula `calculatePrecisions` del SDK según el precio. Es una simulación sobre un fork, no una transacción real. El token tiene que exponer `decimals()` y `symbol()`; Kuru los lee al crear el mercado.

## 7. Moneda de pago: USDC de testnet de Kuru

Verificado consultando Monad testnet:
- Dirección: `0x3bA3d39AFcf8bb994f7964B3e0171Ea2Ba361570`, símbolo `USDC`, **6 decimales**.
- **No parece tener un mint libre.** Una llamada de prueba a `mint(address,uint256)` desde una cuenta cualquiera revierte, y el contrato no expone `owner()`. No es una prueba concluyente: podría tener otra función de mint.
- Las guías de la comunidad lo consiguen **cambiando MON por tUSDC en la UI de Kuru**. No encontré un faucet oficial de USDC.

**Actualización (6 de octubre).** La app web de Kuru (`kuru.io`) solo muestra mainnet: usa el USDC `0x7547...b603` y no reconoce el saldo de testnet, aunque la wallet esté en Monad Testnet. Por eso no pudimos conseguir USDC de testnet por swap. Se aplicó el plan B: un `mUSDC` propio (`script/DeployMockUsdc.s.sol`, con mint libre), con el que se probó todo el flujo en testnet. Sigue pendiente averiguar con Kuru cómo conseguir su USDC oficial de testnet.

Implicancias:
- Para tener fondos de demo hay que swapear MON (que sí tiene faucet en faucet.monad.xyz) por USDC en Kuru, y el volumen disponible es limitado.
- Para pagar la licitación y sembrar el mercado hace falta bastante USDC. Si no alcanza, el plan B es un `mUSDC` propio, que no se puede usar con el bounty de Kuru como moneda "oficial".

## 8. Plan de trabajo (10 días, hasta el 13 de octubre)

| Días | Objetivo |
|---|---|
| 1-2 (3-4 oct) | **Hecho:** entorno Foundry, `KycRegistry`, `ShardToken`, `Offering`, `IssuanceFactory` con tests, scripts de deploy (testnet y `DeployLocal` para anvil), ABIs y guía para el frontend, script de Kuru (probado en fork, modo `--offering`), invariantes del `Offering` (128k llamadas sin violaciones) y revisión de seguridad propia con fixes. |
| 3-4 | **Hecho (6 oct):** deploy en testnet con una wallet de prueba, licitación completa y script de Kuru con shards reales (con `mUSDC`). Contratos verificados en Sourcify. **Pendiente:** repetir con el USDC oficial de Kuru y revisión externa. |
| 5-7 | Frontend: licitación (contribuir, reembolsar) y vista del mercado. |
| 8 | Wallet embebida, pulido y flujo completo de punta a punta. |
| 9-10 | Video de demo, README, lectura final de las bases de Kuru y envío. |

## 9. Preguntas abiertas

1. **¿Cómo conseguimos el USDC oficial de testnet de Kuru?** El swap de `kuru.io` solo funciona en mainnet (ver sección 7). Preguntar a Kuru (Discord) y leer las bases del bounty para saber si exigen su USDC.
2. ~~Confirmar `deployProxy` con una transacción real~~ **Resuelta:** cualquier cuenta puede crear un mercado en el Router de Kuru en testnet (mercado `0x24B6...9B7f`).
3. **Bases de los bounties de Kuru y Privy:** qué se exige para que cuenten. Probar el primer día que Privy funcione en Monad testnet.
4. **Roles del equipo.** Contratos e integración con Kuru: Antony. Frontend: Juli.
5. **Pendiente de UX: onboarding de la wallet embebida (Privy).** Probando el login se vio que un usuario nuevo no puede operar y la app no se lo explica bien:
   - ~~La wallet nace sin MON y el primer intento de transacción falla con "Signer had insufficient balance".~~ **Resuelto (8 de octubre) con gas patrocinado de Privy:** con la wallet embebida, `useTx` envía las transacciones con `sponsor: true` y la app paga el gas (Privy Dashboard > Fee sponsorship, Monad Testnet, con "Allow transactions from the client" activado). Probado con una cuenta nueva por email y 0 MON: KYC, carga de USDC, compra y venta salieron bien y el dashboard no registró consumo. Con wallets externas se firma como antes. Nota: en Brave, con Shields activado, la wallet embebida no se crea; en Edge funciona.
   - La dirección de la wallet se ve cortada (`0xC3Ab...7B76`) y no se podía copiar. Se agregó un clic para copiar y un tooltip en `LoginButton.tsx` como parche, pero falta una pantalla o menú de cuenta con la dirección completa, botón de copiar y el saldo de MON y USDC.
   - ~~Botón "Cargar fondos de prueba".~~ **Hecho:** quien tiene 0 USDC ve "Cargar 1.000 USDC de prueba" en el panel del lote (mint del mUSDC, gas patrocinado). Recorrido probado desde una cuenta nueva sin MON: email, KYC, cargar USDC, comprar 10 USDC (90,19 MAIZ27) y vender 5 MAIZ27.
   - ~~El panel "Mercado secundario" no estaba conectado.~~ **Hecho (7 de octubre):** el panel de la página del lote lee el mercado onchain (bid, ask, comisiones, vault y links al explorer) y el emisor tiene un botón "Abrir mercado" que crea el mercado y siembra el vault desde el navegador con su wallet. Los mercados se registran en `frontend/src/lib/kuru.ts` (`KURU_MARKETS`, ya incluye `0x24B6...9B7f`); los abiertos desde la UI se guardan en `localStorage` hasta agregarlos a ese registro. La app web de Kuru solo muestra mainnet, por eso no se enlaza a kuru.io. Probado de punta a punta en testnet con un lote nuevo (MAIZ27, token `0x40A7...A074`): aporte hasta el hard cap, `finalize` y "Abrir mercado" desde la UI crearon el mercado `0x0263...aaF6` y sembraron el vault (bid 0,099 / ask 0,100). **Comprar y vender desde la app (7 de octubre):** el panel del mercado tiene pestañas Comprar/Vender con órdenes de mercado contra el order book de Kuru (`placeAndExecuteMarketBuy/Sell`), estimación previa, tolerancia de slippage (0,5 / 1 / 3 %) y aprobación del token solo si hace falta. Las unidades se validaron en un fork de testnet: una compra de 1 USDC dio 9,92 MAIZ27 (igual que la estimación), la venta de 10 MAIZ27 dio USDC y un `minAmountOut` imposible revirtió con `SlippageExceeded`. Probado también en el navegador con la wallet de Privy sobre el mercado MAIZ27: una compra de 1 USDC dio 9,92 MAIZ27 y una venta de 5 MAIZ27 devolvió unos 0,5 USDC, con el bid y el ask moviéndose en cada operación.
   - El formulario "Emitir un lote" no avisa si los topes son inalcanzables para quien prueba. Por ejemplo, un mínimo de 100.000 USDC con un saldo de 50.000. Mostrar el saldo de USDC junto al formulario y advertir cuando el mínimo o el máximo superan lo que el usuario puede aportar, al menos en la demo.
6. **Liquidez del mercado secundario.** El vault de MAIZ27 se sembró con solo 1.000 shards y 100 USDC, y una compra de 10 USDC subió el precio de 0,10 a ~0,12 (+20 %), con un precio promedio pagado de ~0,111. No es un error: es poca profundidad.
   - **Para la demo:** sembrar un mercado con más liquidez (por ejemplo 50.000 shards y 5.000 USDC) para que el precio se mueva de forma realista en el video.
   - **Para el bounty de Kuru ("estrategia de liquidez y formación inicial del mercado"):** el emisor siembra el vault con parte de los fondos recaudados y los shards no vendidos, al precio de la licitación. Para dar profundidad al libro hace falta además un market maker o un incentivo a proveedores de liquidez. Este caso sirve como evidencia de por qué hace falta.
   - **Hecho (8 de octubre, en local): "Agregar liquidez al vault".** Cualquiera con shards y USDC deposita en el vault al precio actual (`base × vaultBestAsk`, igual que el SDK) y ve su porcentaje del vault. Probado en un fork: 2.000 MAIZ27 + 241,6 USDC triplicaron la liquidez sin mover el precio, y el impacto de una compra de 10 USDC bajó de ~11 % a ~3 %. Ojo: MAIZ27 tiene solo 5.000 shards de supply; para una demo con mucha más liquidez conviene un lote nuevo con supply grande (por ejemplo 1.000.000 shards y topes chicos, así el emisor recibe casi todo como no vendido y puede sembrar 50.000 shards).

Resuelta: los parámetros del lote de demo (ver sección 6).

## 10. Glosario

- **Shard:** token ERC-20 que representa una fracción del valor de venta de un lote de activo real.
- **Lote:** activo concreto que se tokeniza (por ejemplo, 100 tn de soja de una campaña).
- **Emisor:** productor o pyme que fracciona un lote.
- **Offering (licitación primaria):** venta inicial de shards a precio fijo, con soft cap, hard cap y deadline.
- **Soft cap / hard cap:** mínimo que debe recaudarse para que la emisión sea válida / máximo que se acepta.
- **Reembolso:** devolución de las contribuciones si no se alcanza el soft cap. Cada inversor la reclama con `refund()`.
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

FractaChain se prototipó antes en otro ecosistema (Stellar/Soroban, github.com/Erosmart/fractachain), donde ganó el 1.er puesto del Track Genesis del Argentina Builder Challenge (BAF × Stellar). Para Monad Metropolis se reconstruyó desde cero: todos los contratos, scripts y el frontend de este repo se escribieron durante el hackathon. No se reutilizó código de Soroban, solo la idea y el diseño.
