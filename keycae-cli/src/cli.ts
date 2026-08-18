import { Command } from 'commander';
import inquirer from 'inquirer';
import fetch from 'node-fetch';
import { randomUUID } from 'node:crypto';
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
    baseUrl: 'https://keycae.ar',
  };
}

function saveConfig(config: CliConfig) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

async function apiRequest(method: string, path: string, body?: any, idempotencyKey?: string): Promise<any> {
  const config = loadConfig();
  if (!config.apiKey) {
    console.error('❌ API Key no configurada. Ejecutá primero `keycae init`.');
    process.exit(1);
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const res = await fetch(`${config.baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorData: any;
    try {
      errorData = await res.json();
    } catch {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const msg = errorData?.error?.message || JSON.stringify(errorData);
    const hint = errorData?.error?.ai_action_hint || '';
    throw new Error(`${msg}${hint ? `\n💡 Hint: ${hint}` : ''}`);
  }

  return res.json();
}

program
  .name('keycae')
  .description('KeyCAE.ar — CLI para facturación electrónica ARCA (ex AFIP)')
  .version('1.1.0');

// ── INIT ────────────────────────────────────────────────────────────
program
  .command('init')
  .description('Configurar la conexión con KeyCAE.ar')
  .action(async () => {
    const config = loadConfig();
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'API Key de KeyCAE.ar:',
        default: config.apiKey || 'sk_test_...',
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Base URL de la API:',
        default: config.baseUrl || 'https://keycae.ar',
      },
    ]);
    saveConfig(answers);
    console.log('\n✅ Configuración guardada en ~/.keycae-cli-config.json');
  });

// ── TAXPAYERS ───────────────────────────────────────────────────────
program
  .command('taxpayers <cuit>')
  .description('Consultar un CUIT en el padrón de ARCA')
  .action(async (cuit: string) => {
    console.log(`🔍 Consultando CUIT ${cuit}...`);
    try {
      const data = await apiRequest('GET', `/v1/taxpayers/${cuit}`);
      console.log('\n📋 --- Datos Impositivos ---');
      console.log(`👤 Razón Social: ${data.nombre}`);
      console.log(`🆔 CUIT: ${data.cuit}`);
      console.log(`🏢 Tipo Persona: ${data.tipo_persona}`);
      console.log(`📊 Monotributo Cat: ${data.categoria_monotributo || 'No Monotributista'}`);
      console.log(`⚖️  IVA Inscripto: ${data.es_iva_inscripto ? 'SÍ' : 'NO'}`);
      console.log(`📊 Condición IVA: ${data.condicion_iva || 'N/A'}`);
      if (data.domicilio_fiscal) {
        const dom = data.domicilio_fiscal;
        const dir = [dom.direccion, dom.localidad, dom.provincia].filter(Boolean).join(', ');
        console.log(`🏠 Domicilio Fiscal: ${dir || 'N/A'} (CP: ${dom.cod_postal || 'N/A'})`);
      }
      console.log(`📌 Estado Fiscal: ${data.estado}`);
      console.log('----------------------------\n');
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

// ── INVOICE EMIT ────────────────────────────────────────────────────
program
  .command('invoice-emit')
  .description('Emitir factura electrónica')
  .option('--cbtes <comprobantes>', 'Comprobantes asociados (formato: TIPO-POS-NUMERO, separados por comas, ej: C-1-421)')
  .action(async (options) => {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'cuitEmisor', message: 'CUIT Emisor:', default: '20254459306' },
      { type: 'input', name: 'cuitReceptor', message: 'DNI/CUIT Receptor:', default: '35123456' },
      {
        type: 'list',
        name: 'tipo',
        message: 'Tipo de comprobante:',
        choices: [
          { name: 'C — Factura C (Monotributo/Exento)', value: 'C' },
          { name: 'A — Factura A (RI → RI)', value: 'A' },
          { name: 'B — Factura B (RI → CF)', value: 'B' },
          { name: 'M — Factura M', value: 'M' },
          { name: 'E — Factura E (Exportación)', value: 'E' },
          { name: 'NCA — Nota de Crédito A', value: 'NCA' },
          { name: 'NCB — Nota de Crédito B', value: 'NCB' },
          { name: 'NCC — Nota de Crédito C', value: 'NCC' },
          { name: 'NCE — Nota de Crédito E', value: 'NCE' },
          { name: 'NCM — Nota de Crédito M', value: 'NCM' },
          { name: 'NDA — Nota de Débito A', value: 'NDA' },
          { name: 'NDB — Nota de Débito B', value: 'NDB' },
          { name: 'NDC — Nota de Débito C', value: 'NDC' },
          { name: 'NDE — Nota de Débito E', value: 'NDE' },
          { name: 'NDM — Nota de Débito M', value: 'NDM' },
        ],
      },
      { type: 'input', name: 'precio', message: 'Monto:', default: '150000' },
      { type: 'input', name: 'descripcion', message: 'Descripción:', default: 'Servicios profesionales' },
    ]);

    const isNote = ['NCA', 'NCB', 'NCC', 'NCE', 'NCM', 'NDA', 'NDB', 'NDC', 'NDE', 'NDM'].includes(answers.tipo);
    let cbtesFlag = options.cbtes;

    if (isNote && !cbtesFlag) {
      const answersNote = await inquirer.prompt([
        {
          type: 'input',
          name: 'cbtesInput',
          message: 'Comprobantes asociados (requerido para NC/ND, formato: TIPO-POS-NUMERO, ej: C-1-1234):',
          validate: (val) => val.trim().length > 0 ? true : 'Debe ingresar al menos un comprobante asociado.',
        }
      ]);
      cbtesFlag = answersNote.cbtesInput;
    }

    let cbtes_asociados: any[] | undefined = undefined;
    if (cbtesFlag) {
      cbtes_asociados = cbtesFlag.split(',').map((item: string) => {
        const parts = item.trim().split('-');
        return {
          tipo: parts[0],
          punto_de_venta: parseInt(parts[1], 10) || 1,
          numero: parseInt(parts[2], 10) || 0
        };
      });
    }

    console.log('🚀 Emitiendo factura...');
    try {
      const data = await apiRequest('POST', '/v1/invoices', {
        cuit_emisor: answers.cuitEmisor,
        punto_de_venta: 1,
        tipo_comprobante: answers.tipo,
        receptor: { 
          tipo_doc: answers.cuitReceptor.length === 11 ? 'CUIT' : 'DNI', 
          nro_doc: answers.cuitReceptor 
        },
        conceptos: [{ descripcion: answers.descripcion, precio: parseFloat(answers.precio) }],
        ...(cbtes_asociados ? { cbtes_asociados } : {})
      }, randomUUID()); // Obligatorio en producción: sin este header la emisión falla con 400

      console.log('\n✅ --- COMPROBANTE AUTORIZADO ---');
      console.log(`📄 Nro: ${answers.tipo}-0001-${data.numero_factura.toString().padStart(8, '0')}`);
      console.log(`🔐 CAE: ${data.cae}`);
      console.log(`📅 Vencimiento: ${data.cae_vencimiento}`);
      console.log(`🔗 PDF: ${data.url_pdf}`);
      console.log(`🔍 QR: ${data.url_qr}`);
      console.log('----------------------------------\n');
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

// ── INVOICES LIST ───────────────────────────────────────────────────
program
  .command('invoices')
  .description('Listar facturas recientes')
  .option('-l, --limit <n>', 'Cantidad de facturas', '10')
  .option('-o, --offset <n>', 'Offset para paginación', '0')
  .action(async (opts) => {
    console.log('📄 Listando facturas...');
    try {
      const data = await apiRequest('GET', `/v1/invoices?limit=${opts.limit}&offset=${opts.offset}`);
      const invoices = data.invoices || data;
      if (!invoices.length) {
        console.log('No hay facturas.');
        return;
      }
      console.log(`\n📋 ${invoices.length} factura(s):\n`);
      for (const inv of invoices) {
        console.log(`  ${inv.tipo_comprobante}-${String(inv.punto_de_venta).padStart(4, '0')}-${String(inv.numero_factura).padStart(8, '0')}  |  CAE: ${inv.cae}  |  $${inv.total}  |  ${inv.id}`);
      }
      console.log();
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

// ── INVOICE GET ─────────────────────────────────────────────────────
program
  .command('invoice <id>')
  .description('Ver detalles de una factura por ID')
  .action(async (id: string) => {
    try {
      const data = await apiRequest('GET', `/v1/invoices/${id}`);
      console.log('\n📋 --- Detalle de Factura ---');
      console.log(JSON.stringify(data, null, 2));
      console.log('-----------------------------\n');
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

// ── CREDENTIALS ─────────────────────────────────────────────────────
const credsCmd = program
  .command('credentials')
  .description('Gestionar credenciales digitales (KMS)');

credsCmd
  .command('list')
  .description('Listar credenciales registradas')
  .action(async () => {
    try {
      const data = await apiRequest('GET', '/v1/credentials');
      if (!data.length) {
        console.log('No hay credenciales registradas.');
        return;
      }
      console.log(`\n🔑 ${data.length} credencial(es):\n`);
      for (const c of data) {
        console.log(`  ${c.id}  |  ${c.cuit}  |  ${c.organization}  |  ${c.status}`);
      }
      console.log();
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

credsCmd
  .command('create')
  .description('Generar nuevo par de claves RSA + CSR')
  .action(async () => {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'cuit', message: 'CUIT (11 dígitos):' },
      { type: 'input', name: 'organization', message: 'Organización:' },
    ]);
    try {
      const data = await apiRequest('POST', '/v1/credentials', answers);
      console.log('\n✅ Credencial creada');
      console.log(`ID: ${data.id}`);
      if (data.csr) console.log(`CSR:\n${data.csr}`);
      console.log();
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

// ── DELEGATION ──────────────────────────────────────────────────────
program
  .command('delegation')
  .description('Consultar estado de delegación ARCA')
  .action(async () => {
    try {
      const data = await apiRequest('GET', '/v1/delegations/status');
      console.log('\n📋 --- Estado de Delegación ---');
      console.log(`📌 Estado: ${data.status}`);
      console.log(`🆔 CUIT: ${data.cuit}`);
      console.log(`🏢 Org: ${data.organization}`);
      console.log(`👤 Representante: ${data.representativeCuit} (${data.representativeOrg})`);
      console.log('-------------------------------\n');
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

// ── DELEGATION REQUEST ──────────────────────────────────────────────
program
  .command('delegation-request')
  .description('Solicitar delegación ARCA para facturación electrónica')
  .action(async () => {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'cuit', message: 'CUIT (11 dígitos):' },
      { type: 'input', name: 'organization', message: 'Organización:' },
    ]);
    try {
      const data = await apiRequest('POST', '/v1/delegations', answers);
      console.log(`\n✅ Delegación solicitada. Estado: ${data.status}`);
      console.log(`ID: ${data.delegation_id || data.id}\n`);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

// ── BILLING ─────────────────────────────────────────────────────────
program
  .command('billing')
  .description('Consultar estado del plan y consumo')
  .action(async () => {
    try {
      const data = await apiRequest('GET', '/v1/billing/status');
      console.log('\n💳 --- Plan de Facturación ---');
      console.log(`📋 Plan: ${data.plan}`);
      console.log(`📊 Emitidas: ${data.invoicesEmitted} / ${data.monthlyLimit}`);
      console.log(`📈 Consumo: ${data.percentageConsumed}%`);
      console.log(`💰 Estado: ${data.status}`);
      console.log('-------------------------------\n');
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

// ── POS (Puntos de Venta) ──────────────────────────────────────────
program
  .command('pos')
  .description('Listar puntos de venta habilitados')
  .action(async () => {
    try {
      const data = await apiRequest('GET', '/v1/pos');
      if (!data.length) {
        console.log('No hay puntos de venta configurados.');
        return;
      }
      console.log(`\n📍 ${data.length} punto(s) de venta:\n`);
      for (const p of data) {
        console.log(`  #${p.number}  |  ${p.type}  |  ${p.status}`);
      }
      console.log();
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  });

// ── HEALTH ──────────────────────────────────────────────────────────
program
  .command('health')
  .description('Health check de la API')
  .action(async () => {
    const config = loadConfig();
    try {
      const res = await fetch(`${config.baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      console.log(`\n✅ API Status: ${JSON.stringify(data)}\n`);
    } catch (error: any) {
      console.error(`❌ API no disponible: ${error.message}`);
    }
  });

program.parse(process.argv);
