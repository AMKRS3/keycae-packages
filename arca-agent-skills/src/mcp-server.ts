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
  name: "arca-keycae",
  version: "1.0.0"
});

// ════════════════════════════════════════════════════════════════════
//  TOOLS (Spanish-named for agent integration)
// ════════════════════════════════════════════════════════════════════

// 1. VALIDAR CUIT
server.tool(
  "validar_cuit",
  "Consultar la condición fiscal y validez de un CUIT en el padrón de ARCA (ex AFIP).",
  { cuit: z.string().describe("CUIT de 11 dígitos sin guiones") },
  async (args) => {
    const result = await api("GET", `/v1/taxpayers/${args.cuit}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// 2. REGISTRAR DELEGACION
server.tool(
  "registrar_delegacion",
  "Iniciar la delegación directa (Zero-Certificate) del CUIT en KeyCAE.",
  {
    cuit: z.string().describe("CUIT de 11 dígitos a delegar"),
    organization: z.string().describe("Razón social o nombre comercial")
  },
  async (args) => {
    const result = await api("POST", "/v1/delegations", args);
    return { content: [{ type: "text" as const, text: JSON.stringify({ success: true, ...result }, null, 2) }] };
  }
);

// 3. CONSULTAR DELEGACION
server.tool(
  "consultar_delegacion",
  "Verificar el estado de la delegación ARCA del CUIT autenticado.",
  {},
  async () => {
    const result = await api("GET", "/v1/delegations/status");
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// 4. EMITIR FACTURA
server.tool(
  "emitir_factura",
  "Emitir factura electrónica ante ARCA/AFIP. Retorna CAE, PDF y QR.",
  {
    cuit_emisor: z.string().describe("CUIT emisor (11 dígitos)"),
    punto_de_venta: z.number().describe("Punto de venta"),
    tipo_comprobante: z.enum(["A", "B", "C", "M", "E"]).describe("Tipo: A (IVA discriminado), B (consumidor final), C (exento), M (monotributo), E (exportación)"),
    receptor: z.object({
      tipo_doc: z.enum(["CUIT", "CUIL", "DNI", "PASAPORTE", "SIN_IDENTIFICAR"]),
      nro_doc: z.string(),
      razon_social: z.string().optional(),
      condicion_iva: z.string().optional()
    }),
    conceptos: z.array(z.object({
      descripcion: z.string(),
      precio: z.number(),
      cantidad: z.number().optional().default(1),
      alicuota_iva: z.number().optional().default(21)
    })),
    moneda: z.string().optional().default("PES"),
    fecha_servicio: z.string().optional().describe("Fecha del servicio (YYYY-MM-DD)")
  },
  async (args) => {
    const result = await api("POST", "/v1/invoices", args);
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          success: true,
          id: result.id,
          cae: result.cae,
          numero_factura: result.numero_factura,
          url_pdf: result.url_pdf,
          url_qr: result.url_qr,
          message: `✅ Factura emitida. CAE: ${result.cae}. PDF: ${result.url_pdf}`
        }, null, 2)
      }]
    };
  }
);

// 5. CONSULTAR FACTURA
server.tool(
  "consultar_factura",
  "Obtener detalles de una factura emitida previamente por su ID.",
  { invoice_id: z.string().describe("ID de la factura") },
  async (args) => {
    const result = await api("GET", `/v1/invoices/${args.invoice_id}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// 6. LISTAR FACTURAS
server.tool(
  "listar_facturas",
  "Listar facturas recientes del tenant autenticado.",
  {
    limit: z.number().optional().default(10),
    offset: z.number().optional().default(0)
  },
  async (args) => {
    const params = new URLSearchParams({ limit: String(args.limit), offset: String(args.offset) });
    const result = await api("GET", `/v1/invoices?${params}`);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// 7. LISTAR CREDENCIALES
server.tool(
  "listar_credenciales",
  "Listar certificados digitales registrados para el CUIT autenticado.",
  {},
  async () => {
    const result = await api("GET", "/v1/credentials");
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// 8. CREAR CREDENCIAL
server.tool(
  "crear_credencial",
  "Generar par de claves RSA y CSR para ARCA/AFIP.",
  {
    cuit: z.string().describe("CUIT (11 dígitos)"),
    organization: z.string().describe("Nombre de organización"),
    common_name: z.string().optional()
  },
  async (args) => {
    const result = await api("POST", "/v1/credentials", args);
    return { content: [{ type: "text" as const, text: JSON.stringify({ success: true, ...result }, null, 2) }] };
  }
);

// 9. CONSULTAR EMISIÓN
server.tool(
  "consultar_emision",
  "Verificar qué tipos de factura puede emitir un CUIT según su condición fiscal.",
  { cuit: z.string().describe("CUIT a consultar (11 dígitos)") },
  async (args) => {
    const taxpayer = await api("GET", `/v1/taxpayers/${args.cuit}`);
    const condition = taxpayer.condicion_iva || taxpayer.estado || '';
    let compatibleTypes: string[] = [];
    let recommendation = '';

    if (condition.toLowerCase().includes('monotributo')) {
      compatibleTypes = ['C', 'M'];
      recommendation = 'Monotributista: Factura C o M. NO puede emitir A o B.';
    } else if (condition.toLowerCase().includes('responsable inscripto')) {
      compatibleTypes = ['A', 'B'];
      recommendation = 'Responsable Inscripto: Factura A (IVA discriminado) o B (consumidor final).';
    } else if (condition.toLowerCase().includes('exento')) {
      compatibleTypes = ['C'];
      recommendation = 'Exento: solo Factura C.';
    } else {
      compatibleTypes = ['C'];
      recommendation = 'Condición no determinada. Se recomienda Factura C.';
    }

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ cuit: args.cuit, condicion_iva: condition, compatible_types: compatibleTypes, recommendation }, null, 2)
      }]
    };
  }
);

// 10. ESTADO DE FACTURACIÓN
server.tool(
  "estado_facturacion",
  "Consultar plan actual, consumo mensual y cuota restante de facturas.",
  {},
  async () => {
    const result = await api("GET", "/v1/billing/status");
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// 11. LISTAR PUNTOS DE VENTA
server.tool(
  "listar_puntos_de_venta",
  "Listar puntos de venta habilitados para facturación electrónica.",
  {},
  async () => {
    const result = await api("GET", "/v1/pos");
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  }
);

// 12. HEALTH CHECK
server.tool(
  "health_check",
  "Verificar que la API de KeyCAE esté disponible.",
  {},
  async () => {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  }
);

// ════════════════════════════════════════════════════════════════════
//  START
// ════════════════════════════════════════════════════════════════════

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 ARCA KeyCAE Agent Skills MCP Server running (stdio)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
