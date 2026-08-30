# Walkthrough: ISSUE-403 - Infraestructura Evolution API v2 y Protocolo Anti-Baneo

## 🎯 Objetivo
Configurar la infraestructura de mensajería para Center Gas de manera segura, escalable y resistente a baneos de WhatsApp, utilizando la última versión de Evolution API (v2) y documentando las reglas operativas obligatorias para el negocio.

## 🛠️ ¿Qué implementó el Squad?

### 1. Infraestructura: Evolution API v2 (`@devops-agent`)
- Se documentó el archivo `infrastructure/evolution-api/docker-compose.yml` final que despliega Evolution API v2 en el VPS.
- **Breaking Changes Manejados:** Se incorporó de manera nativa un contenedor de PostgreSQL (ahora obligatorio en v2) y se migró Redis exclusivamente a funciones de Caché y Sesión.
- **Seguridad Perimetral:**
  - Instancia protegida con `AUTHENTICATION_TYPE: apikey` (Clave: `CENTERGAS_EVOLUTION_KEY_2026`).
  - Resolución DNS a través de Cloudflare (Registro A sin proxy en `evolution.arcav.us`) para permitir la generación de SSL.
  - Generación de certificado HTTPS mediante Nginx Proxy Manager en el puerto 81.
  - Conexión al Manager GUI habilitada exitosamente.

### 2. Protocolo Anti-Baneo y Seguridad (`@architect-agent` / `@backend-dev-agent`)
- **Documentación Maestra:** Se creó `docs/16-whatsapp-anti-ban-protocol.md`, la biblia obligatoria para operaciones de mensajería del negocio, cubriendo las 5 reglas cardinales de Meta (Rate Limit, Warm-up, Delay Humano, Chip Dedicado y Mensaje Reactivo).
- **Protección de Base de Datos:** Se implementó una migración SQL (`20260830110000_fix_catalog_session_rate_limit.sql`) que fusiona de manera atómica el check de Rate Limit (1 mensaje cada 10 min por cliente) y la generación del token (JWT) de manera segura y conforme a LGPD.

### 3. Ajuste de Automatizaciones (`@automation-agent`)
- Actualización de `workflows/n8n/WF-01_WhatsApp_Inbound.json`.
- Implementación de nodo "Delay (Humanizer)" configurado a 5 segundos de espera artificial antes de responder.
- Modificación del texto de auto-respuesta al portugués y estilo conversacional/amistoso para reducir la tasa de reportes de Spam ("Oi! 👋 Vi sua mensagem...").
- Consumo directo del RPC atómico de Supabase para evitar fugas de información.

## 🔒 Cumplimiento de Gobernanza
- [x] Ejecutado en ramas aisladas de Git (`feat/ISSUE-403...`).
- [x] Respaldo de infraestructura versionada (Zero-Trust CI/CD).
- [x] Sin asunciones de API: se probó y ajustó iterativamente contra Evolution API v2.3.7 real.

## 🚀 Siguientes Pasos (Negocio)
1. Conectar el N8N al webhook de Evolution API.
2. Iniciar el periodo de Warm-up de 2 semanas del número antes de encender campañas masivas, tal como dicta el Protocolo Anti-Baneo.
