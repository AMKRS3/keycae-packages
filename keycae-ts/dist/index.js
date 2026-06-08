"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyCaeClient = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
// ════════════════════════════════════════════════════════════════════
//  CLIENT
// ════════════════════════════════════════════════════════════════════
class KeyCaeClient {
    constructor(apiKey, baseUrl = 'https://keycae.ar') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }
    async request(method, path, body, idempotencyKey) {
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
        if (idempotencyKey) {
            headers['Idempotency-Key'] = idempotencyKey;
        }
        const response = await (0, node_fetch_1.default)(`${this.baseUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            }
            catch {
                const text = await response.text().catch(() => '');
                throw new Error(`KeyCAE API Error (${response.status}): ${text || response.statusText}`);
            }
            const message = errorData?.error?.message || JSON.stringify(errorData);
            const hint = errorData?.error?.ai_action_hint || '';
            throw new Error(`KeyCAE API Error (${response.status}): ${message}${hint ? ` [hint: ${hint}]` : ''}`);
        }
        return response.json();
    }
    // ── Taxpayers ─────────────────────────────────────────────────────
    /**
     * Consultar Contribuyente en Padrón ARCA
     */
    async getTaxpayer(cuit) {
        return this.request('GET', `/v1/taxpayers/${cuit}`);
    }
    /**
     * Verificar qué tipos de factura puede emitir un CUIT según su condición fiscal
     */
    async checkEmissionCapability(cuit) {
        const taxpayer = await this.getTaxpayer(cuit);
        const condition = taxpayer.condicion_iva || taxpayer.estado || '';
        let compatibleTypes = [];
        let recommendation = '';
        if (condition.toLowerCase().includes('monotributo')) {
            compatibleTypes = ['C', 'M'];
            recommendation = 'Como Monotributista, podés emitir Factura C (exenta) o Factura M (monotributo). NO podés emitir Factura A o B.';
        }
        else if (condition.toLowerCase().includes('responsable inscripto') || condition.toLowerCase().includes('ri')) {
            compatibleTypes = ['A', 'B'];
            recommendation = 'Como Responsable Inscripto, podés emitir Factura A (IVA discriminado) o Factura B (consumidor final).';
        }
        else if (condition.toLowerCase().includes('exento')) {
            compatibleTypes = ['C'];
            recommendation = 'Como Exento, solo podés emitir Factura C (exenta).';
        }
        else {
            compatibleTypes = ['C'];
            recommendation = 'No se pudo determinar la condición impositiva. Se recomienda Factura C por defecto.';
        }
        return {
            cuit,
            condicion_iva: condition,
            compatible_types: compatibleTypes,
            recommendation,
            tip: 'Usá estos tipos al emitir facturas con emitInvoice para evitar errores de ARCA.'
        };
    }
    // ── Delegations ───────────────────────────────────────────────────
    /**
     * Registrar / Iniciar Direct Delegation
     */
    async createDelegation(data) {
        return this.request('POST', '/v1/delegations', data);
    }
    /**
     * Consultar Estado de Delegación Directa
     */
    async checkDelegationStatus() {
        return this.request('GET', '/v1/delegations/status');
    }
    // ── Credentials (KMS) ────────────────────────────────────────────
    /**
     * Crear Bóveda de Claves KMS & Generar CSR
     */
    async createCredential(data) {
        return this.request('POST', '/v1/credentials', data);
    }
    /**
     * Listar Credenciales Digitales Registradas
     */
    async listCredentials() {
        return this.request('GET', '/v1/credentials');
    }
    /**
     * Importar Credenciales de Firma Existentes (.key y .crt)
     */
    async importCredential(data) {
        return this.request('POST', '/v1/credentials/import', data);
    }
    /**
     * Activar Bóveda KMS con Certificado ARCA (.crt)
     */
    async activateCredential(id, certificatePem) {
        return this.request('POST', `/v1/credentials/${id}/certificate`, { certificate: certificatePem });
    }
    /**
     * Eliminar Bóveda de Claves KMS de forma física y segura
     */
    async deleteCredential(id) {
        return this.request('DELETE', `/v1/credentials/${id}`);
    }
    // ── Invoices ──────────────────────────────────────────────────────
    /**
     * Emitir Factura Electrónica Homologada (CAE)
     */
    async emitInvoice(data, idempotencyKey) {
        return this.request('POST', '/v1/invoices', data, idempotencyKey);
    }
    /**
     * Obtener Detalles de una Factura por ID
     */
    async getInvoice(id) {
        return this.request('GET', `/v1/invoices/${id}`);
    }
    /**
     * Listar Facturas Recientes
     */
    async listInvoices(limit = 10, offset = 0) {
        const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
        return this.request('GET', `/v1/invoices?${params}`);
    }
    /**
     * Descargar PDF de Factura (Retorna el Stream / ArrayBuffer)
     */
    async getInvoicePdfBuffer(id) {
        const response = await (0, node_fetch_1.default)(`${this.baseUrl}/v1/invoices/${id}/pdf`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF (${response.status})`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
    // ── Puntos de Venta ───────────────────────────────────────────────
    /**
     * Listar Puntos de Venta Habilitados para Facturación Electrónica
     */
    async listPuntosDeVenta() {
        return this.request('GET', '/v1/pos');
    }
    // ── Billing ───────────────────────────────────────────────────────
    /**
     * Obtener Consumos y Estado del Plan (Billing)
     */
    async getBillingStatus() {
        return this.request('GET', '/v1/billing/status');
    }
    // ── Telegram Settings ─────────────────────────────────────────────
    /**
     * Obtener Ajustes de Telegram por Tenant
     */
    async getTelegramSettings() {
        return this.request('GET', '/v1/settings/telegram');
    }
    /**
     * Guardar / Actualizar Ajustes de Telegram
     */
    async saveTelegramSettings(data) {
        return this.request('POST', '/v1/settings/telegram', data);
    }
    // ── Health ────────────────────────────────────────────────────────
    /**
     * Health Check de la API
     */
    async health() {
        return this.request('GET', '/health');
    }
}
exports.KeyCaeClient = KeyCaeClient;
