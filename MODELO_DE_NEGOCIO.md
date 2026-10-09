# FractaChain: modelo de negocio

> Cómo gana dinero FractaChain, quién paga y por qué le conviene pagar. Borrador del 9 de octubre de 2026.
> Los datos de mercado tienen fuente (sección 11). Las comisiones de FractaChain son una **propuesta a validar** con un acopio socio.

## 1. Propuesta de valor

| Cliente | Problema hoy | Qué le da FractaChain | Por qué le conviene |
|---|---|---|---|
| **Productor o pyme agro** (emisor) | Financia la campaña con crédito comercial o bancario, atado a pocos proveedores. | Fondos antes de cosechar, de muchos inversores, con precio fijado en una licitación transparente. | Una fuente nueva de financiamiento **sin pagar más** que hoy: el costo de FractaChain sale de la comisión que ya cobra el acopio (sección 2). |
| **Inversor** (minorista local o del exterior) | No tiene acceso a rendimientos respaldados por la economía real argentina, ni puede salir antes del vencimiento. | Exposición a una cosecha desde montos chicos, mercado secundario 24/7 en Kuru y canje automático al vender la cosecha. | Rendimiento en dólares con respaldo real y la opción de vender en cualquier momento. |
| **Acopio o cooperativa** (socio) | Financia a sus productores con su propio balance o con crédito bancario. | Inversores que financian a sus clientes, con su marca, sin poner capital propio. | Retiene productores, libera balance y sigue cobrando por comercializar el grano. |

La pieza diferencial es el **mercado secundario onchain con liquidez desde el día uno**: el inversor no queda encerrado hasta la cosecha, y eso le permite aceptar un rendimiento menor, lo que mantiene bajo el costo para el productor.

## 2. Contra qué competimos: lo que el productor ya paga

El productor paga hoy dos costos distintos al circuito comercial y bancario:

**a) Comercialización del grano** (lo cobra el acopio al vender la cosecha). Márgenes del INTA Pergamino, campaña 2025/26:

| Grano | Comisión del acopio | Precio a cosecha (MAGyP, sep. 2025) | Comisión sobre el precio |
|---|---|---|---|
| Soja | US$ 5,9/t | US$ 316/t | ~1,9 % |
| Trigo | US$ 3,8/t | US$ 190/t | ~2,0 % |
| Maíz | US$ 5,9/t | US$ 174,6/t | ~3,4 % |

A esa comisión se suman secado, zarandeo y otros gastos del acopio (US$ 7–11/t) y el flete.

**b) Financiamiento de la campaña.** Relevamiento de la Bolsa de Comercio de Rosario para 2025/26: casi todo el crédito al agro es en dólares, entre **8,5 % y 12,5 % anual** (préstamos con convenio para insumos 8,5–9 %, forwards cedidos 9–11 %, préstamos bullet 9,5–11 %). El 66 % del financiamiento de terceros viene del circuito comercial: acopios, proveedores de insumos y traders.

**La vara:** el costo total para el productor (rendimiento del inversor más comisiones de FractaChain) tiene que quedar **por debajo de ~9–11 % anual en dólares**. Por eso FractaChain **no suma una capa de costo nueva**: se financia compartiendo lo que el circuito ya cobra.

## 3. Fuentes de ingreso

| # | Ingreso | Quién paga | Cuándo | Estado |
|---|---|---|---|---|
| 1 | **Participación en la comisión de comercialización** | Acopio socio, de la comisión que ya cobra al productor (~2 %) | Al vender y liquidar la cosecha del lote | Propuesta: acuerdo comercial con cada acopio. |
| 2 | **Comisión de éxito reducida** (0,5 % de lo recaudado) | Emisor | Solo si la licitación llega al mínimo | Propuesta: `protocolFeeBps` en la próxima versión de `Offering`. |
| 3 | **Estructuración del lote** | Emisor o acopio | Al armar la serie (debida diligencia, documentación, fideicomiso) | Propuesta: servicio fuera de la cadena; baja con el programa global de series. |
| 4 | **Licencia white label** | Acopios, cooperativas, fintechs | Abono mensual o por lote originado | Propuesta. |
| 5 | **Rampas de pesos a USDC** | Usuario, vía socio de rampa | Reparto del spread con el proveedor | Roadmap. |

