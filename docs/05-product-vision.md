# 05 - Visión del Producto (Product Vision)

## Propósito
El propósito de este documento es definir la dirección estratégica del producto digital que se construirá para Center Gás Curitiba. Explica el qué, el porqué, los problemas que resuelve, los beneficios operacionales y la delimitación de las funcionalidades principales del Producto Mínimo Viable (MVP).

## Alcance
**Dentro del Alcance:**
- Definición conceptual de la plataforma.
- Justificación del desarrollo (Por qué).
- Impacto esperado en la operación del negocio.
- Identificación de los módulos principales del MVP.

**Fuera del Alcance:**
- Definiciones tecnológicas, lenguajes o proveedores de nube (se tratarán en `08-technical-architecture.md`).
- Diseños detallados de pantallas o wireframes (se tratarán en `07-ui-ux.md`).

## Contexto
Con las reglas de negocio fijadas (`04-business-rules.md`) y los procesos mapeados (`03-business-processes.md`), este documento conecta las necesidades del negocio con una solución digital concebida para simplificar y escalar la operación sin reemplazar al equipo humano.

---

## Contenido Principal

### 1. ¿Qué producto construiremos?
Construiremos la **Plataforma Digital de Operaciones y Pedidos Center Gás**, un sistema integrado compuesto por dos frentes clave:
1. **Interfaz de Auto-Atención para Clientes:** Un canal web y de mensajería optimizado para permitir que los clientes realicen o repitan pedidos en menos de 10 segundos.
2. **Centro de Control de Despacho y CRM:** Un panel de comando centralizado para el propietario que muestra los pedidos en tiempo real, permite asignarlos a los repartidores con un clic y administra la base de datos de clientes.

### 2. ¿Por qué lo construiremos?
Para eliminar la dependencia operativa absoluta sobre el propietario y permitir que la empresa aumente su volumen de ventas sin colapsar. La solución busca desacoplar el crecimiento del negocio del esfuerzo humano manual, asegurando que la velocidad de entrega no se degrade a medida que aumentan los clientes.

### 3. Qué problemas resuelve
* **Eliminación del trabajo repetitivo:** Evita solicitar nombre, dirección y método de pago a clientes habituales en cada transacción.
* **Erradicación del punto único de falla (SPOF):** Permite que la recepción y despacho de pedidos continúe funcionando de forma fluida sin requerir la presencia constante del dueño.
* **Prevención de la pérdida de información (Data Loss):** Centraliza historiales de compra, frecuencias de consumo y datos de contacto en un CRM seguro.
* **Reducción de errores de despacho:** Elimina confusiones en las direcciones o montos de cobro transmitidos a los repartidores.

### 4. Qué beneficios tendrá
* **Mayor Retención de Clientes:** Implementación automática del programa de lealtad (8->1) sin posibilidad de extravío de cupones.
* **Eficiencia Logística:** Instrucciones claras y estructuradas para los 3 motoboys, reduciendo tiempos muertos y fletes fallidos.
* **Toma de Decisiones Informada:** Métricas claras de ventas diarias, productos más solicitados y rendimiento del equipo.
* **Excelente Experiencia del Cliente:** Interacción rápida, transparente y confiable.

### 5. Cómo cambiará el negocio (Transformación)
El negocio evolucionará de una gestión **reactiva y artesanal** a una operación **estructurada y escalable**:
* **El Propietario:** Pasará de ser un contestador de chats y despachador manual a un administrador enfocado en estrategia, atención B2B y supervisión.
* **Los Repartidores:** Tendrán una herramienta clara para ejecutar sus entregas sin depender de audios o mensajes dispersos.
* **El Negocio:** Se convertirá en un activo digitalizado capaz de operar con consistencia y preparado para un eventual crecimiento en cobertura o sucursales.

---

### 6. Funcionalidades del MVP (Producto Mínimo Viable)
El MVP incluirá exclusivamente las características esenciales para validar y operar el nuevo flujo:

1. **Directorio Inteligente de Clientes (CRM Base):** Registro y consulta de perfiles de clientes vinculados a su número de teléfono.
2. **Catálogo y Pedido Rápido (Front-End Cliente):** Interfaz para selección de productos con opción de "Repetir mi último pedido" en 2 clics.
3. **Tablero Kanban de Despacho (Panel Dueño):** Gestión visual de estados del pedido: `Nuevo` -> `Asignado` -> `Entregado` -> `Cancelado`.
4. **Modulo de Instrucciones para Repartidores:** Vista optimizada donde el motoboy asignado consulta la dirección exacta, producto y monto a cobrar.
5. **Contador Automático de Fidelización:** Registro automático de compras de P13/Agua para aplicar el 100% de descuento en el pedido #9.

---

## Preguntas Abiertas
- ¿El cliente debe poder calificar la entrega (1 a 5 estrellas) desde la interfaz del MVP o se pospone para fases futuras?
- ¿El dueño requiere alertas audibles diferenciadas en el panel según el tipo de producto pedido (ej. pedidos B2B vs B2C)?

## Dependencias
- Aprobación de la visión del producto para proceder al desarrollo del Documento de Requisitos del Producto (`06-prd.md`).

## Referencias
- [00-project-charter.md](00-project-charter.md)
- [01-business-discovery.md](01-business-discovery.md)
- [02-current-state-analysis.md](02-current-state-analysis.md)
- [03-business-processes.md](03-business-processes.md)
- [04-business-rules.md](04-business-rules.md)

## Historial de Revisiones
| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.0 | 2026-07-23 | Lead Product Manager | Borrador inicial de Visión del Producto |

## Próximos Pasos
1. Revisión y validación de la Visión del Producto por parte del cliente.
2. Iniciar la Fase 7: **PRD** (`06-prd.md`) para estructurar los requerimientos funcionales detallados de cada módulo del MVP.
