# keycae-mcp 🔌

[![npm version](https://img.shields.io/npm/v/keycae-mcp.svg)](https://www.npmjs.com/package/keycae-mcp)
[![npm downloads](https://img.shields.io/npm/dm/keycae-mcp.svg)](https://www.npmjs.com/package/keycae-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP Server for [KeyCAE.ar](https://keycae.ar) — **Argentine electronic invoicing** (facturación electrónica) with ARCA/AFIP.

Let AI agents emit invoices, manage credentials, handle delegations, and more — directly from Claude, Cursor, Windsurf, or any MCP-compatible client.

## ⚡ Quick Start

```bash
npx keycae-mcp
```

That's it. Your AI agent now has **14 tools** for Argentine invoicing.

## ☁️ Remote MCP Server (no installation required)

KeyCAE also exposes a **Streamable HTTP MCP server** — no `npx`, no local setup.

**Endpoint:** `https://keycae.ar/v1/mcp`

```json
{
  "mcpServers": {
    "keycae-remote": {
      "url": "https://keycae.ar/v1/mcp",
      "headers": {
        "Authorization": "Bearer sk_live_..."
      }
    }
  }
}
```

## ⚠️ Requisito: Delegación en ARCA

**ANTES de facturar**, debés delegar la facturación electrónica al representante de KeyCAE en ARCA:

1. Ingresá a [ARCA Clave Fiscal](https://serviciosweb.afip.gob.ar/clavefiscal/adminrel/pending.aspx)
2. Buscá el servicio **"Facturación Electrónica"** (ws://wsfe)
3. Delegá al CUIT representante: **20254459306** (Amilcar Waldemar Serra)
4. Aceptá la relación de representación

Sin esta delegación, no podés emitir facturas. El MCP server te permite verificar el estado con `check_delegation` y solicitarla con `request_delegation`.

## 🔧 Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "keycae": {
      "command": "npx",
      "args": ["-y", "keycae-mcp"],
      "env": {
        "KEYCAE_API_KEY": "sk_live_..."
      }
    }
  }
}
```

### Cursor / Windsurf

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "keycae": {
      "command": "npx",
      "args": ["-y", "keycae-mcp"],
      "env": {
        "KEYCAE_API_KEY": "sk_live_..."
      }
    }
  }
}
```

## 🛠️ Available Tools (12)

| Tool | Description |
|------|-------------|
| `emit_invoice` | Emitir factura (24 tipos: A/B/C/M/E + 5 NC + 5 ND + 9 FCE MiPyMEs) |
| `get_invoice` | Consultar factura por ID |
| `list_invoices` | Listar facturas recientes |
| `list_credentials` | Listar certificados digitales |
| `create_credential` | Generar RSA keypair + CSR para ARCA |
| `check_delegation` | Verificar delegación ARCA |
| `request_delegation` | Solicitar delegación ARCA |
| `lookup_taxpayer` | Buscar contribuyente por CUIT |
| `check_emission_capability` | Verificar qué tipos de factura puede emitir un CUIT |
| `get_condiciones_iva` | Tabla de 15 condiciones IVA del receptor (códigos oficiales ARCA) |
| `get_billing_status` | Estado del plan y consumo |
| `list_puntos_de_venta` | Listar puntos de venta habilitados |
| `keycae_health` | Health check de la API |

## 📖 Resources

The server also exposes a `keycae://docs` resource with inline documentation covering invoice types, common workflows, and ARCA/AFIP notes.

## 🔄 Workflow Típico

```
1. check_delegation  → Verificar que el CUIT esté delegado
2. list_credentials  → Verificar que el certificado esté activo
3. check_emission_capability → Saber qué tipos de factura puede emitir
4. emit_invoice      → Emitir la factura
5. get_invoice       → Consultar detalles
```

## 📋 Tipos de Comprobante

| Tipo | Descripción | Quién emite |
|------|-------------|-------------|
| **A** | IVA discriminado | Responsable Inscripto → RI |
| **B** | IVA incluido | RI → Consumidor Final |
| **C** | Exento (sin IVA) | Monotributo / Exento |
| **M** | Monotributo | Monotributista |
| **E** | Exportación | Exportadores |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KEYCAE_API_KEY` | ✅ | — | Your KeyCAE API key |
| `KEYCAE_API_URL` | ❌ | `https://keycae.ar` | API base URL |

## Licencia

MIT
