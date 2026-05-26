# arca-agent-skills 🤖

Este paquete contiene la configuración de **Agentic AI** para automatizar la facturación oficial de **ARCA (ex AFIP)** mediante la API de **KeyCAE.ar**.

Permite que agentes autónomos de codificación (como Claude Code, Cursor, y Windsurf) entiendan y ejecuten operaciones fiscales de forma segura y directa.

## Uso en Cursor / Claude Code / Windsurf

Puedes inyectar estas reglas y system prompts en tu entorno para que la IA sepa cómo interactuar con los Web Services de ARCA usando KeyCAE.ar.

### 1. Archivo SKILL.md
El archivo `SKILL.md` contiene el prompt maestro que le enseña a tu agente sobre:
- Delegación Directa (Zero-Certificate).
- Prevención de duplicados con `Idempotency-Key`.
- Auto-sanación con `ai_action_hint`.

Simplemente copia su contenido dentro de tus archivos `.cursorrules` o equivalente.

## Licencia
MIT
