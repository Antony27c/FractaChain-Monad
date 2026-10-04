# Guía de contratos para el frontend

Los ABIs están en `contracts/abi/*.json` (se pueden importar tal cual con wagmi/viem). Red: **Monad testnet, chain ID 10143**. Las direcciones desplegadas se publicarán acá cuando se haga el deploy.

Convenciones:
- USDC tiene **6 decimales**. Los shards tienen **18 decimales**.
- Precio: `pricePerShard` está en unidades de USDC (6 decimales) por 1 shard completo. Ejemplo: `100000` = 0,10 USDC por shard.

## Flujo de un inversor
1. Verificarse: `KycRegistry.verifyMyself()` (solo funciona si `openVerification()` es `true`).
2. Aprobar USDC: `usdc.approve(offering, monto)`.
3. Contribuir: `Offering.contribute(monto)`.
4. Cuando termina la licitación, alguien llama `Offering.finalize()`.
5. Si salió bien: `Offering.claim()` entrega los shards. Si falló: `Offering.refund()` devuelve el USDC.
6. Después, los shards se negocian en el mercado de Kuru.

## KycRegistry
| Función | Para qué |
|---|---|
| `isVerified(address) view` | ¿Está verificada esta dirección? |
| `openVerification() view` | ¿Se puede autoverificar cualquiera? |
| `verifyMyself()` | Se verifica quien llama (solo con verificación abierta). |

## IssuanceFactory
| Función | Para qué |
|---|---|
| `getIssuances() view` | Lista de lotes: `{issuer, token, offering}`. Una tarjeta por lote. |
| `issuancesCount() view`, `issuanceAt(id) view` | Lo mismo, de a uno. |
| `createIssuance(params)` | Crea un lote nuevo. Solo emisores verificados. |
| Evento `IssuanceCreated(id, issuer, token, offering, symbol, supply)` | Para detectar lotes nuevos. |

## ShardToken (ERC-20)
| Función | Para qué |
|---|---|
| `name()`, `symbol()`, `decimals()`, `totalSupply()`, `balanceOf(a)` | ERC-20 estándar. |
| `asset() view` | Metadata del activo: `{assetType, unit, quantity, campaign}`. |
| `issuer() view` | Quién emitió el lote. |

## Offering
Lectura:
| Función | Qué devuelve |
|---|---|
| `status()` | `0` Activa, `1` Exitosa, `2` Fallida. |
| `totalRaised()` | USDC recaudado (6 decimales). |
| `softCap()`, `hardCap()` | Mínimo y máximo de recaudación. |
| `deadline()` | Fecha límite (timestamp en segundos). |
| `pricePerShard()` | Precio por shard (ver convenciones). |
| `contributions(address)` | USDC aportado por esa dirección. |
| `shardsFor(monto)` | Shards que recibiría por un monto de USDC. |

Escritura: `contribute(monto)`, `finalize()`, `claim()`, `refund()`.

Cuándo se puede cada una:
| Acción | Condición |
|---|---|
| `contribute` | Estado Activa, antes del deadline, dirección verificada, sin pasar el hard cap. |
| `finalize` | Pasó el deadline, o se alcanzó el hard cap. Cualquiera puede llamarla. |
| `claim` | Estado Exitosa y haber contribuido. |
| `refund` | Estado Fallida y haber contribuido. |

## Errores que puede devolver
Si una transacción falla, el nombre del error indica por qué. Para mostrar mensajes al usuario:

| Error | Significado |
|---|---|
| `NotVerified` | La dirección no está verificada. |
| `HardCapExceeded` | El aporte superaría el hard cap. |
| `OfferingEnded` | Ya pasó el deadline. |
| `NotActive` | La licitación ya no está activa. |
| `CannotFinalizeYet` | Todavía no pasó el deadline ni se llegó al hard cap. |
| `NotSucceeded` / `NotFailed` | `claim` o `refund` en el estado equivocado. |
| `NothingToClaim` / `NothingToRefund` | No hay nada para esa dirección. |
| `ZeroAmount` | Monto en cero. |
| `IssuerNotVerified` | El emisor no está verificado (al crear un lote). |
| `TransferFailed` | Falló la transferencia del token de pago. |
| `ReentrantCall` | No debería aparecer en uso normal: protección de reentrancia. |

## Dev local (anvil)

Con `DeployLocal.s.sol` corriendo en anvil (`http://127.0.0.1:8545`, chain 31337) hay un USDC mock con mint libre y un lote SOJA26 de ejemplo. El frontend toma las direcciones de `frontend/.env.development.local` (`NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_FACTORY`, `NEXT_PUBLIC_KYC`, `NEXT_PUBLIC_USDC`).

Para abrir el mercado de Kuru cuando termina la licitación: `scripts/kuru/open-market.ts` con `--offering <addr>` (lee todo del contrato y exige `status = Succeeded`).

## Regenerar los ABIs
Si cambian los contratos:
```bash
cd contracts
for c in KycRegistry ShardToken Offering IssuanceFactory; do forge inspect $c abi --json > abi/$c.json; done
```
