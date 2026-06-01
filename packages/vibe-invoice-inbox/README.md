# vibe-invoice-inbox 📊

Consola auto-hospedada premium en **Next.js** y **React** para visualizar, auditar y descargar comprobantes fiscales autorizados por **ARCA** a través del backend de **KeyCAE.ar**.

Ideal para equipos que necesitan un visor administrativo interno sin depender de la consola global de KeyCAE.

## Inicio Rápido en Desarrollo Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Levantar servidor local
```bash
npm run dev
```
Abre tu navegador en [http://localhost:3000](http://localhost:3000) (o el puerto secundario asignado por Next.js).

### 3. Conectar tu API
1. En la parte superior derecha de la interfaz, introduce tu **API Key Bearer** de KeyCAE (`sk_test_...` o `sk_live_...`).
2. Presiona **Conectar API** para sincronizar y listar en tiempo real tus comprobantes emitidos.
3. Haz clic en cualquier factura del panel izquierdo para auditar los detalles fiscales del CAE, y obtener accesos directos al PDF A4 y la verificación impositiva de ARCA.

## Licencia
MIT
