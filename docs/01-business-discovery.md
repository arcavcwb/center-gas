# 01 - Descubrimiento de Negocio (Business Discovery)

## Propósito
El propósito de este documento es definir y documentar el modelo de negocio actual de Center Gás Curitiba. Sirve como base para comprender quiénes son los clientes, qué productos se venden y cuáles son los dolores diarios que justifican este proyecto de transformación digital.

## Alcance
**Dentro del Alcance:**
- Modelo de negocio y canales de venta actuales.
- Tipos de clientes (B2C y B2B).
- Catálogo general de productos.
- Principales problemas operativos (pain points).

**Fuera del Alcance:**
- Diagramas de flujo de procesos detallados (se tratarán en `03-business-processes.md`).
- Arquitectura tecnológica de la solución.

## Contexto
Center Gás Curitiba opera bajo un modelo tradicional de entrega local ("last-mile delivery"). Actualmente, la interacción con el cliente y el despacho operativo recaen en un 100% sobre el propietario. Este enfoque manual y centralizado ha llegado a un límite de capacidad, donde la atención humana ya no puede escalar al mismo ritmo que la demanda sin generar retrasos o errores.

## Contenido Principal

### 1. Perfil General del Negocio
- **Empresa:** Center Gás Curitiba.
- **Ubicación Principal:** Curitiba, PR (atendiendo principalmente al barrio Pinheirinho y sus alrededores).
- **Core Business:** Venta al por menor y entrega a domicilio de gas licuado de petróleo (GLP) de la marca Liquigás y botellones de agua mineral de 20L.
- **Canal de Ventas Principal:** WhatsApp. Todo contacto, consulta y pedido se maneja a través de chats.

### 2. Segmentos de Clientes
- **Clientes Residenciales (B2C):** Familias y particulares que consumen cilindros estándar (P13) y agua para el hogar. Suelen priorizar la rapidez de entrega ("Super entrega rápida") y la facilidad de pago.
- **Clientes Comerciales (B2B):** Restaurantes, panaderías y pequeños comercios que requieren cilindros industriales (P20, P45). Tienen un consumo más alto y recurrente.

### 3. Portafolio de Productos
- **Gas GLP (Liquigás):** 
  - P5 (Compacto, uso ligero)
  - P8 (Intermedio)
  - P13 (Estándar residencial)
  - P20 y P45 (Uso comercial/industrial)
- **Agua Mineral (20L):** Diferentes marcas como Ouro Fino, Requinte, Font Life.
- **Venta Minorista Adicional (Cross-Selling):** Artículos de limpieza, utensilios para barbacoa, accesorios para instalación de gas y agua.

### 4. Puntos de Dolor Actuales (Pain Points)
- **Fricción Repetitiva:** El cliente, incluso siendo recurrente, debe explicar qué producto quiere y repetir su dirección y forma de pago en cada pedido.
- **Dependencia Absoluta (Cuello de Botella):** Si el propietario no responde el WhatsApp inmediatamente, el pedido no se concreta o se retrasa, afectando la percepción del servicio.
- **Pérdida de Inteligencia de Negocio:** El historial de consumo de cada cliente queda enterrado en los chats de WhatsApp. No existe una base de datos (CRM).
- **Fidelización Manual:** Resulta extremadamente complejo rastrear cuántas compras ha realizado un cliente para aplicar programas de fidelidad o promociones.

## Preguntas Abiertas
- ¿Cuál es el volumen promedio de pedidos diarios que se procesan actualmente? (Para dimensionar el tráfico esperado en la nueva plataforma).
- ¿Existen políticas de cobro de flete o la entrega siempre es gratuita dentro de la zona de cobertura?
- ¿Cuáles son los métodos exactos de pago que los repartidores aceptan contra entrega (PIX, efectivo, tarjeta)?

## Dependencias
- Resolución de las Preguntas Abiertas por parte del propietario.
- Revisión y aprobación de este documento antes de mapear los procesos detallados.

## Referencias
- [00-project-charter.md](00-project-charter.md) - Acta de Constitución del Proyecto

## Historial de Revisiones
| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.0 | 2026-07-22 | Lead Product Manager | Borrador inicial de Descubrimiento de Negocio |

## Próximos Pasos
1. Obtener respuestas a las preguntas abiertas y validación por parte del cliente.
2. Actualizar el estado en el `README.md`.
3. Iniciar la Fase 3: **Análisis del Estado Actual** (`02-current-state-analysis.md`).
