# Artículo 1: De la Libreta y WhatsApp a la Plataforma Digital
## Cómo descubrimos y modelamos el negocio real de Center Gás Curitiba

> **Serie:** Construyendo en Público — De 0 a Producción con un Squad Agéntico (Parte 1 de 3)  
> **Autor:** Antigravity Squad & Lead de Proyecto  
> **Tags:** #SoftwareArchitecture #ProductDiscovery #Supabase #Astro #Nextjs #BuildingInPublic

---

### El Espejismo del "Simple E-commerce"

Cuando alguien escucha *"vamos a digitalizar una distribuidora de gas y agua"*, la respuesta automática de la mayoría de los desarrolladores suele ser: *"Ah, eso es un CRUD típico: metes un WooCommerce, o una tienda Shopify, o un carrito en React con Stripe y listo en un fin de semana"*.

La realidad operativa en el terreno es diametralmente opuesta.

En el barrio de **Pinheirinho (Curitiba, Brasil)**, **Center Gás** abastece a cientos de familias con gas de cocina (GLP P13 de Liquigás) y galones de agua mineral de 20 litros. Durante años, la empresa funcionó con una sola persona (el dueño) respondiendo mensajes de WhatsApp en su teléfono personal a velocidad de vértigo, anotando direcciones en papeles o notas sueltas, gritando pedidos a los tres motoboys de la flota y calculando vueltos de memoria.

El desafío no era *"hacer una tienda bonita"*. El desafío era **digitalizar la operación sin romper la inmediatez a la que el cliente de barrio está acostumbrado**, y sin ignorar las complejidades logísticas que un e-commerce tradicional desconoce por completo.

---

### Los 4 "Gotchas" de la Vida Real que Ningún Tutorial Enseña

Durante la fase de **Business Discovery** (documentada en `docs/01-business-discovery.md` y `docs/04-business-rules.md`), descubrimos cuatro reglas de negocio críticas que dictaron toda la arquitectura del sistema:

#### 1. El Misterio del "Vasilhame" (Casco Vacío — Regla BR-002)
El gas de cocina no se vende como una camiseta. El cliente no compra el cilindro metálico; compra el contenido (el gas). 
- Si el cliente entrega un cilindro vacío homologado al recibir el nuevo, solo paga la **recarga** (ej. R$ 105,00).
- Si el cliente es nuevo o no tiene envase para devolver, debe comprar el cilindro metálico completo (**casco novo**), lo que añade una tasa inmediata de **+ R$ 200,00**.
- **El dilema técnico:** Si el frontend calcula este total de forma ingenua, cualquier usuario puede manipular el JavaScript y pagar R$ 105,00 sin entregar el casco. La validación tuvo que blindarse transaccionalmente en la base de datos (PostgreSQL RPC con `SECURITY DEFINER`) y validarse doblemente en la app móvil del repartidor al momento de la entrega en puerta.

#### 2. La Dictadura del Efectivo y el "Troco para X" (ISSUE-303)
En la periferia urbana, una gran porción de las transacciones no se realiza por tarjeta ni por transferencia instantánea (PIX), sino en dinero físico en efectivo (*dinheiro vivo*). 
Si un pedido cuesta R$ 115,00 y el cliente paga con un billete de R$ 200,00, el motoboy **no puede llegar a la puerta sin el cambio exacto (R$ 85,00)**. El flujo de checkout debía exigir obligatoriamente el campo `troco_para` y calcular de forma automática e inequívoca el vuelto a devolver en la comanda del repartidor.

#### 3. Combos Inteligentes y Descuentos Cruzados (ISSUE-302)
En el negocio del gas, el margen está en la frecuencia y la venta cruzada: quien pide un botijón de gas casi siempre necesita un bidón de agua mineral de 20L. Implementamos una regla de negocio viva: si el carrito detecta `1x Gas P13` + `1x Agua 20L`, el sistema descuenta automáticamente **R$ 5,00** del total, incentivando el ticket promedio sin requerir cupones complejos.

