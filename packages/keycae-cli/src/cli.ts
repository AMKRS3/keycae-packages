import { Command } from 'commander';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();
const CONFIG_FILE = path.join(process.env.HOME || '.', '.keycae-cli-config.json');

interface CliConfig {
  apiKey: string;
  baseUrl: string;
}

function loadConfig(): CliConfig {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch (e) {}
  }
  return {
    apiKey: '',
    baseUrl: 'https://api.keycae.ar',
  };
}

function saveConfig(config: CliConfig) {
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
    
    const answers = await inquirer.prompt([
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
      const res = await fetch(`${config.baseUrl}/v1/taxpayers/${cuit}`, {
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
    } catch (error: any) {
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

    const answers = await inquirer.prompt([
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
      const res = await fetch(`${config.baseUrl}/v1/invoices`, {
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
    } catch (error: any) {
      console.error(`❌ Error en la emisión: ${error.message || error}`);
    }
  });

program.parse(process.argv);
