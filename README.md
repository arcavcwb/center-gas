# Center Gás Curitiba - Plataforma de Transformación Digital

## Resumen del Proyecto
Center Gás Curitiba es una empresa de entrega de gas y agua a nivel local (barrio). Actualmente, la operación es completamente manual y depende en gran medida del propietario para recibir pedidos vía WhatsApp, capturar direcciones, definir métodos de pago y asignar rutas de entrega a los repartidores.

Este proyecto tiene como objetivo transformar el negocio en una operación estructurada y habilitada digitalmente. El enfoque principal es **reducir el trabajo manual repetitivo** en lugar de reemplazar al personal, brindando una experiencia de pedido optimizada para los clientes y un flujo operativo automatizado para el dueño y los repartidores.

## Objetivos
- **Digitalizar el proceso de pedidos** a través de WhatsApp y un catálogo web de autoservicio.
- **Eliminar el ingreso repetitivo de datos** (ej., preguntar por la dirección en cada pedido).
- **Crear un panel de gestión centralizado** para el despacho y control operativo.
- **Implementar mecanismos automatizados de retención de clientes** (CRM y Fidelidad).
- **Mantener la simplicidad del negocio** sin sobre-ingeniar la solución tecnológica.

## Flujo de Trabajo de Documentación
Este repositorio sigue una estrategia de documentación incremental y estrictamente ordenada, modelada a partir de las mejores prácticas de consultoría (McKinsey, Thoughtworks, Shopify).

1. **Documento por Documento:** Trabajamos en un documento a la vez.
2. **Basado en Revisiones:** Ninguna fase comienza hasta que el documento anterior haya sido completamente revisado y aprobado.
3. **Sin Suposiciones:** Las ambigüedades deben ser listadas como "Preguntas Abiertas".
4. **Única Fuente de Verdad:** Los documentos deben referenciarse entre sí, evitando la duplicación de información.

## Estructura de Carpetas
```
center-gas-platform/
├── README.md
├── docs/
│   ├── 00-project-charter.md
│   ├── 01-business-discovery.md
│   ├── 02-current-state-analysis.md
│   ├── 03-business-processes.md
│   ├── 04-business-rules.md
│   ├── 05-product-vision.md
│   ├── 06-prd.md
│   ├── 07-ui-ux.md
│   ├── 08-technical-architecture.md
│   ├── 09-database-design.md
│   ├── 10-integrations.md
│   ├── 11-roadmap.md
│   └── 12-deployment.md
└── assets/
    ├── screenshots/
    ├── wireframes/
    ├── diagrams/
    └── prompts/
```

## Fases del Proyecto
El proyecto se divide estrictamente en las siguientes fases secuenciales:
1. **Acta de Constitución (Project Charter)** (Definición del mandato)
2. **Descubrimiento de Negocio** (Entender el modelo de negocio)
3. **Análisis del Estado Actual** (Análisis de cuellos de botella)
4. **Procesos de Negocio** (Documentación de flujos AS-IS / TO-BE)
5. **Reglas de Negocio** (Definición de reglas operativas)
6. **Visión del Producto** (Establecer la dirección estratégica del producto)
7. **PRD** (Documento de Requisitos del Producto)
8. **UI/UX** (Pautas de Interfaz y Experiencia de Usuario)
9. **Arquitectura Técnica** (Definición del stack: Astro, Supabase, n8n, etc.)
10. **Diseño de Base de Datos** (Modelado de datos)
11. **Integraciones** (WhatsApp API / WHAM)
12. **Hoja de Ruta (Roadmap)** (Cronograma de ejecución)
13. **Despliegue (Deployment)** (Estrategia de lanzamiento)

## Seguimiento de Estado

| Fase | Documento | Estado | Versión | Pendientes |
|---|---|---|---|---|
| Fase 1 | 00-project-charter.md | ✅ En Revisión | v1.0 | Confirmar baseline de métricas AS-IS con propietario |
| Fase 2 | 01-business-discovery.md | ✅ En Revisión | v1.0 | Confirmar volumen diario de pedidos |
| Fase 3 | 02-current-state-analysis.md | ✅ En Revisión | v1.0 | Definir métricas de línea base |
| Fase 4 | 03-business-processes.md | ✅ En Revisión | v1.0 | Diseñar flujo de cliente nuevo y entrega fallida |
| Fase 5 | 04-business-rules.md | 🔄 Actualizado | v1.1 | Confirmar precio casco P13/Agua y barrios cubiertos (BR-002, BR-005) |
| Fase 6 | 05-product-vision.md | ✅ En Revisión | v1.0 | — |
| Fase 7 | 06-prd.md | 🔄 Actualizado | v1.1 | Definir mecanismo de seguridad del link cliente |
| Fase 8 | 07-ui-ux.md | ✅ En Revisión | v1.0 | Agregar wireframes de error, cliente nuevo y pedido en camino |
| Fase 9 | 08-technical-architecture.md | ✅ En Revisión | v1.0 | Definir estrategia CORS y entorno Staging |
| Fase 10 | 09-database-design.md | ✅ Auditado | v1.2-Enterprise | — |
| Fase 11 | 10-integrations.md | ✅ En Revisión | v1.0 | Definir manejo de mensajes no-texto (audio, imagen) en WF-01 |
| Fase 12 | 11-roadmap.md | ✅ En Revisión | v1.0 | Agregar buffers entre sprints |
| Fase 13 | 12-deployment.md | ✅ En Revisión | v1.0 | Definir entorno Staging y monitoreo de producción |

## Elementos Pendientes de Validación con el Propietario

Los siguientes datos deben confirmarse con el dueño del negocio **antes de iniciar el Sprint 1**:

| # | Dato Requerido | Regla de Negocio | Urgencia |
|---|---|---|---|
| 1 | Precio exacto del casco P13 (cilindro vacío) | BR-002 | 🔴 Bloquea Sprint 1 |
| 2 | Precio exacto del botéllón vacío Agua 20L | BR-002 | 🔴 Bloquea Sprint 1 |
| 3 | Lista de barrios / zonas de cobertura exactas | BR-005 | 🔴 Bloquea Sprint 3 |
| 4 | Volumen diario estimado de pedidos | Capacidad | 🟡 Importante para dimensionamiento |
| 5 | Horarios reales de atención confirmados | BR-006 | 🟡 Importante |
| 6 | Valor de comisión por entrega completada | BR-008 | 🟡 Importante |
| 7 | ¿Comisión de combo (Gas+Agua) por bulto o por dirección? | BR-008 | 🟡 Importante |
