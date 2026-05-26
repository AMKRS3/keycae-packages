"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyCaeClient = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class KeyCaeClient {
    constructor(apiKey, baseUrl = 'https://api.keycae.ar') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
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
            let errorDetails = '';
            try {
                errorDetails = await response.text();
            }
            catch (e) { }
            throw new Error(`KeyCAE API Error (${response.status}): ${errorDetails || response.statusText}`);
        }
        return response.json();
    }
    /**
     * Consultar Contribuyente en Padrón ARCA
     */
    async getTaxpayer(cuit) {
        return this.request('GET', `/v1/taxpayers/${cuit}`);
    }
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
    /**
     * Crear Bóveda de Claves KMS & Generar CSR
     */
    async createCredential(data) {
        return this.request('POST', '/v1/credentials', data);
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
    /**
     * Emitir Factura Electrónica Homologada (CAE)
     */
    async emitInvoice(data, idempotencyKey) {
        return this.request('POST', '/v1/invoices', data, idempotencyKey);
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
    /**
     * Obtener Consumos y Estado del Plan (Billing)
     */
    async getBillingStatus() {
        return this.request('GET', '/v1/billing/status');
    }
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
}
exports.KeyCaeClient = KeyCaeClient;
