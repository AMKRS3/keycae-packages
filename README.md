# KeyCAE.ar Packages 🚀

Este repositorio contiene los paquetes públicos, SDKs oficiales, CLI interactiva y especificaciones de IA para integrar la facturación electrónica de **ARCA (ex AFIP) en Argentina** con **KeyCAE.ar**.

Inspirado en arquitecturas modernas y developer-first (como [Kapso](https://github.com/gokapso)), este repositorio provee todas las herramientas necesarias para que tanto desarrolladores humanos como **agentes autónomos de IA** puedan facturar en minutos.

---

## 📦 Contenido de los Paquetes

| Paquete | Directorio | Descripción |
|---------|------------|-------------|
| **`keycae-ts`** | [`/keycae-ts`](./keycae-ts) | SDK oficial de TypeScript/JavaScript. Tipo-seguro, ligero y optimizado para entornos serverless y tradicionales. |
| **`keycae-cli`** | [`/keycae-cli`](./keycae-cli) | CLI interactiva de línea de comandos para inicializar configuraciones, testear CUITs y emitir comprobantes directamente desde la terminal. |
| **`arca-agent-skills`** | [`/arca-agent-skills`](./arca-agent-skills) | Reglas del sistema, system prompts y MCP Server optimizados para agentes cognitivos (Cursor, Windsurf, Claude Code). |
| **`vibe-invoice-inbox`** | [`/vibe-invoice-inbox`](./vibe-invoice-inbox) | Visor de facturas web interactivo ("marca blanca") diseñado para vibe coders. |

---

## 🚀 Guía de Inicio Rápido

### 1. Inicialización en tu Proyecto
Puedes usar la CLI directamente para aprovisionar tu entorno en segundos:
```bash
npx keycae init sk_test_public_sandbox_cuit_20254459306
```

### 2. Uso del SDK de TypeScript
Instala la biblioteca cliente oficial:
```bash
npm install keycae-ts
```

Usa el cliente seguro con auto-caching de tokens y control de idempotencia obligatorio:
```typescript
import { KeyCaeClient } from 'keycae-ts';

const client = new KeyCaeClient(
  process.env.KEYCAE_API_KEY || 'sk_test_public_sandbox_cuit_20254459306',
  'https://api.keycae.ar'
);

// Consulta la condición impositiva de un contribuyente en ARCA
const taxpayer = await client.getTaxpayer('20254459306');
console.log(`Contribuyente: ${taxpayer.nombre} | Estado: ${taxpayer.estado}`);
```

---

## 🤖 Integración con Agentes de IA (Cursor / Windsurf / Claude Code)

Este repositorio está diseñado de forma nativa para ser consumido por agentes de codificación. Si estás desarrollando con asistencia de IA:
1. Copia las reglas de integración del archivo [`/arca-agent-skills/SKILL.md`](./arca-agent-skills/SKILL.md).
2. Pégalas dentro de tu archivo `.cursorrules` o configuraciones del agente.
3. El agente sabrá exactamente cómo estructurar la facturación utilizando las mejores prácticas de idempotencia y auto-sanación de errores impositivos.

## 📄 Licencia
MIT.
