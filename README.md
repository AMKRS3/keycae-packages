# KeyCAE.ar Packages 🚀

Repositorio oficial de paquetes, SDKs, CLI y herramientas para integrar facturación electrónica de **ARCA (ex AFIP) en Argentina** con **KeyCAE.ar**.

Diseñado para developers humanos y **agentes autónomos de IA** (Cursor, Windsurf, Claude Code, Codex).

---

## 📦 Paquetes

| Paquete | Directorio | Descripción | npm |
|---------|------------|-------------|-----|
| **`keycae-ts`** | [`/keycae-ts`](./keycae-ts) | SDK oficial TypeScript/JavaScript (16 métodos) | [![npm](https://img.shields.io/npm/v/keycae-ts)](https://www.npmjs.com/package/keycae-ts) |
| **`keycae-mcp`** | [`/keycae-mcp`](./keycae-mcp) | MCP Server para AI agents (12 tools) | [![npm](https://img.shields.io/npm/v/keycae-mcp)](https://www.npmjs.com/package/keycae-mcp) |
| **`keycae-cli`** | [`/keycae-cli`](./keycae-cli) | CLI interactiva de terminal (12 comandos) | [![npm](https://img.shields.io/npm/v/keycae-cli)](https://www.npmjs.com/package/keycae-cli) |
| **`arca-agent-skills`** | [`/arca-agent-skills`](./arca-agent-skills) | MCP Server + System prompts para agentes IA (12 tools) | — |
| **`vibe-invoice-inbox`** | [`/vibe-invoice-inbox`](./vibe-invoice-inbox) | Dashboard web de facturas (Next.js) | — |

---

## 🔌 MCP Server (para AI Agents)

**El más nuevo y potente.** Un solo comando y tu AI agent puede emitir facturas:

```bash
npx keycae-mcp
```

### Configuración en Claude Desktop / Cursor / Windsurf

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

### Tools Disponibles (12)

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
| `check_emission_capability` | Verificar tipos de factura compatibles |
| `get_billing_status` | Estado del plan y consumo |
| `list_puntos_de_venta` | Listar puntos de venta habilitados |
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

const client = new KeyCaeClient('sk_liv..._key');

// Consultar contribuyente
const taxpayer = await client.getTaxpayer('20254459306');
console.log(`${taxpayer.nombre} | ${taxpayer.estado}`);

// Verificar compatibilidad de tipos de factura
const cap = await client.checkEmissionCapability('20254459306');
console.log(cap.recommendation);

// Emitir factura
const invoice = await client.emitInvoice({
  cuit_emisor: '20254459306',
  punto_de_venta: 1,
  tipo_comprobante: 'C',
  receptor: { tipo_doc: 'DNI', nro_doc: '35123456' },
  conceptos: [{ descripcion: 'Servicios', precio: 15000 }]
}, 'order_123');

console.log(`CAE: ${invoice.cae} | PDF: ${invoice.url_pdf}`);
```

### Opción 3: CLI

```bash
npm install -g keycae-cli
keycae init
keycae invoice-emit
```

---

## 📖 Modelos de Conexión

### Modalidad A: Delegación Directa (Recomendada)
Sin certificados, sin llaves privadas. En minutos facturás.

### Modalidad B: Bóvedas KMS
Generación segura de claves RSA y CSR.

### Modalidad C: Importar Certificado
Subida directa de certificados (.crt) y llaves (.key).

---

## ⚠️ Requisito: Delegación en ARCA

Antes de facturar, debés delegar la facturación electrónica a KeyCAE en ARCA:

1. Ingresá a [ARCA Clave Fiscal](https://serviciosweb.afip.gob.ar/clavefiscal/adminrel/pending.aspx)
2. Buscá el servicio **"Facturación Electrónica"** (ws://wsfe)
3. Delegá al CUIT: **20254459306** (Amilcar Waldemar Serra)

---

## 📖 Documentación

- 📄 [llms.txt](https://keycae.ar/llms.txt) — Para AI agents
- 🔌 [MCP Server](https://www.npmjs.com/package/keycae-mcp) — Para Cursor/Claude
- 📘 [SDK TypeScript](https://www.npmjs.com/package/keycae-ts) — Para developers
- 💻 [CLI](https://www.npmjs.com/package/keycae-cli) — Para terminal

## Licencia

MIT
