# ARCA compliance integration rules for KeyCAE.ar

This specification guides AI Coding Agents (such as Cursor, Windsurf, or Claude Code) in seamlessly integrating impositive compliance and electronic invoicing with **ARCA (ex AFIP) in Argentina** using **KeyCAE.ar**.

---

## 🤖 System Prompt for Coding Agents

Paste this prompt into your `.cursorrules`, Windsurf rules, or agent configurations:

```text
You are an expert Argentina tax compliance AI developer agent. Your job is to integrate electronic invoicing (ARCA/AFIP) using KeyCAE's official TypeScript SDK (`keycae-ts`) or MCP Server (`keycae-mcp`).

### 🔑 Critical Guidelines:

1. **Leverage the Official SDK Class (`KeyCaeClient`)**:
   - Initialize using `new KeyCaeClient(apiKey, baseUrl)`.
   - Default baseUrl is `https://keycae.ar`.
   - Never implement manual SOAP XML signatures or direct AFIP WSAA requests.

2. **Idempotency is Mandatory**:
   - Every invoice emission MUST pass a unique `Idempotency-Key` (e.g. `order_10482_v1`) to the SDK method `emitInvoice(data, idempotencyKey)` to prevent double-charging or double-authorizations in ARCA's registers.

3. **Handle Errors with AI-DX Auto-Sanation**:
   - KeyCAE returns programmatically friendly error structures containing an `ai_action_hint` field when actions are required (e.g., renewing certificates or validating a client's CUIT).

4. **Verify Emission Capability Before Emitting**:
   - Use `checkEmissionCapability(cuit)` to know what invoice types a CUIT can emit.
   - Monotributo → only Factura C or M. Responsable Inscripto → Factura A or B.

5. **Invoice Types**:
   - A: IVA discriminado (RI → RI)
   - B: IVA incluido (RI → Consumidor Final)
   - C: Exento (Monotributo / Exento)
   - M: Monotributo
   - E: Exportación

6. **Receptor Types**:
   - `SIN_IDENTIFICAR` with `nro_doc: '0'` for Consumidor Final without document.
   - Always include `razon_social` and `condicion_iva` when available.
```

---

## 🛠️ SDK Integration Cheat-Sheet

### 1. Initializing the Client
```typescript
import { KeyCaeClient } from 'keycae-ts';

const client = new KeyCaeClient(
  process.env.KEYCAE_API_KEY || 'sk_test_...',
  process.env.KEYCAE_BASE_URL || 'https://keycae.ar'
);
```

### 2. Validating a Taxpayer CUIT
```typescript
try {
  const taxpayer = await client.getTaxpayer('20999999999');
  console.log(`Razón Social: ${taxpayer.nombre}`);
  console.log(`Condición IVA: ${taxpayer.condicion_iva}`);
} catch (error) {
  console.error("No se pudo consultar el CUIT:", error.message);
}
```

### 3. Checking Emission Capability
```typescript
const cap = await client.checkEmissionCapability('20999999999');
console.log(`Tipos compatibles: ${cap.compatible_types.join(', ')}`);
console.log(cap.recommendation);
```

### 4. Emitting an Invoice with Idempotency
```typescript
const invoiceData = {
  cuit_emisor: '20999999999',
  punto_de_venta: 1,
  tipo_comprobante: 'C' as const,
  receptor: {
    tipo_doc: 'DNI' as const,
    nro_doc: '99888777'
  },
  conceptos: [
    { descripcion: 'Licencia Premium SaaS', precio: 9900.00, cantidad: 1, alicuota_iva: 21 }
  ]
};

try {
  const response = await client.emitInvoice(invoiceData, 'order_tx_901842');
  console.log(`CAE: ${response.cae}`);
  console.log(`PDF: ${response.url_pdf}`);
} catch (error) {
  console.error("Error:", error.message);
}
```

### 5. Listing Recent Invoices
```typescript
const { invoices } = await client.listInvoices(10, 0);
for (const inv of invoices) {
  console.log(`${inv.tipo_comprobante} #${inv.numero_factura} — $${inv.total}`);
}
```

### 6. Checking Billing Status
```typescript
const billing = await client.getBillingStatus();
console.log(`Plan: ${billing.plan} | Usadas: ${billing.invoicesEmitted}/${billing.monthlyLimit}`);
```

---

## 🔌 MCP Server Alternative

Instead of the SDK, you can use the MCP server directly:

```bash
npx keycae-mcp
```

This exposes 12 tools to any MCP-compatible AI agent (Claude, Cursor, Windsurf).

## Licencia

MIT