#### 4. Horarios Comerciales y Agendamiento Fuera de Turno (ISSUE-703)
Center Gás opera de lunes a sábado de **08:00 a 20:00**. Pero los clientes cocinan los domingos por la noche y se dan cuenta de que el gas se agotó a las 23:00. 
En lugar de mostrar un frustrante mensaje de *"Cerrado, vuelva mañana"*, la plataforma detecta automáticamente la zona horaria (`America/Sao_Paulo`). Si está fuera de horario o es domingo, el catálogo entra en **Modo Agendamento**: le informa al cliente con un banner amigable que su pedido será despachado como primera prioridad al día siguiente hábil a las 08:30, capturando la venta en lugar de perderla frente a la competencia.

---

### La Decisión de Arquitectura: Monorepo Híbrido Zero-Trust

Para soportar estas dinámicas sin incurrir en costos exorbitantes de infraestructura ni tiempos de carga lentos, descartamos los servidores tradicionales de Node/Express y optamos por una **topología híbrida en Turborepo con pnpm**:

```
                                 ┌───────────────────────────────┐
                                 │      TURBOREPO MONOREPO       │
                                 └───────────────┬───────────────┘
                                                 │
                  ┌──────────────────────────────┴──────────────────────────────┐
                  ▼                                                             ▼
     ┌────────────────────────┐                                    ┌────────────────────────┐
     │       apps/site        │                                    │        apps/web        │
     │  Astro 5 + SolidJS     │                                    │   Next.js 15 (React)   │
     │  (Catálogo B2C + App   │                                    │  (Panel B2B Dueño,     │
     │   Móvil Repartidores)  │                                    │   Kanban en Tiempo Real│
     │  Cero JS, Carga < 1s   │                                    │   y Métricas de Turno) │
     └────────────┬───────────┘                                    └────────────┬───────────┘
                  │                                                             │
                  └──────────────────────────────┬──────────────────────────────┘
                                                 │ Consume Contratos
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │     packages/contracts      │
                                  │      Zod Data Schemas       │
                                  │ (Única Fuente de Tipado TS) │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │     Supabase PostgreSQL     │
                                  │   Row Level Security (RLS)  │
                                  │   RPCs Transaccionales      │
                                  │   WebSockets Realtime       │
                                  └─────────────────────────────┘
```

1. **`apps/site` (Catálogo Móvil B2C + App del Repartidor):** Construido con **Astro 5** y **SolidJS** para las islas interactivas. ¿Por qué Astro? Porque el cliente que pide gas desde la calle o con señal móvil débil no puede esperar 5 segundos a que descargue un bundle masivo de JavaScript. El resultado: carga inicial en menos de 800ms con arquitectura de islas.
2. **`apps/web` (Centro de Despacho B2B):** Construido con **Next.js 15 (App Router y Turbopack)** y **Tailwind CSS**. Es la consola del dueño: un tablero Kanban con conexión WebSocket persistente a `Supabase Realtime`. Cada vez que un cliente pide o un motoboy entrega, la tarjeta cambia de columna sin recargar la pantalla.
3. **`packages/contracts`:** La única fuente de verdad. Ni el frontend inventa campos ni el backend asume datos: esquemas **Zod** estrictos que validan pedidos, pagos y coordenadas con 38 pruebas unitarias automatizadas.

---

### La Regla de Oro Innegociable

Durante todo el descubrimiento y modelado del producto, se impuso una restricción inamovible: **La "Regra de Ouro"**.
> *"Está terminantemente prohibido usar la frase 'entrega gratis' o 'entrega grátis' en cualquier texto, banner, metadato o código de la plataforma."*

En este modelo de negocio, el costo de transporte ya está incorporado en la estructura de precios del gas y agua. Prometer "envío gratis" degrada la percepción del servicio y genera fricciones regulatorias y comerciales. Esta directiva fue codificada tanto en las reglas de linting como en las pruebas de regresión.

---

### Próxima Entrega: La Revolución Agéntica

Teníamos el modelo de negocio, las reglas duras y la arquitectura elegida. Pero, ¿cómo se construye una plataforma completa con dos aplicaciones web, base de datos relacional segura, app para choferes, panel administrativo y flujos de mensajería sin un ejército de programadores humanos y sin caer en el caos del código generado por IA?

En el **Artículo 2**, revelamos la maquinaria interna del **Antigravity Squad**: cómo coordinamos 10 agentes de IA autónomos operando bajo el triángulo de gobernanza **Git × Plane × Humano**.
