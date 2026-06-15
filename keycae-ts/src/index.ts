import fetch from 'node-fetch';

// ════════════════════════════════════════════════════════════════════
//  INTERFACES
// ════════════════════════════════════════════════════════════════════

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
  condiciones: { codigo: number; nombre: string }[];
}

export interface InvoiceInput {
  cuit_emisor: string;
  punto_de_venta: number;
  tipo_comprobante: 'A' | 'B' | 'C' | 'M' | 'E'
    | 'NCA' | 'NCB' | 'NCC' | 'NCE' | 'NCM'
    | 'NDA' | 'NDB' | 'NDC' | 'NDE' | 'NDM'
    | 'FCE_A' | 'FCE_B' | 'FCE_C'
    | 'FCE_NDA' | 'FCE_NDB' | 'FCE_NDC'
    | 'FCE_NCA' | 'FCE_NCB' | 'FCE_NCC';
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

// ════════════════════════════════════════════════════════════════════
//  CLIENT
// ════════════════════════════════════════════════════════════════════

export class KeyCaeClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://keycae.ar') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    idempotencyKey?: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        const text = await response.text().catch(() => '');
        throw new Error(`KeyCAE API Error (${response.status}): ${text || response.statusText}`);
      }
      const message = errorData?.error?.message || JSON.stringify(errorData);
      const hint = errorData?.error?.ai_action_hint || '';
      throw new Error(`KeyCAE API Error (${response.status}): ${message}${hint ? ` [hint: ${hint}]` : ''}`);
    }

    return response.json() as Promise<T>;
  }

  // ── Taxpayers ─────────────────────────────────────────────────────

  /**
   * Consultar Contribuyente en Padrón ARCA
   */
  async getTaxpayer(cuit: string): Promise<TaxpayerResponse> {
    return this.request<TaxpayerResponse>('GET', `/v1/taxpayers/${cuit}`);
  }

  /**
   * Verificar qué tipos de factura puede emitir un CUIT según su condición fiscal
   */
  async checkEmissionCapability(cuit: string): Promise<EmissionCapability> {
    const taxpayer = await this.getTaxpayer(cuit);
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
  async createDelegation(data: DelegationInput): Promise<DelegationResponse> {
    return this.request<DelegationResponse>('POST', '/v1/delegations', data);
  }

  /**
   * Consultar Estado de Delegación Directa
   */
  async checkDelegationStatus(): Promise<DelegationResponse> {
    return this.request<DelegationResponse>('GET', '/v1/delegations/status');
  }

  // ── Credentials (KMS) ────────────────────────────────────────────

  /**
   * Crear Bóveda de Claves KMS & Generar CSR
   */
  async createCredential(data: KmsCredentialInput): Promise<KmsCredentialResponse> {
    return this.request<KmsCredentialResponse>('POST', '/v1/credentials', data);
  }

  /**
   * Listar Credenciales Digitales Registradas
   */
  async listCredentials(): Promise<KmsCredentialResponse[]> {
    return this.request<KmsCredentialResponse[]>('GET', '/v1/credentials');
  }

  /**
   * Importar Credenciales de Firma Existentes (.key y .crt)
   */
  async importCredential(data: KmsImportInput): Promise<KmsCredentialResponse> {
    return this.request<KmsCredentialResponse>('POST', '/v1/credentials/import', data);
  }

  /**
   * Activar Bóveda KMS con Certificado ARCA (.crt)
   */
  async activateCredential(id: string, certificatePem: string): Promise<any> {
    return this.request<any>('POST', `/v1/credentials/${id}/certificate`, { certificate: certificatePem });
  }

  /**
   * Eliminar Bóveda de Claves KMS de forma física y segura
   */
  async deleteCredential(id: string): Promise<any> {
    return this.request<any>('DELETE', `/v1/credentials/${id}`);
  }

  // ── Invoices ──────────────────────────────────────────────────────

  /**
   * Emitir Factura Electrónica Homologada (CAE)
   */
  async emitInvoice(data: InvoiceInput, idempotencyKey?: string): Promise<InvoiceResponse> {
    return this.request<InvoiceResponse>('POST', '/v1/invoices', data, idempotencyKey);
  }

  /**
   * Obtener Detalles de una Factura por ID
   */
  async getInvoice(id: string): Promise<InvoiceResponse> {
    return this.request<InvoiceResponse>('GET', `/v1/invoices/${id}`);
  }

  /**
   * Listar Facturas Recientes
   */
  async listInvoices(limit: number = 10, offset: number = 0): Promise<{ invoices: InvoiceResponse[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return this.request<any>('GET', `/v1/invoices?${params}`);
  }

  /**
   * Descargar PDF de Factura (Retorna el Stream / ArrayBuffer)
   */
  async getInvoicePdfBuffer(id: string): Promise<Buffer> {
    const response = await fetch(`${this.baseUrl}/v1/invoices/${id}/pdf`, {
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
  async listPuntosDeVenta(): Promise<PuntoDeVenta[]> {
    return this.request<PuntoDeVenta[]>('GET', '/v1/pos');
  }

  // ── Billing ───────────────────────────────────────────────────────

  /**
   * Obtener Consumos y Estado del Plan (Billing)
   */
  async getBillingStatus(): Promise<BillingStatusResponse> {
    return this.request<BillingStatusResponse>('GET', '/v1/billing/status');
  }

  // ── Telegram Settings ─────────────────────────────────────────────

  /**
   * Obtener Ajustes de Telegram por Tenant
   */
  async getTelegramSettings(): Promise<TelegramSettingsResponse> {
    return this.request<TelegramSettingsResponse>('GET', '/v1/settings/telegram');
  }

  /**
   * Guardar / Actualizar Ajustes de Telegram
   */
  async saveTelegramSettings(data: TelegramSettingsInput): Promise<any> {
    return this.request<any>('POST', '/v1/settings/telegram', data);
  }

  // ── Health ────────────────────────────────────────────────────────

  /**
   * Health Check de la API
   */
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('GET', '/health');
  }

  // ── Condición IVA Receptor ──────────────────────────────────────

  /**
   * Obtener tabla de condiciones IVA del receptor (15 códigos oficiales ARCA)
   */
  async getCondicionesIva(): Promise<CondicionesIvaResponse> {
    return this.request<CondicionesIvaResponse>('GET', '/v1/taxpayers/condiciones-iva');
  }

  // ── Cotización de Moneda ────────────────────────────────────────

  /**
   * Consultar cotización de una moneda extranjera vs peso (vía ARCA)
   */
  async getCotizacionMoneda(moneda: string): Promise<{ moneda: string; cotizacion: number }> {
    return this.request<any>('GET', `/v1/cotizacion/${moneda}`);
  }
}
