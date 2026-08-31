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

## 🚀 Siguientes Pasos
### 3. Limpieza y Activación Segura de n8n (30 Ago)
- Se auditó el servidor n8n en producción (`n8n.arcav.us`) identificando conflictos debido a workflows duplicados y obsoletos (creados en sesiones anteriores).
- Se ejecutó un plan de limpieza vía API REST, eliminando permanentemente los workflows obsoletos:
  - `WF-01` (ID: yt9SGF4BibKNd4WL)
  - `WF-02` (ID: mxiksZimTLupEBbf)
  - `WF-02/03` (ID: KmpLWxprPdTIa75W)
- Se auditaron y activaron los workflows definitivos (29 Ago) asegurando que contengan el diseño Anti-Ban y el manejo global de errores:
  - ✅ Activado: `WF-02/03` (Notificaciones Outbound - ID: SCqre7me1lAPKeH1)
  - ✅ Activado: `WF-04` (Error Handler - ID: lqecFPUmQqc5qul0)
  - ⏸️ Inactivo (Warm-up Protocol): `WF-01` (Inbound)
- Se disparó exitosamente un mensaje de prueba a través del endpoint `/message/sendText` de la infraestructura de Evolution API v2 para validar el funcionamiento End-to-End.

## Verificación Manual
1. Validar en el dashboard de n8n que solo queden los 3 flujos finales (del 29 Ago).
2. Crear o actualizar un pedido en Supabase para que pase a estado "En Camino".
3. Verificar que el Webhook de Supabase se haya disparado hacia n8n.
4. Confirmar recepción del mensaje automatizado en el WhatsApp del cliente con el nombre dinámico del Motoboy (ej: "Tu pedido va en camino con Carlos").

### Fase 4: Corrección de Expresiones n8n y Formato de Teléfono
Durante las pruebas End-to-End, se detectaron dos fallas críticas en el procesamiento del webhook en n8n:
1. **Error de formato de payload (Idempotency):** El webhook personalizado de Supabase (`net.http_post`) enviaba el JSON en la raíz (`body.id`), mientras que n8n esperaba el formato por defecto (`body.record.id`). Esto provocaba inserciones nulas en la tabla de log y fallas en la base de datos (409 Conflict o Constraint Violations).
2. **Error de país en número de teléfono (Bad Request Evolution API):** Los números de teléfono capturados de la base de datos no tenían el código de país `55` requerido por Evolution API V2.

**Solución aplicada directamente vía REST API a n8n:**
- Se actualizaron todas las referencias en los nodos de n8n para usar `json.body.id`, `json.body.status` y `json.body.customer_phone`.
- Se incluyó lógica dinámica en las expresiones de n8n para asegurar que el número de teléfono comience siempre con `55`: `{{ $('Webhook Supabase').item.json.body.customer_phone.startsWith('55') ? $('Webhook Supabase').item.json.body.customer_phone : '55' + $('Webhook Supabase').item.json.body.customer_phone }}`.
- Se corrigió el uso incorrecto de variables de entorno (bloqueado por `N8N_BLOCK_ENV_ACCESS_IN_NODE`), reemplazándolas por los valores concretos.

**Resultado:** Las ejecuciones en n8n finalizaron con status `SUCCESS` y la plataforma de WhatsApp recibió y entregó exitosamente los mensajes. El archivo JSON en el repositorio (`workflows/n8n/WF-02_WhatsApp_Outbound.json`) fue actualizado para reflejar este estado exitoso.
