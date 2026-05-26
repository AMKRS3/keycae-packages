# keycae-ts 🚀

Cliente SDK oficial en **TypeScript** y **JavaScript** para interactuar con la plataforma de **KeyCAE.ar** y emitir facturación electrónica oficial homologada ante **ARCA (ex AFIP)** de forma simple y resiliente.

## Instalación

Instala el SDK en tu proyecto Node.js/TypeScript:

```bash
npm install keycae-ts
# O usando yarn / pnpm
yarn add keycae-ts
pnpm add keycae-ts
```

## Inicio Rápido (Modelo A: Delegación Directa ⭐)

Esta es la forma recomendada por defecto. En minutos podés facturar sin lidiar con llaves privadas o subir archivos de certificados.

```typescript
import { KeyCaeClient } from 'keycae-ts';

// 1. Inicializar el cliente con tu API Key
const client = new KeyCaeClient('sk_test_tu_api_key_aqui');

async function main() {
  try {
    // 2. Registrar la delegación (previamente debés adherir el servicio en el portal de ARCA al CUIT representante 20254459306)
    console.log('Iniciando delegación directa...');
    const delegation = await client.createDelegation({
      cuit: '20254459306',
      organization: 'Digital Media S.A.'
    });
    
    console.log(`Estado inicial de delegación: ${delegation.status}`);
    
    // 3. Emitir una factura electrónica homologada (con CAE y PDF)
    console.log('Emitiendo factura fiscal...');
    const invoice = await client.emitInvoice({
      cuit_emisor: '20254459306',
      punto_de_venta: 1,
      tipo_comprobante: 'C',
      receptor: {
        tipo_doc: 'DNI',
        nro_doc: '35987654'
      },
      conceptos: [
        {
          descripcion: 'Servicios de Consultoría de Software',
          precio: 150000.00
        }
      ]
    }, 'idempotency_key_factura_42'); // Idempotency key para prevenir duplicaciones de red
    
    console.log('¡Factura autorizada exitosamente!');
    console.log(`Comprobante: Nro. ${invoice.numero_factura}`);
    console.log(`CAE Otorgado: ${invoice.cae}`);
    console.log(`Vencimiento CAE: ${invoice.cae_vencimiento}`);
    console.log(`PDF de Impresión: ${invoice.url_pdf}`);
    console.log(`Código QR Fiscal: ${invoice.url_qr}`);
    
  } catch (error) {
    console.error('Error durante la operación:', error);
  }
}

main();
```

## Notificaciones en Tiempo Real (Telegram Alerts)

Configurá tu bot de Telegram a través de la API para recibir alertas móviles al instante de cada comprobante emitido:

```typescript
import { KeyCaeClient } from 'keycae-ts';

const client = new KeyCaeClient('sk_test_tu_api_key_aqui');

async function setupAlerts() {
  // Guardar configuración del Bot
  await client.saveTelegramSettings({
    telegram_bot_token: '123456789:ABCdefGhIjKlMnOpQrStUvWxYz_TOKEN',
    telegram_chat_id: '987654321'
  });
  
  // Consultar configuración actual (retorna enmascarada)
  const settings = await client.getTelegramSettings();
  console.log('Ajustes de alertas activos:', settings);
}

setupAlerts();
```

## Licencia

MIT