**Principio de diseño:** FractaChain cobra **solo cuando el lote funciona**. Si la licitación no llega al mínimo, nadie paga; si la cosecha no se vende, no hay comisión de comercialización. Los incentivos de FractaChain quedan alineados con los del productor y del inversor.

### Lo que no es ingreso de FractaChain

- **Comisiones de Kuru** (0,30 % taker y 0,10 % maker en los mercados de la demo): se reparten según las reglas de Kuru.
- **Los contratos desplegados no cobran comisión.** Es una decisión del MVP; la comisión de éxito entra en la próxima versión de `Offering`.
- **Market making:** ver la sección 4.

## 4. Liquidez: estrategia, no fuente de ingreso

Para que haya mercado secundario, alguien tiene que depositar shards y USDC en el vault de Kuru. Quien lo hace cobra el spread del vault (1 % en nuestros mercados) y, según las reglas de Kuru, parte de las comisiones. FractaChain **no lo presenta como ingreso** por tres razones:

1. **Requiere capital propio** en cada vault, que una empresa en etapa piloto no tiene.
2. **Ese capital corre riesgo:** ante una mala noticia (sequía, caída del precio del grano), los traders informados le venden al vault antes de que se ajuste el precio.
3. **Rinde poco con volumen bajo:** con US$ 100.000 de volumen anual en un par, capturar 0,5 % deja unos US$ 500.

**Cómo se forma la liquidez entonces:**

- **Siembra por el emisor (implementado):** al cerrar la licitación, el emisor siembra el vault con sus shards no vendidos y una parte de lo recaudado, al precio de la licitación. Es capital del lote, no de FractaChain.
- **Reserva de liquidez por serie:** un porcentaje del supply de cada lote se emite para el vault.
- **Proveedores de liquidez abiertos (implementado):** cualquier tenedor puede aportar al vault y cobrar su parte.
- **Market maker externo:** acuerdo con un creador de mercado profesional; Kuru ofrece introducciones de liquidez.
- **Market making propio, más adelante:** cuando haya volumen y capital, como ingreso secundario.

## 5. Costos principales

| Costo | Naturaleza | Comentario |
|---|---|---|
| Gas patrocinado (Privy) | Variable por operación | Bajo en Monad. Permite que el usuario no necesite MON. |
| KYC/AML | Variable por usuario | Proveedor de verificación de identidad y monitoreo. |
| Estructura legal | Fijo por programa y variable por serie | Fiduciario, CNV, estudio jurídico, auditoría contable. El programa global con series por lote abarata cada emisión. |
| Custodia y verificación del grano | Variable por lote | Warrantera o acopio, seguro, auditoría de existencias. En gran parte la cubre el acopio socio, que ya custodia el grano. |
| Tecnología | Fijo | RPC, indexación (Envio HyperSync), hosting, auditorías de seguridad. |

## 6. Canales y adquisición

- **Emisores, vía acopios y cooperativas (B2B2C).** Ya financian a sus productores, conocen su historial y custodian el grano. Con el reparto de la comisión de comercialización, ganan sin poner capital.
- **Inversores, vía la app.** Login con email, sin cripto previa ni gas. Más adelante, distribución por PSAV y agentes de bolsa inscriptos, como exige el régimen de tokenización de la CNV para la oferta pública.
- **Liquidez, vía Kuru.** Cada lote exitoso abre un par visible para cualquier trader de Monad.

## 7. Economía de un lote (ilustrativa)

Supuestos: lote de **1.000 t de soja** a US$ 316/t, financiado con una licitación de **US$ 250.000**; FractaChain recibe **la mitad de la comisión de comercialización** del acopio (~1,9 % del valor del grano) y cobra **0,5 % de éxito**.

