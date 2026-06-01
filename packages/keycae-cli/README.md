# keycae-cli 💻

Utilidad de línea de comandos (CLI) interactiva para configurar, testear y diagnosticar conexiones de facturación oficial de **ARCA (ex AFIP)** a través de **KeyCAE.ar**.

## Instalación Global

Puedes instalar la utilidad de terminal de forma global en tu máquina:

```bash
# Compilar localmente
npm install
npm run build

# Enlazar comando de forma global
npm link
```

Una vez enlazado, puedes invocar el comando interactivo directamente con:
```bash
keycae --help
```

## Comandos Disponibles

### 1. Inicializar Configuración
Configura tu API Key del sandbox y la dirección del servidor de forma interactiva:
```bash
keycae init
```

### 2. Consultar Contribuyente en Padrón ARCA
Busca y verifica la condición fiscal de un CUIT directamente desde la terminal:
```bash
keycae taxpayers 20254459306
```

### 3. Emitir Factura de Prueba (Sandbox)
Envía una factura electrónica simulada y recibe el CAE y URL de PDF de inmediato en la terminal:
```bash
keycae invoice-emit
```

## Licencia
MIT
