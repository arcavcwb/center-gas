# 00 - Acta de Constitución del Proyecto (Project Charter)

## Propósito
El propósito de este documento es autorizar formalmente el proyecto de Transformación Digital de Center Gás Curitiba. Define los objetivos de alto nivel, el alcance y los límites iniciales del proyecto para establecer un entendimiento común entre las partes interesadas y el equipo de consultoría antes de que comience el descubrimiento detallado.

## Alcance (Scope)
**Dentro del Alcance:**
- Digitalización del flujo de pedidos por WhatsApp.
- Implementación de una base de datos de clientes (CRM) para eliminar la entrada repetitiva de datos.
- Desarrollo de un panel operativo centralizado para que el propietario gestione y despache los pedidos.
- Herramientas para que los repartidores reciban los detalles del pedido de forma clara.
- Implementación de mecanismos automatizados de fidelización.

**Fuera del Alcance:**
- Reemplazo total del personal humano (propietario o repartidores).
- Integraciones altamente complejas con sistemas ERP.
- Compra o gestión de hardware.
- Rastreo por GPS en tiempo real de los vehículos de entrega mediante hardware (a menos que se logre puramente a través de software móvil simple sin integración compleja).

## Contexto (Background)
Center Gás Curitiba es una empresa de entrega de barrio especializada en gas y agua. Actualmente, la operación depende en gran medida de la intervención manual del propietario. El propietario atiende los mensajes de WhatsApp, recopila los datos necesarios (productos, direcciones, métodos de pago), asigna tareas manualmente a tres repartidores e intenta gestionar el negocio simultáneamente. Este modelo restringe el crecimiento comercial, aumenta la probabilidad de error humano y limita la capacidad del propietario para centrarse en mejoras estratégicas.

## Contenido Principal

### 1. Objetivos de Alto Nivel
- **Reducir Tareas Manuales Repetitivas:** Eliminar la necesidad de que el dueño pregunte manualmente la misma información al cliente (como la dirección) repetidas veces.
- **Mantener la Simplicidad Operativa:** Cualquier nueva solución debe ser fácil de adoptar tanto para el propietario como para los repartidores.
- **Permitir Escalabilidad:** Estructurar el proceso de pedidos y despachos para que el negocio pueda manejar más volumen por día sin abrumar al equipo actual.

### 2. Partes Interesadas (Stakeholders)
- **Propietario:** Patrocinador principal, tomador de decisiones y usuario central del panel de despacho/gestión.
- **Repartidores (3):** Usuarios finales de la interfaz de instrucciones de entrega.
- **Clientes:** Usuarios finales del nuevo flujo de pedidos digitalizado.

### 3. Criterios de Éxito
- Reducción del tiempo promedio que el propietario invierte en procesar un solo pedido.
- Adopción exitosa del sistema digital por parte de los repartidores actuales.
- Mejoras en la retención de clientes mediante el seguimiento automatizado de fidelización.

## Preguntas Abiertas
- ¿Existen horas o días pico específicos donde el proceso manual es más propenso a colapsar?
- ¿Cuál es el principal punto de dolor ("pain point") del propietario en la operación diaria en este momento (ej. despachar, tomar pedidos, rastrear pagos)?
- ¿Existen restricciones específicas con respecto a los teléfonos inteligentes (smartphones) de los repartidores (ej. dispositivos muy antiguos, planes de datos limitados)?

## Dependencias
- Disponibilidad del propietario para realizar entrevistas detalladas de descubrimiento de negocio.
- Acceso a datos operativos actuales, precios y catálogos de productos.

## Referencias
- [README.md](../README.md) - Resumen del Proyecto y Flujo de Documentación

## Historial de Revisiones
| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.0 | 2026-07-22 | Lead Product Manager | Borrador inicial del Project Charter |

## Próximos Pasos
1. Revisar y aprobar esta Acta de Constitución con el cliente.
2. Proceder a la Fase 2: **Descubrimiento de Negocio** (`01-business-discovery.md`).
