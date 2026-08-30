# Protocolo Anti-Baneo WhatsApp — Center Gas

> **DOCUMENTO OBLIGATORIO.** Todo agente o desarrollador que toque los workflows de n8n o la integración de WhatsApp **DEBE** leer y respetar este protocolo antes de hacer cualquier cambio. Ignorar estas reglas puede resultar en el baneo permanente del número de WhatsApp del negocio.

---

## Contexto

Center Gas usa **Evolution API** (no oficial) para integrar WhatsApp. Esto implica un riesgo inherente de baneo por parte de Meta. Este protocolo define las 5 reglas de operación segura que minimizan ese riesgo al máximo posible.

---

## Regla 1: Delay Artificial Anti-Robot (WF-01)

**Fundamento:** Meta detecta respuestas con latencia 0ms como bots automáticos. Un operador humano tarda entre 3 y 10 segundos en leer y responder un mensaje.

**Implementación obligatoria en WF-01:**
- Insertar un nodo `Wait` entre el nodo de "Generar Token" y el nodo de "Enviar Auto-Respuesta".
- El tiempo de espera debe ser **aleatorio entre 4 y 9 segundos** (no fijo, para simular comportamiento humano).
- **NUNCA** configurar delay de 0ms o respuesta inmediata.

```
[Webhook Evolution] → [Validar Mensaje] → [Generar Token] → [WAIT 4-9s] → [Enviar Link]
```

---

## Regla 2: Rate Limiter por Número (WF-01)

**Fundamento:** Un cliente ansioso puede mandar el mismo mensaje 5 veces seguidas. Responder a todos quema el cupo diario y levanta alertas de spam en Meta.

**Implementación obligatoria en WF-01:**
- Antes de generar el token, verificar en `catalog_sessions` si ya existe una sesión válida (no expirada) para ese teléfono en los últimos 10 minutos.
- Si existe → no responder (ignorar el mensaje silenciosamente).
- Si no existe → continuar el flujo normal.

**Límite operacional:** Máximo 1 auto-respuesta por número cada **10 minutos**.

---

## Regla 3: Mensajes Humanizados, Nunca Genéricos

**Fundamento:** Meta penaliza mensajes idénticos enviados masivamente. Los mensajes personalizados tienen tasas de entrega significativamente mejores y menor probabilidad de ser reportados como spam.

### Mensaje WF-01 (Auto-respuesta Inbound) — OBLIGATORIO en Portugués:

```
Oi! 👋 Vi sua mensagem. 

Acesse o link abaixo para fazer seu pedido direto e com segurança:
🔗 https://[DOMINIO]/?token=[TOKEN]

O link é válido por 24 horas. Qualquer dúvida é só chamar! 😊
```

### Mensaje WF-02 "En Camino" — OBLIGATORIO personalizado:

```
📦 Seu pedido #[DISPLAY_ID] saiu para entrega! 🛵

Seu entregador é *[DRIVER_NAME]*. Ele está a caminho.
Tenha o vasilhame vazio em mãos, se aplicar.

Obrigado por escolher a Center Gas! 🙏
```

### Mensaje WF-02 "Entregado":

```
✅ Pedido #[DISPLAY_ID] entregue com sucesso!

Obrigado pela preferência! Até a próxima. 🙌
```

**Regla de oro:** Los mensajes siempre deben estar en **Portugués** (idioma local del cliente). Nunca en español.

---

## Regla 4: Número Dedicado y Separado

**Fundamento:** Si el número vinculado a Evolution es baneado, el daño debe ser controlado.

**Protocolo obligatorio:**
- El número conectado a Evolution API **nunca** debe ser el número personal del dueño.
- Usar una **línea prepaga** exclusiva para el negocio (costo: ~R$ 20 chip + R$ 10/mes de recarga mínima).
- El nombre de la cuenta de WhatsApp debe ser `Center Gas` con foto de perfil del negocio.
- El dueño mantiene su número personal **completamente separado** de esta infraestructura.

**En caso de baneo:**
1. Comprar un chip nuevo.
2. Escanear el QR en Evolution API con el chip nuevo.
3. El negocio opera de nuevo en menos de 15 minutos.

---

## Regla 5: Protocolo de Calentamiento (Warm-Up) del Número

**Fundamento:** Un número nuevo que de repente empieza a responder automáticamente a extraños es señalado inmediatamente. Un número con historial de conversas reales tiene reputación y baja probabilidad de baneo.

**Secuencia obligatoria antes del lanzamiento:**

| Semana | Acciones |
|--------|----------|
| **Semana 1** | Usar el chip en un celular físico. Mandar mensajes a amigos y familiares. Participar de grupos. NO conectar a Evolution todavía. |
| **Semana 2** | Conectar a Evolution. Activar **solo WF-02** (notificaciones de pedidos a clientes que ya compraron). Mínimo de pedidos reales. |
| **Semana 3** | Activar **WF-01** (auto-respuesta). Monitorear que los clientes no reporten como spam. |
| **Semana 4+** | Operación normal. Monitorear la salud de la instancia semanalmente. |

**Señal de alarma:** Si en cualquier momento Evolution reporta que el número fue desconectado inesperadamente, probablemente fue una restricción temporal de Meta. Esperar 24hs y reconectar. Si persiste, es baneo permanente → activar Regla 4.

---

## Plan de Migración a API Oficial (Futuro)

Cuando el volumen de pedidos justifique el costo, migrar a la **WhatsApp Cloud API oficial de Meta**:

| Aspecto | Evolution API | Meta Cloud API |
|---------|--------------|----------------|
| Riesgo de baneo | Alto | Zero |
| Costo | Infraestructura VPS | ~R$ 0,06/notificación |
| Setup | Inmediato | 2-3 días (verificación) |
| Escalabilidad | Limitada | Ilimitada |

**Regla de migración:** El código de n8n NO cambia. Solo se reemplaza la URL del nodo HTTP de Evolution por el endpoint oficial de Meta. La migración toma menos de 1 día de trabajo.

---

## Responsabilidades

| Rol | Responsabilidad |
|-----|----------------|
| `automation-agent` | Implementar Reglas 1, 2 y 3 en los workflows de n8n. |
| `devops-agent` | Configurar y monitorear la instancia de Evolution API. |
| **Dueño del negocio** | Cumplir Reglas 4 y 5 (comprar chip dedicado, hacer warm-up). |

---

## Historial de Revisiones

| Versión | Fecha | Autor | Descripción |
|---------|-------|-------|-------------|
| 1.0 | 2026-08-30 | Antigravity Squad | Creación inicial del protocolo anti-baneo. |
