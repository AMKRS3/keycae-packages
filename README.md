# KeyCAE.ar Packages 🚀

Repositorio oficial de paquetes, SDKs, CLI y herramientas para integrar facturación electrónica de **ARCA (ex AFIP) en Argentina** con **KeyCAE.ar**.

Diseñado para developers humanos y **agentes autónomos de IA** (Cursor, Windsurf, Claude Code, Codex).

---

## 📦 Paquetes

| Paquete | Directorio | Descripción | npm |
|---------|------------|-------------|-----|
| **`keycae-ts`** | [`/keycae-ts`](./keycae-ts) | SDK oficial TypeScript/JavaScript | [![npm](https://img.shields.io/npm/v/keycae-ts)](https://www.npmjs.com/package/keycae-ts) |
| **`keycae-mcp`** | [`/keycae-mcp`](./keycae-mcp) | MCP Server para AI agents | [![npm](https://img.shields.io/npm/v/keycae-mcp)](https://www.npmjs.com/package/keycae-mcp) |
| **`keycae-cli`** | [`/keycae-cli`](./keycae-cli) | CLI interactiva de terminal | [![npm](https://img.shields.io/npm/v/keycae-cli)](https://www.npmjs.com/package/keycae-cli) |
| **`arca-agent-skills`** | [`/arca-agent-skills`](./arca-agent-skills) | System prompts para agentes IA | — |
| **`vibe-invoice-inbox`** | [`/vibe-invoice-inbox`](./vibe-invoice-inbox) | Dashboard web de facturas | — |

---

## 🔌 MCP Server (para AI Agents)

**El más nuevo y potente.** Un solo comando y tu AI agent puede emitir facturas:

```bash
npx keycae-mcp
```

### Configuración en Claude Desktop

```json
{
  "mcpServers": {
    "keycae": {
      "command": "npx",
      "args": ["-y", "keycae-mcp"],
      "env": {
        "KEYCAE_API_KEY": "sk_liv..._key"
      }
    }
  }
}
```

### Configuración en Cursor / Windsurf

```json
{
  "mcpServers": {
    "keycae": {
      "command": "npx",
      "args": ["-y", "keycae-mcp"],
      "env": {
        "KEYCAE_API_KEY": "sk_liv..._key"
      }
    }
  }
}
```

### Tools Disponibles

| Tool | Descripción |
|------|-------------|
| `emit_invoice` | Emitir factura electrónica (A, B, C, M, E) |
| `get_invoice` | Consultar factura por ID |
| `list_invoices` | Listar facturas recientes |
| `list_credentials` | Ver certificados digitales |
| `create_credential` | Generar keypair + CSR para ARCA |
| `check_delegation` | Verificar delegación ARCA |
| `request_delegation` | Solicitar delegación ARCA |
| `lookup_taxpayer` | Buscar contribuyente por CUIT |
| `get_billing_status` | Estado del plan y consumo |
| `keycae_health` | Health check |

---

## 🚀 Guía de Inicio Rápido

### Opción 1: MCP Server (Recomendada para AI Agents)

```bash
npx keycae-mcp
```

### Opción 2: SDK de TypeScript

```bash
npm install keycae-ts
```

```typescript
import { KeyCaeClient } from 'keycae-ts';

const client = new KeyCaeClient('sk_tes...9306');

// Consultar contribuyente
const taxpayer = await client.getTaxpayer('20254459306');
console.log(`${taxpayer.nombre} | ${taxpayer.estado}`);

// Emitir factura
const invoice = await client.emitInvoice({
  cuit_emisor: '20254459306',
  punto_de_venta: 1,
  tipo_comprobante: 'B',
  receptor: { tipo_doc: 'CUIT', nro_doc: '20333444555' },
  conceptos: [{ descripcion: 'Servicios', precio: 15000 }]
});
console.log(`CAE: ${invoice.cae}`);
```

### Opción 3: CLI

```bash
npx keycae init sk_tes...9306
```

---

## 🤖 Integración con Agentes de IA

### Cursor / Windsurf / Claude Code

1. Copia las reglas de [`/arca-agent-skills/SKILL.md`](./arca-agent-skills/SKILL.md)
2. Pégalas en `.cursorrules` o la configuración de tu agente
3. El agente sabrá cómo facturar automáticamente

### MCP Server

El MCP server le da a tu agente 10 tools listos para usar. Sin setup, sin código.

---

## 📊 Estado del Proyecto

| Componente | Estado | Versión |
|------------|--------|---------|
| API Principal | ✅ Producción | keycae.ar |
| SDK TypeScript | ✅ Publicado | keycae-ts@1.0.0 |
| MCP Server | ✅ Publicado | keycae-mcp@1.0.1 |
| CLI | ✅ Publicado | keycae-cli |
| Telegram Alerts | ✅ Funcionando | — |
| Hermes Integration | ✅ Activo | hermes.keycae.ar |
| Documentación | ✅ Online | docs.keycae.ar |

---

## 🔗 Links

- 🌐 [keycae.ar](https://keycae.ar) — Sitio principal
- 📖 [docs.keycae.ar](https://docs.keycae.ar) — Documentación
- 📦 [npm: keycae-mcp](https://www.npmjs.com/package/keycae-mcp) — MCP Server
- 📦 [npm: keycae-ts](https://www.npmjs.com/package/keycae-ts) — SDK TypeScript
- 🔗 [GitHub: keycae-mcp](https://github.com/AMKRS3/keycae-mcp) — MCP Server repo
- 🔌 [mcp.so](https://mcp.so/server/keycae-mcp/AMKR) — Directorio MCP
- 🤖 [glama.ai](https://glama.ai/mcp/servers) — Directorio Glama
- 📄 [llms.txt](https://keycae.ar/llms.txt) — Para AI agents

---

## 📄 Licencia

MIT