| Concepto | Monto |
|---|---|
| Valor del grano (1.000 t × US$ 316) | US$ 316.000 |
| Comisión de comercialización del acopio (~1,9 %) | US$ 5.900 |
| Participación de FractaChain (50 %) | US$ 2.950 |
| Comisión de éxito (0,5 % de US$ 250.000) | US$ 1.250 |
| **Ingreso de FractaChain por lote** | **US$ 4.200** |

**Costo para el productor:** solo suma el 0,5 % de éxito, porque la comisión de comercialización ya la pagaba. Sobre una campaña de ~6 meses son ~1 punto anualizado, de modo que si el inversor acepta entre 6 % y 8 % anual en dólares, el costo total queda dentro de la vara de 8,5–12,5 % de la sección 2.

Con 10 lotes por campaña, el ingreso sería del orden de US$ 42.000, más estructuración y licencias. **[a validar]** El reparto con el acopio y el rendimiento que pide el inversor se validan en el piloto.

## 8. Por qué escala

- **Costo marginal bajo por lote:** la factory crea token, licitación y mercado en minutos; el programa de fideicomiso se arma una vez y emite series.
- **Efecto red:** más lotes atraen más inversores, y más inversores bajan el rendimiento exigido y el costo para el productor.
- **Cada acopio es un canal:** sumar un acopio trae a todos sus productores.
- **Nuevos activos sobre el mismo riel:** otras producciones, warrants electrónicos como garantía y crédito contra shards usan los mismos contratos, el mismo KYC y el mismo mercado.

## 9. Métricas que seguimos

| Métrica | Mide |
|---|---|
| Costo total para el productor frente a 8,5–12,5 % en dólares | Si somos competitivos. |
| Monto recaudado y tasa de éxito de licitaciones | Demanda de los inversores y calidad de la originación. |
| Volumen, spread y profundidad en Kuru | Liquidez del mercado secundario. |
| Lotes liquidados a tiempo y monto canjeado | Cumplimiento del activo subyacente. |
| Acopios activos y lotes por acopio | Fuerza del canal. |

## 10. Próximos pasos

1. Acordar con un acopio piloto el reparto de la comisión de comercialización y el rendimiento objetivo para el inversor.
2. Agregar `protocolFeeBps` (comisión de éxito) en la próxima versión de `Offering`, con tope y destino configurables.
3. Definir el porcentaje de reserva de liquidez por serie y buscar un market maker externo.
4. Cerrar el costo de la estructura legal por serie con el fiduciario y el estudio jurídico (ver `PLAN_LEGAL_OPERATIVO.md`).

## 11. Fuentes

- INTA EEA Pergamino, *Márgenes brutos de las principales actividades agrícolas, campaña 2025/2026* (septiembre de 2025): gastos de comercialización y comisión de acopio. [repositorio.inta.gob.ar](https://repositorio.inta.gob.ar/xmlui/bitstream/handle/20.500.12123/24661/INTA_CRBsAsNorte_EEAPergamino_Fillat_Francisco_Margenes_brutos_de_las_principales_actividades_agricolas_campa%C3%B1a_2025-2026_septiembre2025.pdf?isAllowed=y&sequence=1)
- Ministerio de Economía, *Márgenes y resultados agrícolas* (septiembre de 2025): precios a cosecha. [magyp.gob.ar](https://www.magyp.gob.ar/sitio/areas/analisis_economico/margenes/_archivos/000001_Informes%20de%20M%C3%A1rgenes%20y%20Resultados/202500_2025/250900_Margenes%20Resultados%20(Septiembre%202025).pdf)
- Bolsa de Comercio de Rosario, *¿Qué condiciones se avizoran para el financiamiento de la campaña 2025/26?*: tasas en dólares. [bcr.com.ar](https://www.bcr.com.ar/es/print/pdf/node/112753)
- Bolsa de Comercio de Rosario, *Panorama del financiamiento agrícola: cómo cerró la campaña 2024/25*: composición del financiamiento. [bcr.com.ar](http://www.bcr.com.ar/es/mercados/investigacion-y-desarrollo/informativo-semanal/noticias-informativo-semanal/panorama-del-5)
