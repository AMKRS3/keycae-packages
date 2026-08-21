# keycae-ts 🚀

[![npm version](https://img.shields.io/npm/v/keycae-ts.svg)](https://www.npmjs.com/package/keycae-ts)
[![npm downloads](https://img.shields.io/npm/dm/keycae-ts.svg)](https://www.npmjs.com/package/keycae-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Cliente SDK oficial en **TypeScript** y **JavaScript** para interactuar con **KeyCAE.ar** y emitir facturación electrónica oficial ante **ARCA (ex AFIP)**.

## Instalación

```bash
npm install keycae-ts
```

## Inicio Rápido

El SDK soporta tanto el **Sandbox Público** (sin cuenta, ideal para desarrollo rápido) como el entorno de **Producción** (con cuenta registrada):

* **Para Probar en Sandbox (Sin Cuenta):** Usa la clave pública `sk_test_public_sandbox_cuit_20999999999` y el CUIT de pruebas `20999999999`.
* **Para Producción (Con Cuenta):** Regístrate en [keycae.ar](https://keycae.ar) para obtener tu API Key `sk_live_...` y configura tu CUIT real.

```typescript
import { KeyCaeClient } from 'keycae-ts';

// Ejemplo para Sandbox Público:
const client = new KeyCaeClient('sk_test_public_sandbox_cuit_20999999999');
// O para producción: const client = new KeyCaeClient('sk_live_tu_api_key');

// Consultar contribuyente
const taxpayer = await client.getTaxpayer('20999999999');
console.log(`${taxpayer.nombre} | ${taxpayer.estado}`);

// Verificar qué tipos de factura puede emitir
const capability = await client.checkEmissionCapability('20999999999');
console.log(`Tipos compatibles: ${capability.compatible_types.join(', ')}`);
console.log(capability.recommendation);

// Emitir factura
const invoice = await client.emitInvoice({
  cuit_emisor: '20999999999',
  punto_de_venta: 1,
  tipo_comprobante: 'B',
  receptor: { tipo_doc: 'CUIT', nro_doc: '20333444555' },
  conceptos: [{ descripcion: 'Servicios', precio: 15000 }]
}, 'idempotency_key_42');

console.log(`CAE: ${invoice.cae}`);
console.log(`PDF: ${invoice.url_pdf}`);
```

### Precios netos (sin IVA)

Por defecto `conceptos[].precio` se envía con IVA incluido. Si tu sistema maneja precios netos, pasá `iva_incluido: false` y KeyCAE calcula el IVA automáticamente:

```typescript
const invoice = await client.emitInvoice({
  cuit_emisor: '20999999999',
  punto_de_venta: 1,
  tipo_comprobante: 'A',
  iva_incluido: false, // conceptos[].precio son netos
  receptor: { tipo_doc: 'CUIT', nro_doc: '30999888776' },
  conceptos: [{ descripcion: 'Servicio profesional', precio: 1000, alicuota_iva: 21 }]
}, 'idempotency_key_43');
// → Neto $1.000 | IVA 21% $210 | Total $1.210
```

### Datos fiscales del emisor en el PDF

Los datos del emisor que se imprimen en el PDF (razón social, domicilio, Ingresos Brutos, inicio de actividades) se pueden enviar **por comprobante**. Tienen prioridad sobre la configuración de la cuenta y **no requieren cuenta ni login** (funcionan también en sandbox):

```typescript
const invoice = await client.emitInvoice({
  cuit_emisor: '20999999999',
  punto_de_venta: 1,
  tipo_comprobante: 'B',
  emisor_razon_social: 'Mi Empresa S.A.',
  emisor_ingresos_brutos: '901-999999-9',
  emisor_direccion: 'Av. Corrientes 1500, CABA',
  emisor_inicio_actividades: '01/03/2021',
  receptor: { tipo_doc: 'SIN_IDENTIFICAR', nro_doc: '0' },
  conceptos: [{ descripcion: 'Producto', precio: 1210 }]
});
```

Los cuatro campos `emisor_*` son opcionales; enviá sólo los que quieras que aparezcan.

## Modelos de Conexión

### Modalidad A: Delegación Directa (Recomendada)
Sin certificados, sin llaves privadas. En minutos facturás.

```typescript
const delegation = await client.createDelegation({
  cuit: '20999999999',
  organization: 'Tu Empresa'
});
```

### Modalidad B: Bóvedas KMS
Generación segura de claves RSA y CSR.

```typescript
const credential = await client.createCredential({
  cuit: '20999999999',
  organization: 'Tu Empresa'
});
```

### Modalidad C: Importar Certificado
Subida directa de certificados (.crt) y llaves (.key).

```typescript
await client.importCredential({
  cuit: '20999999999',
  organization: 'Tu Empresa',
  certificate: certificatePem,
  private_key: privateKeyPem
});
```

## Métodos Disponibles

### Taxpayers
| Método | Descripción |
|--------|-------------|
| `getTaxpayer(cuit)` | Consultar contribuyente en padrón ARCA |
| `checkEmissionCapability(cuit)` | Verificar tipos de factura compatibles |

### Delegations
| Método | Descripción |
|--------|-------------|
| `createDelegation(data)` | Iniciar delegación directa |
| `checkDelegationStatus()` | Consultar estado de delegación |

### Credentials (KMS)
| Método | Descripción |
|--------|-------------|
| `createCredential(data)` | Generar RSA keypair + CSR |
| `listCredentials()` | Listar certificados registrados |
| `importCredential(data)` | Importar certificado existente |
| `activateCredential(id, cert)` | Activar bóveda con certificado ARCA |
| `deleteCredential(id)` | Eliminar bóveda de claves |

### Invoices
| Método | Descripción |
|--------|-------------|
| `emitInvoice(data, idempotencyKey?)` | Emitir factura electrónica (CAE) |
| `getInvoice(id)` | Obtener detalles de factura |
| `listInvoices(limit?, offset?)` | Listar facturas recientes |
| `getSalesReport(from, to)` | Reporte mensual de ventas para el contador (JSON) |
| `getSalesReportCsv(from, to)` | Reporte mensual en CSV (listo para Excel) |
| `getInvoicePdfBuffer(id)` | Descargar PDF de factura |

### Puntos de Venta
| Método | Descripción |
|--------|-------------|
| `listPuntosDeVenta()` | Listar puntos de venta habilitados |

### Billing & Settings
| Método | Descripción |
|--------|-------------|
| `getBillingStatus()` | Estado del plan y consumo |
| `getTelegramSettings()` | Obtener configuración Telegram |
| `saveTelegramSettings(data)` | Guardar configuración Telegram |
| `health()` | Health check de la API |

### Partners (ERPs / SaaS)
| Método | Descripción |
|--------|-------------|
| `createPartnerSubaccount(data)` | Crear subcuenta completa para un cliente final (usuario + API Key) |
| `listPartnerSubaccounts()` | Listar tus clientes con plan y consumo mensual |
| `preauthorizeCuit(cuit)` | Pre-autorizar un CUIT para facturación consolidada |
| `getPartnerConfig(partnerId)` | Configuración pública de co-branding (sin auth) |

> Los métodos de Partners requieren instanciar el cliente con tu **API Key de Partner** (`sk_partner_live_...`) y solo deben usarse desde tu backend:
>
> ```typescript
> const partnerClient = new KeyCaeClient('sk_partner_live_mi-erp_...');
>
> const sub = await partnerClient.createPartnerSubaccount({
>   cuit: '20304567891',
>   organization: 'Cliente S.A.',
>   email: 'cliente@empresa.com'
> });
> // sub.api_key y sub.password se devuelven UNA sola vez
>
> const { clients, total } = await partnerClient.listPartnerSubaccounts();
> ```
>
> 📖 Guía completa del programa de partners: [keycae.ar/docs/partners.md](https://keycae.ar/docs/partners.md)

## Tipos de Comprobante

| Tipo | Descripción |
|------|-------------|
| `A` | IVA discriminado (Responsable Inscripto → RI) |
| `B` | Consumidor Final (RI → CF) |
| `C` | Exento (Monotributo / Exento) |
| `M` | Monotributo |
| `E` | Exportación |
| `NCA` `NCB` `NCC` `NCE` `NCM` | Notas de Crédito (A, B, C, E, M) |
| `NDA` `NDB` `NDC` `NDE` `NDM` | Notas de Débito (A, B, C, E, M) |

## Alertas Telegram

```typescript
await client.saveTelegramSettings({
  telegram_bot_token: '123456:***',
  telegram_chat_id: '987654321'
});
```

## Documentación

- 📖 [docs.keycae.ar](https://docs.keycae.ar) — Documentación interactiva
- 📄 [llms.txt](https://keycae.ar/llms.txt) — Para AI agents
- 🔌 [MCP Server](https://www.npmjs.com/package/keycae-mcp) — Para Cursor/Claude

## Licencia

MIT
