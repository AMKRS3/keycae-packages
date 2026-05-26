export interface TaxpayerResponse {
    cuit: string;
    nombre: string;
    tipo_persona: string;
    categoria_monotributo?: string;
    es_iva_inscripto: boolean;
    estado: string;
}
export interface InvoiceReceptor {
    tipo_doc: 'DNI' | 'CUIT' | 'CUIL' | 'PASAPORTE';
    nro_doc: string;
}
export interface InvoiceItem {
    descripcion: string;
    precio: number;
}
export interface InvoiceInput {
    cuit_emisor: string;
    punto_de_venta: number;
    tipo_comprobante: 'A' | 'B' | 'C' | 'M';
    receptor: InvoiceReceptor;
    conceptos: InvoiceItem[];
    brand_logo_url?: string;
    brand_color?: string;
}
export interface InvoiceResponse {
    id: string;
    cuit_emisor: string;
    punto_de_venta: number;
    tipo_comprobante: string;
    numero_factura: number;
    cae: string;
    cae_vencimiento: string;
    url_pdf: string;
    url_qr: string;
    total: number;
}
export interface BillingStatusResponse {
    cuit: string;
    plan: string;
    invoicesEmitted: number;
    monthlyLimit: number;
    status: string;
    billingPeriodStart: string;
    percentageConsumed: number;
    overageCost: number;
    currency: string;
}
export interface TelegramSettingsInput {
    telegram_bot_token: string;
    telegram_chat_id: string;
}
export interface TelegramSettingsResponse {
    telegram_bot_token: string;
    telegram_chat_id: string;
    has_credentials: boolean;
}
export interface DelegationInput {
    cuit: string;
    organization: string;
}
export interface DelegationResponse {
    id: string;
    status: 'pending' | 'accepted' | 'rejected';
    cuit: string;
    organization: string;
    representativeCuit: string;
    representativeOrg: string;
    createdAt: string;
    acceptedAt?: string;
}
export interface KmsCredentialInput {
    cuit: string;
    organization: string;
    common_name?: string;
}
export interface KmsCredentialResponse {
    id: string;
    cuit: string;
    organization: string;
    common_name: string;
    status: string;
    csr_pem?: string;
    created_at: string;
}
export interface KmsImportInput {
    cuit: string;
    organization: string;
    certificate: string;
    private_key: string;
}
export declare class KeyCaeClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, baseUrl?: string);
    private request;
    /**
     * Consultar Contribuyente en Padrón ARCA
     */
    getTaxpayer(cuit: string): Promise<TaxpayerResponse>;
    /**
     * Registrar / Iniciar Direct Delegation
     */
    createDelegation(data: DelegationInput): Promise<DelegationResponse>;
    /**
     * Consultar Estado de Delegación Directa
     */
    checkDelegationStatus(): Promise<DelegationResponse>;
    /**
     * Crear Bóveda de Claves KMS & Generar CSR
     */
    createCredential(data: KmsCredentialInput): Promise<KmsCredentialResponse>;
    /**
     * Importar Credenciales de Firma Existentes (.key y .crt)
     */
    importCredential(data: KmsImportInput): Promise<KmsCredentialResponse>;
    /**
     * Activar Bóveda KMS con Certificado ARCA (.crt)
     */
    activateCredential(id: string, certificatePem: string): Promise<any>;
    /**
     * Eliminar Bóveda de Claves KMS de forma física y segura
     */
    deleteCredential(id: string): Promise<any>;
    /**
     * Emitir Factura Electrónica Homologada (CAE)
     */
    emitInvoice(data: InvoiceInput, idempotencyKey?: string): Promise<InvoiceResponse>;
    /**
     * Descargar PDF de Factura (Retorna el Stream / ArrayBuffer)
     */
    getInvoicePdfBuffer(id: string): Promise<Buffer>;
    /**
     * Obtener Consumos y Estado del Plan (Billing)
     */
    getBillingStatus(): Promise<BillingStatusResponse>;
    /**
     * Obtener Ajustes de Telegram por Tenant
     */
    getTelegramSettings(): Promise<TelegramSettingsResponse>;
    /**
     * Guardar / Actualizar Ajustes de Telegram
     */
    saveTelegramSettings(data: TelegramSettingsInput): Promise<any>;
}
