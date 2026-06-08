#!/usr/bin/env node
/**
 * KeyCAE MCP Server
 * 
 * Model Context Protocol server for KeyCAE - Argentine electronic invoicing
 * with ARCA/AFIP. Allows AI agents to emit invoices, manage credentials,
 * and handle delegations directly.
 * 
 * Usage:
 *   npx keycae-mcp                    # stdio mode (for Claude, Cursor, etc.)
 *   KEYCAE_API_KEY=sk_live_xxx npx keycae-mcp
 * 
 * Environment:
 *   KEYCAE_API_KEY     - Your KeyCAE API key (required)
 *   KEYCAE_API_URL     - API base URL (default: https://keycae.ar)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ── Config ──────────────────────────────────────────────────────────
const API_KEY = process.env.KEYCAE_API_KEY || "";
const BASE_URL = (process.env.KEYCAE_API_URL || "https://keycae.ar").replace(/\/$/, "");

if (!API_KEY) {
  console.error("❌ KEYCAE_API_KEY is required. Get one at https://keycae.ar/dashboard");
  process.exit(1);
}

// ── HTTP Client ─────────────────────────────────────────────────────
async function api(method: string, path: string, body?: unknown): Promise<any> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000)
  });

  const data = await res.json();

  if (!res.ok) {
    const hint = data?.error?.ai_action_hint || "";
    throw new Error(`API Error (${res.status}): ${data?.error?.message || JSON.stringify(data)}${hint ? ` [hint: ${hint}]` : ""}`);
  }

  return data;
}

// ── MCP Server ──────────────────────────────────────────────────────
const server = new McpServer({
  name: "keycae",
  version: "1.0.0"
});

// ════════════════════════════════════════════════════════════════════
//  TOOLS
// ════════════════════════════════════════════════════════════════════

// 1. EMIT INVOICE ────────────────────────────────────────────────────
server.tool(
  "emit_invoice",
  "Emit an Argentine electronic invoice (factura electrónica) via ARCA/AFIP. Returns CAE, PDF URL, and QR code.",
  {
    cuit_emisor: z.string().describe("CUIT of the invoice issuer (11 digits)"),
    punto_de_venta: z.number().describe("Point of sale number (punto de venta)"),
    tipo_comprobante: z.enum(["A", "B", "C", "M", "E", "NCA", "NCB", "NCC", "NCE", "NCM", "NDA", "NDB", "NDC", "NDE", "NDM"]).describe("Invoice type: A (IVA discriminado), B (consumidor final), C (exento), M (monotributo), E (exportación), NCA/NCB/NCC/NCE/NCM (nota de crédito), NDA/NDB/NDC/NDE/NDM (nota de débito)"),
    receptor: z.object({
      tipo_doc: z.enum(["CUIT", "CUIL", "DNI", "PASAPORTE", "SIN_IDENTIFICAR"]),
      nro_doc: z.string().describe("Document number"),
      razon_social: z.string().optional().describe("Business name"),
      condicion_iva: z.string().optional().describe("IVA condition: Responsable Inscripto, Monotributo, Consumidor Final, Exento")
    }).describe("Invoice recipient"),
    conceptos: z.array(z.object({
      descripcion: z.string().describe("Item description"),
      precio: z.number().describe("Unit price in ARS"),
      cantidad: z.number().optional().default(1),
      alicuota_iva: z.number().optional().default(21).describe("IVA rate: 21, 10.5, 27, 0, etc.")
    })).describe("Line items"),
    moneda: z.string().optional().default("PES").describe("Currency code (PES for ARS)"),
    fecha_servicio: z.string().optional().describe("Service date (YYYY-MM-DD) for service invoices")
  },
  async (args) => {
    const result = await api("POST", "/v1/invoices", args);
    const tipo = args.tipo_comprobante || 'C';
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          success: true,
          id: result.id,
          cae: result.cae,
          numero_factura: result.numero_factura,
          punto_de_venta: result.punto_de_venta,
          tipo_comprobante: tipo,
          url_pdf: result.url_pdf,
          url_qr: result.url_qr,
          vencimiento_cae: result.cae_vencimiento,
          message: `✅ Factura ${tipo} emitida. CAE: ${result.cae}. PDF: ${result.url_pdf}`
        }, null, 2)
      }]
    };
  }
);

// 2. GET INVOICE ─────────────────────────────────────────────────────
server.tool(
  "get_invoice",
  "Get details of a previously emitted invoice by its ID.",
  {
    invoice_id: z.string().describe("The invoice ID returned by emit_invoice")
  },
  async (args) => {
    const result = await api("GET", `/v1/invoices/${args.invoice_id}`);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 3. LIST INVOICES ───────────────────────────────────────────────────
server.tool(
  "list_invoices",
  "List recent invoices for the authenticated tenant.",
  {
    limit: z.number().optional().default(10).describe("Number of invoices to return"),
    offset: z.number().optional().default(0).describe("Offset for pagination")
  },
  async (args) => {
    const params = new URLSearchParams({ limit: String(args.limit), offset: String(args.offset) });
    const result = await api("GET", `/v1/invoices?${params}`);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 4. LIST CREDENTIALS ────────────────────────────────────────────────
server.tool(
  "list_credentials",
  "List all digital certificates (credentials) registered for the authenticated CUIT.",
  {},
  async () => {
    const result = await api("GET", "/v1/credentials");
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 5. CREATE CREDENTIAL ───────────────────────────────────────────────
server.tool(
  "create_credential",
  "Generate a new RSA keypair and Certificate Signing Request (CSR) for ARCA/AFIP. The CSR must be submitted to AFIP to obtain a digital certificate.",
  {
    cuit: z.string().describe("CUIT to create the credential for (11 digits)"),
    organization: z.string().describe("Organization name"),
    common_name: z.string().optional().describe("Common name for the certificate")
  },
  async (args) => {
    const result = await api("POST", "/v1/credentials", args);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          success: true,
          id: result.id,
          csr: result.csr,
          message: "✅ Key pair and CSR generated. Submit the CSR to AFIP to obtain your digital certificate, then upload it with upload_certificate."
        }, null, 2)
      }]
    };
  }
);

// 6. CHECK DELEGATION STATUS ─────────────────────────────────────────
server.tool(
  "check_delegation",
  "Check the ARCA/AFIP delegation status for the authenticated CUIT. Delegation is required before emitting invoices.",
  {},
  async () => {
    const result = await api("GET", "/v1/delegations/status");
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 7. REQUEST DELEGATION ──────────────────────────────────────────────
server.tool(
  "request_delegation",
  "Request ARCA/AFIP delegation for electronic invoicing. This authorizes KeyCAE (the representative) to emit invoices on your behalf. If Hermes auto-delegation is enabled, this is processed automatically.",
  {
    cuit: z.string().describe("CUIT to delegate (11 digits)"),
    organization: z.string().describe("Organization name")
  },
  async (args) => {
    const result = await api("POST", "/v1/delegations", args);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          success: true,
          delegation_id: result.delegation_id,
          status: result.status,
          message: result.status === "pending_auto" 
            ? "✅ Delegation request submitted. Hermes will process it automatically via ARCA."
            : "✅ Delegation request submitted. Awaiting manual acceptance in ARCA."
        }, null, 2)
      }]
    };
  }
);

// 8. LOOKUP TAXPAYER ─────────────────────────────────────────────────
server.tool(
  "lookup_taxpayer",
  "Look up an Argentine taxpayer (contribuyente) by CUIT in the AFIP registry. Returns name, tax condition, and active activities.",
  {
    cuit: z.string().describe("CUIT to look up (11 digits)")
  },
  async (args) => {
    const result = await api("GET", `/v1/taxpayers/${args.cuit}`);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 9. GET BILLING STATUS ──────────────────────────────────────────────
server.tool(
  "get_billing_status",
  "Check the current billing plan, monthly usage, and remaining invoice quota.",
  {},
  async () => {
    const result = await api("GET", "/v1/billing/status");
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 10. HEALTH CHECK ───────────────────────────────────────────────────
server.tool(
  "keycae_health",
  "Check if the KeyCAE API is healthy and reachable.",
  {},
  async () => {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(data, null, 2)
      }]
    };
  }
);

// 11. LIST PUNTOS DE VENTA ──────────────────────────────────────────
server.tool(
  "list_puntos_de_venta",
  "List available points of sale (puntos de venta) for the authenticated CUIT. Shows which ones are enabled for electronic invoicing.",
  {},
  async () => {
    const result = await api("GET", "/v1/pos");
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 12. CHECK EMISSION CAPABILITY ──────────────────────────────────────
server.tool(
  "check_emission_capability",
  "Check what types of invoices a CUIT can emit. Returns compatible invoice types based on tax condition (Monotributo, RI, Exento).",
  {
    cuit: z.string().describe("CUIT to check (11 digits)")
  },
  async (args) => {
    const taxpayer = await api("GET", `/v1/taxpayers/${args.cuit}`);
    
    const condition = taxpayer.condicion_iva || taxpayer.estado || '';
    let compatibleTypes: string[] = [];
    let recommendation = '';
    
    if (condition.toLowerCase().includes('monotributo')) {
      compatibleTypes = ['C', 'M'];
      recommendation = 'Como Monotributista, podés emitir Factura C (exenta) o Factura M (monotributo). NO podés emitir Factura A o B.';
    } else if (condition.toLowerCase().includes('responsable inscripto') || condition.toLowerCase().includes('ri')) {
      compatibleTypes = ['A', 'B'];
      recommendation = 'Como Responsable Inscripto, podés emitir Factura A (IVA discriminado) o Factura B (consumidor final).';
    } else if (condition.toLowerCase().includes('exento')) {
      compatibleTypes = ['C'];
      recommendation = 'Como Exento, solo podés emitir Factura C (exenta).';
    } else {
      compatibleTypes = ['C'];
      recommendation = 'No se pudo determinar la condición impositiva. Se recomienda Factura C por defecto.';
    }
    
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          cuit: args.cuit,
          condicion_iva: condition,
          compatible_types: compatibleTypes,
          recommendation,
          tip: 'Usá estos tipos al emitir facturas con emit_invoice para evitar errores de ARCA.'
        }, null, 2)
      }]
    };
  }
);

// ════════════════════════════════════════════════════════════════════
//  RESOURCES (for agent context)
// ════════════════════════════════════════════════════════════════════

server.resource(
  "keycae-docs",
  "keycae://docs",
  async () => ({
    contents: [{
      uri: "keycae://docs",
      mimeType: "text/markdown",
      text: `# KeyCAE - Argentine Electronic Invoicing API

## Quick Start
1. Get API key at https://keycae.ar/dashboard
2. Set KEYCAE_API_KEY environment variable
3. Use tools: emit_invoice, check_delegation, list_credentials

## Invoice Types
- **Factura A**: IVA discriminado (Responsable Inscripto → Responsable Inscripto)
- **Factura B**: IVA incluido (Responsable Inscripto → Consumidor Final)
- **Factura C**: Exento (no genera IVA)
- **Factura M**: Monotributo
- **Factura E**: Exportación

## Common Workflow
1. check_delegation → Ensure CUIT is delegated
2. list_credentials → Verify certificate is active
3. emit_invoice → Issue the invoice
4. get_invoice → Retrieve details

## ARCA/AFIP Notes
- CUIT must delegate electronic invoicing to KeyCAE's representative CUIT
- Delegation is automatic if Hermes is enabled
- Certificates must be renewed annually
- Punto de venta must be registered for electronic invoicing

## Pricing
- Free: 50 invoices/month
- Developer: 1,000 invoices/month ($9,900 ARS)
- Platform: Unlimited ($59,000 ARS)
`
    }]
  })
);

// ════════════════════════════════════════════════════════════════════
//  START
// ════════════════════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 KeyCAE MCP Server running (stdio)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
