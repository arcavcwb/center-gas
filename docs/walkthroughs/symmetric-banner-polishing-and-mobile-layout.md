# Walkthrough Técnico: Refinamiento Simétrico de Banners Móviles & Corrección de Padding en Horario Comercial

## 1. Contexto y Problema Detectado
El usuario reportó desbordamiento visual, falta de padding y ruptura tipográfica en el banner superior móvil en resoluciones estrechas (375px):
- Los botones de idioma (`🇧🇷 PT` y `🇪🇸 ES`) se desbordaban verticalmente partiendo la bandera del texto.
- Existía un riesgo de doble renderizado al cambiar el horario comercial si se mantenían dos bloques `<Show>` disjuntos.
- El banner diurno de fallback sufría de truncamiento abrupto por el uso de `truncate` (`"🚚 Entrega Rápida no ..."` y `"Distribuidora no Pinheiri..."`).

## 2. Solución Arquitectónica Implementada

### A. Botones de Idioma Inquebrantables (`LanguageToggle.tsx`)
Se aseguraron las clases:
```tsx
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer
```
Garantizando que las banderas y el código ISO del idioma permanezcan en una sola línea horizontal bajo cualquier resolución o contenedor flex.

### B. Consolidación en un Único `<Show>` con Fallback (`Catalog.tsx`)
Se eliminó la presencia simultánea de dos componentes reactivos en SolidJS, consolidando el banner en:
```tsx
<Show when={isScheduled()} fallback={...}>
  {/* Banner Fuera de Horario */}
</Show>
```
Con un reloj reactivo sincronizado en `onMount` (`setInterval(..., 60000)`) que evita desfases de hidratación SSR.

### C. Arquitectura Simétrica de 3 Filas para Ambos Estados
Tanto el estado fuera de horario (`🌙 Indigo/Amber`) como el estado diurno (`🚚 Orange/Amber`) ahora comparten una estructura de 3 niveles con padding `p-4 rounded-2xl space-y-2.5`:
1. **Fila Superior:** Ícono temático + Título descriptivo a la izquierda, `LanguageToggle` a la derecha.
2. **Fila Central:** Mensaje claro y sin truncar (`leading-relaxed text-xs`), explicando los tiempos de entrega.
3. **Fila Inferior:** Pill badge con glassmorphism destacando la distribución en Pinheirinho y el horario/fecha de entrega.

### D. Contratos e i18n (`packages/contracts/src/i18n/dict.ts`)
Se agregaron las claves tipadas `bannerTitle` y `bannerDesc` para Portugués y Español con estricta paridad y validación en Vitest.

## 3. Verificación y Resultados
- **Impeccable Detect:** 0 anti-patterns y 0 advertencias de diseño.
- **Vitest Unit Tests:** 38/38 tests pasando (479ms).
- **Turborepo Build:** Monorepo completo compilado limpiamente (`site` en 7.23s, `web` en 12.9s).
- **Playwright Mobile Testing:** Inspección visual en viewport 375x700 confirmando balance estético, contraste WCAG 2.1 AA y cero overflow.
