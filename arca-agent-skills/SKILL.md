# ARCA compliance integration rules for KeyCAE.ar

This specification guides AI Coding Agents (such as Cursor, Windsurf, or Claude Code) in seamlessly integrating impositive compliance and electronic invoicing with **ARCA (ex AFIP) in Argentina** using **KeyCAE.ar**.

---

## 🤖 System Prompt for Coding Agents

Paste this prompt into your `.cursorrules`, Windsurf rules, or agent configurations:

```text
You are an expert Argentina tax compliance AI developer agent. Your job is to integrate electronic invoicing (ARCA/AFIP) using KeyCAE's official TypeScript SDK (`keycae-ts`).

### 🔑 Critical Guidelines:

1. **Leverage the Official SDK Class (`KeyCaeClient`)**:
   - Initialize using `new KeyCaeClient(apiKey, baseUrl)`.
   - Never implement manual SOAP XML signatures or direct AFIP WSAA requests.

2. **Idempotency is Mandatory**:
   - Every invoice emission MUST pass a unique `Idempotency-Key` (e.g. `order_10482_v1`) to the SDK method `emitInvoice(data, idempotencyKey)` to prevent double-charging or double-authorizations in ARCA's registers.

3. **Handle Errors with AI-DX Auto-Sanation**:
   - KeyCAE returns programmatically friendly error structures containing an `ai_action_hint` field when actions are required (e.g., renewing certificates or validating a client's CUIT).
```

---

## 🛠️ SDK Integration Cheat-Sheet

Here is how you actually write type-safe integrations using the `keycae-ts` SDK:

### 1. Initializing the Client
```typescript
import { KeyCaeClient } from 'keycae-ts';

const client = new KeyCaeClient(
  process.env.KEYCAE_API_KEY || 'sk_test_public_sandbox_cuit_20254459306',
  process.env.KEYCAE_BASE_URL || 'https://api.keycae.ar'
);
```

### 2. Validating a Taxpayer CUIT
Before emitting invoices or setting up tenants, fetch their official ARCA condition:
```typescript
try {
  const taxpayer = await client.getTaxpayer('20254459306');
  console.log(`Razón Social: ${taxpayer.nombre}`);
  console.log(`Es IVA Inscripto: ${taxpayer.es_iva_inscripto}`);
} catch (error) {
  console.error("No se pudo consultar el CUIT:", error.message);
}
```

### 3. Emitting an Invoice with Idempotency
```typescript
import { InvoiceInput } from 'keycae-ts';

const invoiceData: InvoiceInput = {
  cuit_emisor: '20254459306',
  punto_de_venta: 1,
  tipo_comprobante: 'C',
  receptor: {
    tipo_doc: 'DNI',
    nro_doc: '99888777'
  },
  conceptos: [
    { descripcion: 'Licencia Premium SaaS (Suscripción Mensual)', precio: 9900.00 }
  ]
};

try {
  // Use a domain-specific idempotency key
  const response = await client.emitInvoice(invoiceData, 'order_tx_901842');
  console.log(`Factura autorizada con CAE: ${response.cae}`);
  console.log(`Visualizar PDF: ${response.url_pdf}`);
} catch (error) {
  console.error("Error durante la emisión fiscal:", error.message);
}
```

### 4. Modalidad A: Delegación Directa (Zero-Certificate Model)
Register direct delegation to representative CUITs in Sandbox/Production without manual certificates:
```typescript
try {
  const delegation = await client.createDelegation({
    cuit: '20254459306',
    organization: 'Digital Media S.A.'
  });
  console.log(`Delegación registrada. ID: ${delegation.id}, Estado: ${delegation.status}`);
  
  // You can also poll the latest status
  const status = await client.checkDelegationStatus();
  console.log(`Estado actual de la delegación en ARCA: ${status.status}`);
} catch (error) {
  console.error("Error al registrar delegación:", error.message);
}
```

### 5. Modalidad B: Bóveda Criptográfica Asistida (KMS Vaults)
If you require custom hardware KMS keys generated on the platform:
```typescript
try {
  // 1. Create a secure KMS vault and obtain a Certificate Signing Request (CSR)
  const credential = await client.createCredential({
    cuit: '20254459306',
    organization: 'Digital Media S.A.',
    common_name: 'KeyCAE-Production-Vault'
  });
  console.log(`Bóveda KMS Creada: ${credential.id}`);
  console.log(`CSR para subir a ARCA (ex AFIP): \n${credential.csr_pem}`);

  // 2. Once you sign the CSR in AFIP Portal and get the .crt file, activate the vault
  const certPem = `-----BEGIN CERTIFICATE-----\n...your signed cert from AFIP...\n-----END CERTIFICATE-----`;
  await client.activateCredential(credential.id, certPem);
  console.log("¡Bóveda KMS activada e impositivamente funcional!");
} catch (error) {
  console.error("Fallo en la bóveda KMS:", error.message);
}
```

### 6. Modalidad C: Importación Directa de Credenciales Existentes
If the taxpayer already has their private key (.key) and signed certificate (.crt) from ARCA/AFIP:
```typescript
try {
  const credential = await client.importCredential({
    cuit: '20254459306',
    organization: 'Digital Media S.A.',
    certificate: '-----BEGIN CERTIFICATE-----\n...your CRT content...\n-----END CERTIFICATE-----',
    private_key: '-----BEGIN RSA PRIVATE KEY-----\n...your private KEY content...\n-----END RSA PRIVATE KEY-----'
  });
  
  console.log(`Credenciales importadas con éxito. ID: ${credential.id}, Estado: ${credential.status}`);
} catch (error) {
  console.error("Error al importar credenciales:", error.message);
}
```

### 7. Downloading Official Printable PDF Invoices
Fetch the raw A4 PDF Buffer to store locally or send to clients:
```typescript
import * as fs from 'fs';

try {
  const invoiceId = 'inv_104820a';
  const pdfBuffer = await client.getInvoicePdfBuffer(invoiceId);
  fs.writeFileSync(`./factura_${invoiceId}.pdf`, pdfBuffer);
  console.log("PDF oficial descargado y guardado en disco.");
} catch (error) {
  console.error("No se pudo obtener el PDF:", error.message);
}
```

### 8. Setting Up Mobile Push Alerts (Telegram)
Configure tenant-specific instant notifications on invoice authorization:
```typescript
try {
  // Save or update Telegram channel and bot tokens
  await client.saveTelegramSettings({
    telegram_bot_token: '123456:ABC-DEF1234ghIkl-zyx',
    telegram_chat_id: '@MiCanalAlertasFacturas'
  });
  console.log("Alertas de Telegram configuradas correctamente.");

  // Retrieve active settings
  const settings = await client.getTelegramSettings();
  console.log(`¿Tiene credenciales de alertas activas?: ${settings.has_credentials}`);
} catch (error) {
  console.error("Error al configurar alertas:", error.message);
}
```

### 9. Checking API Usage and Plan Quotas (Billing)
Monitor invoice limits, consumption percentage, and overages in real-time:
```typescript
try {
  const billing = await client.getBillingStatus();
  console.log(`Plan Actual: ${billing.plan}`);
  console.log(`Comprobantes Emitidos: ${billing.invoicesEmitted} / ${billing.monthlyLimit}`);
  console.log(`Porcentaje Consumido: ${billing.percentageConsumed}%`);
  if (billing.percentageConsumed > 90) {
    console.warn("⚠️ ¡Cerca del límite de tu cuota de facturación mensual!");
  }
} catch (error) {
  console.error("Fallo al obtener consumos de facturación:", error.message);
}
```
