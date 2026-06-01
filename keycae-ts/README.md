# keycae-ts 🚀

Cliente SDK oficial en **TypeScript** y **JavaScript** para interactuar con **KeyCAE.ar** y emitir facturación electrónica oficial ante **ARCA (ex AFIP)**.

## Instalación

```bash
npm install keycae-ts
```

## Inicio Rápido

```typescript
import { KeyCaeClient } from 'keycae-ts';

const client = new KeyCaeClient('sk_tes...aqui');

// Consultar contribuyente
const taxpayer = await client.getTaxpayer('20254459306');
console.log(`${taxpayer.nombre} | ${taxpayer.estado}`);

// Emitir factura
const invoice = await client.emitInvoice({
  cuit_emisor: '20254459306',
  punto_de_venta: 1,
  tipo_comprobante: 'B',
  receptor: { tipo_doc: 'CUIT', nro_doc: '20333444555' },
  conceptos: [{ descripcion: 'Servicios', precio: 15000 }]
}, 'idempotency_key_42');

console.log(`CAE: ${invoice.cae}`);
console.log(`PDF: ${invoice.url_pdf}`);
```

## Modelos de Conexión

### Modalidad A: Delegación Directa (Recomendada)
Sin certificados, sin llaves privadas. En minutos facturás.

```typescript
const delegation = await client.createDelegation({
  cuit: '20254459306',
  organization: 'Tu Empresa'
});
```

### Modalidad B: Bóvedas KMS
Generación segura de claves RSA y CSR.

```typescript
const credential = await client.createCredential({
  cuit: '20254459306',
  organization: 'Tu Empresa'
});
```

### Modalidad C: Importar Certificado
Subida directa de certificados (.crt) y llaves (.key).

```typescript
await client.importCertificate(credentialId, certificatePem);
```

## Alertas Telegram

```typescript
await client.saveTelegramSettings({
  telegram_bot_token: '123456:***',
  telegram_chat_id: '987654321'
});
```

## Documentación

- 📖 [docs.keycae.ar](https://docs.keycae.ar) — Documentación interactiva
- 📄 [llms.txt](https://keycae.ar/llms.txt) — Para AI agents
- 🔌 [MCP Server](https://www.npmjs.com/package/keycae-mcp) — Para Cursor/Claude

## Licencia

MIT
