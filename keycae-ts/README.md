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

```typescript
import { KeyCaeClient } from 'keycae-ts';

const client = new KeyCaeClient('sk_liv..._key');

// Consultar contribuyente
const taxpayer = await client.getTaxpayer('20254459306');
console.log(`${taxpayer.nombre} | ${taxpayer.estado}`);

// Verificar qué tipos de factura puede emitir
const capability = await client.checkEmissionCapability('20254459306');
console.log(`Tipos compatibles: ${capability.compatible_types.join(', ')}`);
console.log(capability.recommendation);

// Emitir factura
const invoice = await client.emitInvoice({
  cuit_emisor: '20254459306',
  punto_de_venta: 1,
  tipo_comprobante: 'B',
  receptor: { tipo_doc: 'CUIT', nro_doc: '20333444555' },
  conceptos: [{ descripcion: 'Servicios', precio: 15000 }]
}, 'idempotency_key_42');

console.log(`CAE: ${invoice.cae}`);
console.log(`PDF: ${invoice.url_pdf}`);
```

## Modelos de Conexión

### Modalidad A: Delegación Directa (Recomendada)
Sin certificados, sin llaves privadas. En minutos facturás.

```typescript
const delegation = await client.createDelegation({
  cuit: '20254459306',
  organization: 'Tu Empresa'
});
```

### Modalidad B: Bóvedas KMS
Generación segura de claves RSA y CSR.

```typescript
const credential = await client.createCredential({
  cuit: '20254459306',
  organization: 'Tu Empresa'
});
```

### Modalidad C: Importar Certificado
Subida directa de certificados (.crt) y llaves (.key).

```typescript
await client.importCredential({
  cuit: '20254459306',
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
