# keycae-cli 💻

[![npm version](https://img.shields.io/npm/v/keycae-cli.svg)](https://www.npmjs.com/package/keycae-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CLI interactiva para configurar, testear y diagnosticar facturación electrónica de **ARCA (ex AFIP)** a través de **KeyCAE.ar**.

## Instalación Global

```bash
npm install -g keycae-cli
```

O compilar localmente:

```bash
npm install && npm run build && npm link
```

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `keycae init` | Configurar API Key y servidor |
| `keycae taxpayers <cuit>` | Consultar CUIT en padrón ARCA |
| `keycae invoice-emit` | Emitir factura electrónica interactiva |
| `keycae invoices` | Listar facturas recientes |
| `keycae invoice <id>` | Ver detalles de una factura |
| `keycae credentials list` | Listar certificados digitales |
| `keycae credentials create` | Generar RSA keypair + CSR |
| `keycae delegation` | Consultar estado de delegación ARCA |
| `keycae delegation-request` | Solicitar delegación ARCA |
| `keycae billing` | Ver estado del plan y consumo |
| `keycae pos` | Listar puntos de venta habilitados |
| `keycae health` | Health check de la API |

## Ejemplos

### Configuración inicial
```bash
$ keycae init
? API Key de KeyCAE.ar: sk_test_...
? Base URL de la API: https://keycae.ar

✅ Configuración guardada en ~/.keycae-cli-config.json
```

### Consultar un contribuyente
```bash
$ keycae taxpayers 20999999999
📋 --- Datos Impositivos ---
👤 Razón Social: Empresa de Pruebas S.A.
🆔 CUIT: 20999999999
🏢 Tipo Persona: Juridica
📊 Monotributo Cat: H
⚖️  IVA Inscripto: NO
📌 Estado Fiscal: ACTIVO
```

### Listar facturas
```bash
$ keycae invoices --limit 5
📋 5 factura(s):
  C-0001-00000142  |  CAE: 76142098471253  |  $120000  |  inv_abc123
  C-0001-00000143  |  CAE: 76294018274615  |  $85000   |  inv_xyz789
```

### Ver plan de facturación
```bash
$ keycae billing
💳 --- Plan de Facturación ---
📋 Plan: Developer
📊 Emitidas: 23 / 1000
📈 Consumo: 2.3%
💰 Estado: active
```

## Licencia

MIT
