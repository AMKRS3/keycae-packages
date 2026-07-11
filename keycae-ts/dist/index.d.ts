export interface DomicilioFiscal {
    direccion: string | null;
    localidad: string | null;
    cod_postal: string | null;
    provincia: string | null;
}
export interface TaxpayerResponse {
    cuit: string;
    nombre: string;
    tipo_persona: string;
    categoria_monotributo?: string;
    es_iva_inscripto: boolean;
    estado: string;
    condicion_iva?: string;
    actividades?: string[];
    domicilio_fiscal?: DomicilioFiscal;
}
export interface InvoiceReceptor {
    tipo_doc: 'DNI' | 'CUIT' | 'CUIL' | 'PASAPORTE' | 'SIN_IDENTIFICAR';
    nro_doc: string;
    razon_social?: string;
    condicion_iva?: string;
}
export interface InvoiceItem {
    descripcion: string;
    precio: number;
    cantidad?: number;
    alicuota_iva?: number;
}
export interface Tributo {
    id: number;
    descripcion: string;
    base_imponible: number;
    alicuota: number;
    importe: number;
}
export interface Opcional {
    id: string;
    valor: string;
}
export interface CondicionesIvaResponse {
    condiciones: {
        codigo: number;
        nombre: string;
    }[];
}
export interface InvoiceInput {
    cuit_emisor: string;
    punto_de_venta: number;
    tipo_comprobante: 'A' | 'B' | 'C' | 'M' | 'E' | 'NCA' | 'NCB' | 'NCC' | 'NCE' | 'NCM' | 'NDA' | 'NDB' | 'NDC' | 'NDE' | 'NDM' | 'FCE_A' | 'FCE_B' | 'FCE_C' | 'FCE_NDA' | 'FCE_NDB' | 'FCE_NDC' | 'FCE_NCA' | 'FCE_NCB' | 'FCE_NCC';
    receptor: InvoiceReceptor;
    conceptos: InvoiceItem[];
    tributos?: Tributo[];
    moneda?: string;
    moneda_cotizacion?: number;
    fecha_comprobante?: string;
    fecha_servicio_desde?: string;
    fecha_servicio_hasta?: string;
    fecha_vto_pago?: string;
    condicion_iva_receptor?: number;
    opcionales?: Opcional[];
    brand_logo_url?: string;
    brand_color?: string;
    cbtes_asociados?: {
        tipo: string | number;
        punto_de_venta: number;
        numero: number;
        cuit?: string;
        fecha?: string;
    }[];
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
    status: 'pending' | 'accepted' | 'rejected' | 'pending_auto';
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
export interface PuntoDeVenta {
    numero: number;
    tipoEmision: string;
    tipoAutomatizacion?: string;
    fechaServicioDesde?: string;
    fechaServicioHasta?: string;
}
export interface EmissionCapability {
    cuit: string;
    condicion_iva: string;
    compatible_types: string[];
    recommendation: string;
    tip: string;
}
export interface HealthResponse {
    status: string;
    version?: string;
    uptime?: number;
}
export interface PartnerSubaccountInput {
    /** CUIT fiscal del cliente final (11 dígitos, sin guiones) */
    cuit: string;
    /** Razón social del cliente final */
    organization: string;
    /** Email de acceso del cliente final */
    email: string;
}
export interface PartnerSubaccountResponse {
    id: string;
    cuit: string;
    organization: string;
    email: string;
    /** Contraseña generada — se devuelve UNA sola vez. Entregar por canal seguro. */
    password: string;
    /** API Key live de la subcuenta — se devuelve UNA sola vez. */
    api_key: string;
    partner_id: string;
}
export interface PartnerClient {
    cuit: string;
    organization: string;
    email: string;
    plan: 'free' | 'developer' | 'platform';
    invoices_this_month: number;
    created_at: string | null;
}
export interface PartnerClientsResponse {
    partner_id: string;
    total: number;
    clients: PartnerClient[];
}
export interface PartnerPreauthResponse {
    success: boolean;
    message: string;
    partner_id: string;
    cuit: string;
}
export interface PartnerPublicConfig {
    id: string;
    name: string;
    logo_url: string;
    brand_color: string;
    billing_mode: 'decentralized' | 'consolidated';
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
     * Verificar qué tipos de factura puede emitir un CUIT según su condición fiscal
     */
    checkEmissionCapability(cuit: string): Promise<EmissionCapability>;
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
     * Listar Credenciales Digitales Registradas
     */
    listCredentials(): Promise<KmsCredentialResponse[]>;
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
     * Obtener Detalles de una Factura por ID
     */
    getInvoice(id: string): Promise<InvoiceResponse>;
    /**
     * Listar Facturas Recientes
     */
    listInvoices(limit?: number, offset?: number): Promise<{
        invoices: InvoiceResponse[];
        total: number;
    }>;
    /**
     * Descargar PDF de Factura (Retorna el Stream / ArrayBuffer)
     */
    getInvoicePdfBuffer(id: string, options?: {
        format?: 'a4' | 'ticket';
    }): Promise<Buffer>;
    /**
     * Listar Puntos de Venta Habilitados para Facturación Electrónica
     */
    listPuntosDeVenta(): Promise<PuntoDeVenta[]>;
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
    /**
     * Health Check de la API
     */
    health(): Promise<HealthResponse>;
    /**
     * Obtener tabla de condiciones IVA del receptor (15 códigos oficiales ARCA)
     */
    getCondicionesIva(): Promise<CondicionesIvaResponse>;
    /**
     * Consultar cotización de una moneda extranjera vs peso (vía ARCA)
     */
    getCotizacionMoneda(moneda: string): Promise<{
        moneda: string;
        cotizacion: number;
    }>;
    /**
     * Crear una subcuenta completa (usuario + perfil + API Key) para un
     * cliente final de tu ERP. La password y api_key se devuelven una sola vez.
     */
    createPartnerSubaccount(data: PartnerSubaccountInput): Promise<PartnerSubaccountResponse>;
    /**
     * Listar los clientes vinculados a tu partner, con plan y consumo mensual.
     */
    listPartnerSubaccounts(): Promise<PartnerClientsResponse>;
    /**
     * Pre-autorizar el CUIT de un cliente para facturación consolidada
     * (el cliente no pasará por la pasarela de pago al registrarse).
     */
    preauthorizeCuit(cuit: string): Promise<PartnerPreauthResponse>;
    /**
     * Consultar la configuración pública de co-branding de un partner
     * (endpoint público — no requiere autenticación).
     */
    getPartnerConfig(partnerId: string): Promise<PartnerPublicConfig>;
}
