# keycae-mcp

MCP Server for [KeyCAE](https://keycae.ar) — Argentine electronic invoicing (factura electrónica) with ARCA/AFIP.

Let AI agents emit invoices, manage credentials, and handle delegations directly.

## Quick Start

```bash
# Set your API key (get one at https://keycae.ar/dashboard)
export KEYCAE_API_KEY="sk_live_..."

# Run the MCP server (stdio mode for Claude, Cursor, etc.)
npx keycae-mcp
```

## Claude Desktop Configuration

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

## Cursor / Windsurf Configuration

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

## Available Tools

| Tool | Description |
|------|-------------|
| `emit_invoice` | Emit an Argentine electronic invoice (factura electrónica) |
| `get_invoice` | Get details of a previously emitted invoice |
| `list_invoices` | List recent invoices |
| `list_credentials` | List digital certificates for the CUIT |
| `create_credential` | Generate RSA keypair + CSR for ARCA |
| `check_delegation` | Check ARCA delegation status |
| `request_delegation` | Request ARCA delegation for invoicing |
| `lookup_taxpayer` | Look up taxpayer by CUIT |
| `get_billing_status` | Check billing plan and usage |
| `keycae_health` | Health check |

## Example Usage

### Emit a Factura B

```
User: Emití una factura B al CUIT 20333444555 por $15.000 ARS por "Servicios de consulting"
```

Agent calls `emit_invoice` with:
```json
{
  "cuit_emisor": "20254459306",
  "punto_de_venta": 3,
  "tipo_comprobante": "B",
  "receptor": { "tipo_doc": "CUIT", "nro_doc": "20333444555" },
  "conceptos": [{ "descripcion": "Servicios de consulting", "precio": 15000 }]
}
```

### Check if ready to invoice

```
User: ¿Puedo facturar con el CUIT 20254459306?
```

Agent calls `check_delegation` → confirms delegation is active, then `list_credentials` → confirms certificate is valid.

## Invoice Types

| Type | Description | When to use |
|------|-------------|-------------|
| **A** | IVA discriminado | RI → RI |
| **B** | IVA incluido | RI → CF |
| **C** | Exento | No genera IVA |
| **M** | Monotributo | Monotributo emitter |
| **E** | Exportación | International clients |

## Resources

The server also provides a `keycae://docs` resource with documentation that AI agents can read for context.

## License

MIT
