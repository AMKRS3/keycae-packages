import fetch from 'node-fetch';

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

export class KeyCaeClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'https://api.keycae.ar') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
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
      let errorDetails = '';
      try {
        errorDetails = await response.text();
      } catch (e) {}
      throw new Error(`KeyCAE API Error (${response.status}): ${errorDetails || response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Consultar Contribuyente en Padrón ARCA
   */
  async getTaxpayer(cuit: string): Promise<TaxpayerResponse> {
    return this.request<TaxpayerResponse>('GET', `/v1/taxpayers/${cuit}`);
  }

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

  /**
   * Crear Bóveda de Claves KMS & Generar CSR
   */
  async createCredential(data: KmsCredentialInput): Promise<KmsCredentialResponse> {
    return this.request<KmsCredentialResponse>('POST', '/v1/credentials', data);
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

  /**
   * Emitir Factura Electrónica Homologada (CAE)
   */
  async emitInvoice(data: InvoiceInput, idempotencyKey?: string): Promise<InvoiceResponse> {
    return this.request<InvoiceResponse>('POST', '/v1/invoices', data, idempotencyKey);
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

  /**
   * Obtener Consumos y Estado del Plan (Billing)
   */
  async getBillingStatus(): Promise<BillingStatusResponse> {
    return this.request<BillingStatusResponse>('GET', '/v1/billing/status');
  }

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
}
