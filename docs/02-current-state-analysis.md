# 02 - Análisis del Estado Actual (Current State Analysis)

## Propósito
Este documento tiene como objetivo evaluar y documentar cómo funciona la operación de Center Gás Curitiba el día de hoy (estado AS-IS), identificando específicamente los cuellos de botella, las ineficiencias de los recursos y las fallas del sistema manual que limitan la escalabilidad del negocio.

## Alcance
**Dentro del Alcance:**
- Evaluación detallada del flujo de trabajo de recepción de pedidos actuales.
- Análisis del proceso de despacho (asignación a motoboys).
- Identificación del "Single Point of Failure" (Punto Único de Falla) operativo.
- Diagnóstico de la pérdida de información comercial (Data Loss).

**Fuera del Alcance:**
- Propuestas de rediseño de procesos (TO-BE) (se tratarán en `03-business-processes.md`).
- Recomendaciones de herramientas de software específicas.

## Contexto
Aunque el negocio de Center Gás Curitiba es rentable y tiene demanda asegurada por la naturaleza de los bienes de primera necesidad (gas y agua), sufre del síndrome del "fundador operador". Todo el peso del éxito de la transacción diaria descansa sobre la agilidad humana del propietario, creando un techo de cristal para el crecimiento de los ingresos.

## Contenido Principal

### 1. El Flujo de Trabajo Actual (AS-IS)
Actualmente, el ciclo de vida de un pedido típico transcurre de la siguiente manera:
1. **Iniciación:** El cliente contacta a la empresa por WhatsApp.
2. **Negociación:** El propietario responde (con base en su disponibilidad) y pregunta qué producto se desea.
3. **Recolección de Datos:** El propietario pregunta o confirma la dirección de entrega, sin importar si el cliente es nuevo o lleva años comprando.
4. **Pago:** El propietario pregunta el método de pago para que el repartidor lleve la terminal ("maquinita") correcta o el código PIX.
5. **Despacho:** El propietario decide qué motoboy está libre (o más cerca) y le envía los datos del pedido (frecuentemente por audio o mensajes sueltos).
6. **Entrega y Cierre:** El motoboy entrega el producto, cobra y luego reporta al dueño al volver a la base. 

### 2. Identificación de Cuellos de Botella (Bottlenecks)
- **Atención al Cliente Centralizada:** El WhatsApp está en un solo teléfono, manejado por una sola persona. Durante horas pico (ej. horas previas al almuerzo o la cena), el tiempo de respuesta aumenta, causando que algunos clientes busquen opciones más rápidas en la competencia.
- **Fricción por Repetición:** Aproximadamente el 60-80% de las preguntas de recolección de datos son redundantes para clientes recurrentes. Esto consume valiosos minutos por transacción.
- **Despacho Subóptimo:** La asignación de rutas se hace empíricamente. El dueño tiene que "recordar" dónde está cada repartidor.

### 3. Vulnerabilidades Operativas y Pérdida de Datos (Data Loss)
- **Single Point of Failure (SPOF):** Si el propietario sufre un imprevisto, se enferma o necesita descanso, la capacidad de venta del negocio cae al 0%.
- **Sin CRM (Customer Relationship Management):** Toda la inteligencia comercial (frecuencia de compra, clientes inactivos, preferencias) se pierde en el historial de chat de WhatsApp, el cual puede borrarse o volverse inmanejable.
- **Lealtad Invisible:** Sin un registro claro, las promociones como "acumula compras y gana un gas" se vuelven difíciles de controlar, lo que puede causar pérdida de confianza del cliente si se cometen errores.

## Preguntas Abiertas
- ¿Existe alguna métrica actual del tiempo promedio desde que el cliente manda el primer mensaje hasta que el pedido se asigna al motoboy?
- ¿Con qué frecuencia se pierden ventas porque el tiempo de respuesta en WhatsApp fue demasiado lento?
- ¿Cómo se manejan actualmente las excepciones, por ejemplo, cuando el cliente cancela el pedido mientras el motoboy va en camino?

## Dependencias
- Aprobación de este análisis por parte del cliente para asegurar que el diagnóstico es acertado antes de diseñar los procesos futuros (TO-BE).

## Referencias
- [00-project-charter.md](00-project-charter.md) - Acta de Constitución del Proyecto
- [01-business-discovery.md](01-business-discovery.md) - Descubrimiento de Negocio

## Historial de Revisiones
| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.0 | 2026-07-22 | Lead Product Manager | Borrador inicial de Análisis de Estado Actual |

## Próximos Pasos
1. Revisión de este diagnóstico con el cliente.
2. Actualización del estado en el `README.md`.
3. Iniciar la Fase 4: **Procesos de Negocio** (`03-business-processes.md`) para mapear visualmente el AS-IS vs TO-BE.
