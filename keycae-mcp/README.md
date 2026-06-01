# keycae-mcp 🔌

[![npm version](https://img.shields.io/npm/v/keycae-mcp.svg)](https://www.npmjs.com/package/keycae-mcp)
[![npm downloads](https://img.shields.io/npm/dm/keycae-mcp.svg)](https://www.npmjs.com/package/keycae-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP Server for [KeyCAE.ar](https://keycae.ar) — **Argentine electronic invoicing** (facturación electrónica) with ARCA/AFIP.

Let AI agents emit invoices, manage credentials, and handle delegations directly.

## ⚡ Quick Start

```bash
npx keycae-mcp
```

That's it. Your AI agent now has 10 tools for Argentine invoicing.

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

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `emit_invoice` | Emit an Argentine electronic invoice (A, B, C, M, E) |
| `get_invoice` | Get details of a previously emitted invoice |
| `list_invoices` | List recent invoices |
| `list_credentials` | List digital certificates for the CUIT |
| `create_credential` | Generate RSA keypair + CSR for ARCA |
| `check_delegation` | Check ARCA delegation status |
| `request_delegation` | Request ARCA delegation for invoicing |
| `lookup_taxpayer` | Look up taxpayer by CUIT |
| `get_billing_status` | Check billing plan and usage |
| `keycae_health` | Health check |
| `list_puntos_de_venta` | List available points of sale |
| `check_emission_capability` | Check what invoice types a CUIT can emit |

## 💡 Example Usage

### 1. Check if ready to invoice

```
User: ¿Puedo facturar con el CUIT 20254459306?
```

Agent calls `check_delegation` → confirms delegation is active, then `list_credentials` → confirms certificate is valid.

### 2. Request delegation (if not done)

```
User: Necesito delegar mi facturación a KeyCAE
```

Agent calls `request_delegation` → starts the delegation process.

### 3. Emit a Factura B

```
User: Emití una factura B al CUIT 20333444555 por $15.000 ARS por "Servicios de consulting"
```

Agent calls `emit_invoice`:
```json
{
  "cuit_emisor": "20254459306",
  "punto_de_venta": 3,
  "tipo_comprobante": "B",
  "receptor": { "tipo_doc": "CUIT", "nro_doc": "20333444555" },
  "conceptos": [{ "descripcion": "Servicios de consulting", "precio": 15000 }]
}
```

## 📋 Invoice Types

| Type | Description | When to use |
|------|-------------|-------------|
| **A** | IVA discriminado | RI → RI |
| **B** | IVA incluido | RI → Consumidor Final |
| **C** | Exento | No genera IVA |
| **M** | Monotributo | Monotributo emitter |
| **E** | Exportación | International clients |

## 🔗 Links

- 🌐 [keycae.ar](https://keycae.ar) — API & Dashboard
- 📖 [docs.keycae.ar](https://docs.keycae.ar) — Documentation
- 📄 [llms.txt](https://keycae.ar/llms.txt) — AI Agent Reference
- 🔌 [mcp.so](https://mcp.so/server/keycae-mcp/AMKR) — MCP Directory
- 🤖 [glama.ai](https://glama.ai/mcp/servers) — Glama Directory

## 📦 Related Packages

- [`keycae-ts`](https://www.npmjs.com/package/keycae-ts) — TypeScript SDK
- [`keycae-cli`](https://www.npmjs.com/package/keycae-cli) — CLI tool

## 📄 License

MIT
