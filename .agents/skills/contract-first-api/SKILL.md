---
name: contract-first-api
description: >
  Protocolo innegociable de modelado Contract-First y validación en runtime con Zod.
  Utilizar en toda integración con APIs externas (NASA, Evolution, WhatsApp, Webhooks, BaaS)
  o comunicación inter-servicios. Prohíbe el uso de 'any' o asunciones sobre payloads externos.
  Garantiza tipado estático inferido (z.infer) y manejo defensivo mediante safeParse.
license: MIT
---

# Contract-First API & Runtime Validation

Eres un arquitecto enfocado en la robustez de datos. Las APIs externas fallan, cambian de esquema sin aviso y devuelven valores nulos o tipos inesperados. Esta skill impone la regla de oro: **Nunca consumas un endpoint sin un contrato Zod previo.**

---

## 1. Reglas Innegociables

1. **Cero `any` o asunciones en respuestas HTTP:**
   Toda respuesta de red (`fetch`, webhooks, consultas RPC) debe ser parseada a través de un esquema Zod.
2. **Uso exclusivo de `safeParse`:**
   Prohibido usar `.parse()` directo en flujos de producción donde un error de validación tumbaría la interfaz o el proceso. Usar siempre `schema.safeParse(data)` y manejar el caso de error de forma elegante y defensiva.
3. **Inferencia de tipos:**
   Los tipos de TypeScript nunca se escriben a mano de forma redundante; se derivan automáticamente del esquema:
   ```typescript
   export const ApodSchema = z.object({ ... });
   export type ApodData = z.infer<typeof ApodSchema>;
   ```
4. **Campos opcionales vs nulables explícitos:**
   Diferenciar rigurosamente `.optional()` (puede no venir en el payload) de `.nullable()` (el backend puede retornar `null`).
5. **Transformaciones y Sanitización:**
   Utilizar `.transform()` para normalizar fechas (`new Date(...)`), números (`Number(...)`) y cadenas limpias en el punto de entrada.

---

## 2. Patrón Canónico de Integración

```typescript
import { z } from 'zod';

// 1. Definición estricta del contrato
export const ExternalItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().default('Sem título'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)'),
  media_type: z.enum(['image', 'video']).default('image'),
  url: z.string().url('URL de mídia inválida'),
  hdurl: z.string().url().optional().nullable(),
  explanation: z.string().default(''),
});

export type ExternalItem = z.infer<typeof ExternalItemSchema>;

// 2. Cliente de consumo defensivo
export async function fetchExternalItem(date?: string): Promise<{ data: ExternalItem | null; error: string | null }> {
  try {
    const url = new URL('https://api.external.com/item');
    if (date) url.searchParams.set('date', date);

    const response = await fetch(url.toString());
    if (!response.ok) {
      return { data: null, error: `Falha na requisição HTTP: ${response.status} ${response.statusText}` };
    }

    const raw = await response.json();
    const result = ExternalItemSchema.safeParse(raw);

    if (!result.success) {
      console.error('[Contract Error] Discrepância de schema detectada:', result.error.format());
      return { data: null, error: 'O servidor retornou uma resposta em formato inesperado.' };
    }

    return { data: result.data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro de conexão de rede.';
    return { data: null, error: message };
  }
}
```

---

## 3. Checklist de Verificación de Contratos

- [ ] ¿El esquema cubre todos los campos requeridos por la UI?
- [ ] ¿Los campos opcionales tienen valores predeterminados seguros (`.default(...)`)?
- [ ] ¿Se utiliza `safeParse` en vez de `parse`?
- [ ] ¿El tipo TypeScript está exportado mediante `z.infer`?
- [ ] ¿La interfaz muestra un estado de fallback amigable si el contrato falla?
