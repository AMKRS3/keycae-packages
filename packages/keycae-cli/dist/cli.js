"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const program = new commander_1.Command();
const CONFIG_FILE = path.join(process.env.HOME || '.', '.keycae-cli-config.json');
function loadConfig() {
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        }
        catch (e) { }
    }
    return {
        apiKey: '',
        baseUrl: 'https://api.keycae.ar',
    };
}
function saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}
program
    .name('keycae')
    .description('KeyCAE.ar impositive CLI tool for ARCA (ex AFIP)')
    .version('1.0.0');
// Command: Init Configuration
program
    .command('init')
    .description('Configurar e inicializar la conexión con el servidor KeyCAE')
    .action(async () => {
    const config = loadConfig();
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'apiKey',
            message: 'Introduce tu API Key de KeyCAE.ar:',
            default: config.apiKey || 'sk_test_public_sandbox_cuit_20254459306',
        },
        {
            type: 'input',
            name: 'baseUrl',
            message: 'Base URL de la API de KeyCAE:',
            default: config.baseUrl || 'https://api.keycae.ar',
        },
    ]);
    saveConfig(answers);
    console.log('\n✅ ¡Configuración guardada de forma segura en ~/.keycae-cli-config.json!');
});
// Command: Taxpayers Padrón Check
program
    .command('taxpayers <cuit>')
    .description('Consultar un CUIT en el padrón oficial de ARCA')
    .action(async (cuit) => {
    const config = loadConfig();
    if (!config.apiKey) {
        console.error('❌ Error: No se ha detectado ninguna API Key configurada. Ejecuta primero `keycae init`.');
        process.exit(1);
    }
    console.log(`🔍 Consultando CUIT ${cuit} en padrón oficial de ARCA...`);
    try {
        const res = await (0, node_fetch_1.default)(`${config.baseUrl}/v1/taxpayers/${cuit}`, {
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
            },
        });
        if (!res.ok) {
            throw new Error(`Código de error HTTP: ${res.status}`);
        }
        const data = await res.json();
        console.log('\n📋 --- Datos Impositivos ---');
        console.log(`👤 Razón Social: ${data.nombre}`);
        console.log(`🆔 CUIT: ${data.cuit}`);
        console.log(`🏢 Tipo Persona: ${data.tipo_persona}`);
        console.log(`📊 Monotributo Cat: ${data.categoria_monotributo || 'No Monotributista'}`);
        console.log(`⚖️ IVA Inscripto: ${data.es_iva_inscripto ? 'SÍ' : 'NO'}`);
        console.log(`📌 Estado Fiscal: ${data.estado}`);
        console.log('----------------------------\n');
    }
    catch (error) {
        console.error(`❌ Error al consultar CUIT: ${error.message || error}`);
    }
});
// Command: Emit Mock Sandbox Invoice
program
    .command('invoice-emit')
    .description('Emitir factura electrónica de prueba en Sandbox')
    .action(async () => {
    const config = loadConfig();
    if (!config.apiKey) {
        console.error('❌ Error: API Key no configurada. Ejecuta primero `keycae init`.');
        process.exit(1);
    }
    const answers = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'cuitEmisor',
            message: 'CUIT Emisor (ej: 20254459306):',
            default: '20254459306',
        },
        {
            type: 'input',
            name: 'cuitReceptor',
            message: 'DNI/CUIT Receptor (ej: 35123456):',
            default: '35123456',
        },
        {
            type: 'input',
            name: 'precio',
            message: 'Monto de Consultoría / Servicio:',
            default: '150000',
        },
    ]);
    console.log('🚀 Despachando factura impositiva hacia ARCA a través de KeyCAE...');
    try {
        const res = await (0, node_fetch_1.default)(`${config.baseUrl}/v1/invoices`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'Idempotency-Key': `cli_invoice_${Date.now()}`,
            },
            body: JSON.stringify({
                cuit_emisor: answers.cuitEmisor,
                punto_de_venta: 1,
                tipo_comprobante: 'C',
                receptor: {
                    tipo_doc: 'DNI',
                    nro_doc: answers.cuitReceptor,
                },
                conceptos: [
                    {
                        descripcion: 'Consultoría e Integración Técnica API KeyCAE',
                        precio: parseFloat(answers.precio),
                    },
                ],
            }),
        });
        if (!res.ok) {
            throw new Error(`Código de error HTTP: ${res.status}`);
        }
        const data = await res.json();
        console.log('\n✅ --- COMPROBANTE AUTORIZADO EXITOSAMENTE ---');
        console.log(`📄 Nro Factura: C-0001-${data.numero_factura.toString().padStart(8, '0')}`);
        console.log(`🔐 Código CAE: ${data.cae}`);
        console.log(`📅 Vencimiento CAE: ${data.cae_vencimiento}`);
        console.log(`🔗 Descargar PDF: ${data.url_pdf}`);
        console.log(`🔍 Código QR AFIP: ${data.url_qr}`);
        console.log('---------------------------------------------\n');
    }
    catch (error) {
        console.error(`❌ Error en la emisión: ${error.message || error}`);
    }
});
program.parse(process.argv);
