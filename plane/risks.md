# Plane Project Risk Register

## Risk Log

### Risk 1: Resistencia al Cambio por parte de los Repartidores (Motoboys)
* **Probability:** Media
* **Impact:** Alto
* **Description:** Los 3 repartidores están acostumbrados a recibir instrucciones por voz o texto libre. Interfaz móvil compleja podría ralentizar la entrega.
* **Mitigation Strategy:** Diseñar una interfaz con 1 solo botón principal ("Marcar Entregado"), botones táctiles grandes de 48px y capacitación presencial de 30 minutos.
* **Owner:** Lead Product Manager & Propietario

### Risk 2: Bloqueo del Número de WhatsApp por Políticas de Spam (Meta)
* **Probability:** Baja
* **Impact:** Crítico
* **Description:** Envío excesivo de mensajes automáticos no solicitados que provoquen suspensión de la línea principal de WhatsApp.
* **Mitigation Strategy:** Los mensajes automáticos solo se envían en respuesta a una interacción iniciada por el cliente (Inbound) o notificaciones explícitas de pedido en camino.
* **Owner:** Backend / Integration Engineer

### Risk 3: Conexión Celular Deficiente en Zonas de Entrega
* **Probability:** Alta
* **Impact:** Medio
* **Description:** Zonas del barrio Pinheirinho con baja señal 3G/4G impiden que el motoboy actualice el estado a "Entregado".
* **Mitigation Strategy:** El frontend de repartidores es estático (Astro), ultra-ligero y el propietario puede actualizar manualmente el estado desde el panel si el motoboy reporta por llamada.
* **Owner:** Technical Architect

### Risk 4: Flete Perdido por Cancelación en la Puerta (BR-007)
* **Probability:** Media
* **Impact:** Medio
* **Description:** El cliente anula el pedido cuando el motoboy ya llegó a la dirección.
* **Mitigation Strategy:** El sistema debe registrar la incidencia de "Cancelado en Puerta" para evaluar bloqueo temporal o advertencia en el perfil del cliente en el CRM.
* **Owner:** Lead Product Manager

### Risk 5: Discrepancia en el Registro de Envases Vacíos (Vasilhame BR-001)
* **Probability:** Media
* **Impact:** Alto
* **Description:** Entrega de gas sin recolección del cilindro vacío correspondiente, generando pérdida de activos.
* **Mitigation Strategy:** Requerir check obligatorio de "Envase Recogido" en la pantalla del motoboy antes de permitir cerrar la orden.
* **Owner:** Lead Product Manager
