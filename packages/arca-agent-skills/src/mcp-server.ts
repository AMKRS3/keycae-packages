import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/common/shared.js';
import { KeyCaeClient } from 'keycae-ts';

// Initialize the KeyCAE API Client
// Note: In runtime, the API key can be fetched from the environment variable KEYCAE_API_KEY
const apiKey = process.env.KEYCAE_API_KEY || 'sk_test_public_sandbox_cuit_20254459306';
const baseUrl = process.env.KEYCAE_API_URL || 'http://localhost:3000';
const client = new KeyCaeClient(apiKey, baseUrl);

const server = new Server(
  {
    name: 'arca-keycae-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools list
const TOOLS = [
  {
    name: 'validar_cuit',
    description: 'Consultar la condición fiscal y validez de un CUIT emisor o receptor en el padrón de ARCA (ex AFIP).',
    inputSchema: {
      type: 'object',
      properties: {
        cuit: {
          type: 'string',
          description: 'Identificador fiscal CUIT de 11 dígitos numéricos sin guiones (ej: "20123456789").',
          pattern: '^\\d{11}$',
        },
      },
      required: ['cuit'],
    },
  },
  {
    name: 'registrar_delegacion',
    description: 'Iniciar la delegación directa (Zero-Certificate) del CUIT en KeyCAE.',
    inputSchema: {
      type: 'object',
      properties: {
        cuit: {
          type: 'string',
          description: 'CUIT de 11 dígitos a delegar.',
          pattern: '^\\d{11}$',
        },
        organization: {
          type: 'string',
          description: 'Razón social o nombre comercial asociado al CUIT.',
        },
      },
      required: ['cuit', 'organization'],
    },
  },
  {
    name: 'consultar_delegacion',
    description: 'Consultar si la delegación directa del CUIT ya fue aceptada en el entorno fiscal de ARCA.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'emitir_factura',
    description: 'Emitir y autorizar una factura electrónica oficial (CAE) en ARCA a través de KeyCAE.',
    inputSchema: {
      type: 'object',
      properties: {
        cuit_emisor: {
          type: 'string',
          description: 'CUIT de 11 dígitos del contribuyente emisor.',
          pattern: '^\\d{11}$',
        },
        punto_de_venta: {
          type: 'number',
          description: 'Número de punto de venta habilitado en ARCA (ej: 1).',
        },
        tipo_comprobante: {
          type: 'string',
          enum: ['A', 'B', 'C', 'M'],
          description: 'Letra o tipo de comprobante fiscal.',
        },
        receptor: {
          type: 'object',
          properties: {
            tipo_doc: {
              type: 'string',
              enum: ['DNI', 'CUIT', 'CUIL', 'PASAPORTE'],
            },
            nro_doc: {
              type: 'string',
              description: 'Número de documento del receptor.',
            },
          },
          required: ['tipo_doc', 'nro_doc'],
        },
        conceptos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              descripcion: { type: 'string' },
              precio: { type: 'number' },
            },
            required: ['descripcion', 'precio'],
          },
        },
      },
      required: ['cuit_emisor', 'punto_de_venta', 'tipo_comprobante', 'receptor', 'conceptos'],
    },
  },
  {
    name: 'configurar_telegram',
    description: 'Vincular las credenciales del bot de Telegram para enrutar alertas transaccionales móviles.',
    inputSchema: {
      type: 'object',
      properties: {
        telegram_bot_token: {
          type: 'string',
          description: 'Token del bot otorgado por @BotFather.',
        },
        telegram_chat_id: {
          type: 'string',
          description: 'Identificador numérico del chat / canal para despachar alertas.',
        },
      },
      required: ['telegram_bot_token', 'telegram_chat_id'],
    },
  },
];

// Register list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Register call tool request handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'validar_cuit': {
        const { cuit } = args as { cuit: string };
        const data = await client.getTaxpayer(cuit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }
      case 'registrar_delegacion': {
        const { cuit, organization } = args as { cuit: string; organization: string };
        const data = await client.createDelegation({ cuit, organization });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }
      case 'consultar_delegacion': {
        const data = await client.checkDelegationStatus();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }
      case 'emitir_factura': {
        const invoiceInput = args as any;
        const data = await client.emitInvoice(invoiceInput);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }
      case 'configurar_telegram': {
        const { telegram_bot_token, telegram_chat_id } = args as {
          telegram_bot_token: string;
          telegram_chat_id: string;
        };
        const data = await client.saveTelegramSettings({
          telegram_bot_token,
          telegram_chat_id,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }
      default:
        throw new Error(`Tool ${name} not found.`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${error.message || error}`,
        },
      ],
    };
  }
});

// Run server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ARCA KeyCAE MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in MCP Server:', error);
  process.exit(1);
});
