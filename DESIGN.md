---
name: Center Gás Curitiba
description: Sistema de diseño oficial para distribución de gas y agua en Pinheirinho, Curitiba
colors:
  primary: "#F6842F"
  primary-accessible: "#EA580C"
  primary-hover: "#C2410C"
  secondary: "#046BD2"
  secondary-hover: "#0359B3"
  neutral-bg: "#F8FAFC"
  surface: "#FFFFFF"
  border: "#E2E8F0"
  text-primary: "#0F172A"
  text-secondary: "#475569"
  success: "#16A34A"
  warning: "#D97706"
  danger: "#DC2626"
  scheduled: "#7C3AED"
typography:
  display:
    fontFamily: "'DM Sans', sans-serif"
    fontWeight: 900
    letterSpacing: "-0.025em"
  body:
    fontFamily: "'DM Sans', sans-serif"
    fontSize: "1rem"
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  touch-min: "44px"
components:
  button-primary:
    backgroundColor: "{colors.primary-accessible}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "16px 24px"
---

# Design System: Center Gás Curitiba

## Overview
El sistema visual de Center Gás Curitiba combina la vitalidad de la energía doméstica (naranja corporativo) con la confiabilidad y frescura del suministro hídrico (azul corporativo), construido con un enfoque **mobile-first**, accesible bajo normas WCAG 2.1 AA y optimizado para interacción táctil en calle y hogar.

## Colors
- **Primario Corporativo:** `#F6842F` (Naranja Center Gás para logotipos, encabezados de acento y marcas).
- **Primario Accesible (WCAG AA):** `#EA580C` (Naranja oscuro con contraste > 4.6:1 sobre fondo blanco, reservado para botones de llamada a la acción y estados principales).
- **Secundario Corporativo:** `#046BD2` (Azul para navegación, detalles institucionales y elementos de agua).
- **Superficies y Neutros:** Escala `slate-*` (`slate-50` para fondo de aplicación, `slate-100` para controles inactivos, `slate-200` para bordes limpios y `slate-900` para textos de máxima legibilidad).
- **Estados:** Éxito (`#16A34A`), Alerta (`#D97706`), Peligro/Error (`#DC2626`), Agendado (`#7C3AED`).

## Typography
- **Familia principal:** `DM Sans`, sans-serif geométrica con excelente legibilidad en pantallas de baja y alta densidad.
- **Jerarquía:**
  - Títulos principales: `font-black text-xl sm:text-2xl tracking-tight`.
  - Subtítulos y etiquetas: `font-bold text-sm text-slate-700`.
  - Metadatos y ayuda: `font-medium text-xs text-slate-500`.

## Layout
- **Mobile-First B2C:** Ancho máximo contenido en `max-w-md mx-auto` con padding horizontal de 16px (`p-4`).
- **Sticky Checkout Bar:** En el catálogo móvil, la barra de confirmación se fija al pie de la pantalla (`fixed bottom-0 left-0 right-0 z-40`) cuando el carrito tiene productos, evitando el desplazamiento manual innecesario.
- **Panel Operativo B2B:** Cuadrícula responsiva de dos columnas (`grid grid-cols-1 md:grid-cols-2 gap-6`) para gestión de flujo en Kanban.

## Elevation & Depth
- **Bordes perimetrales limpios:** Todas las tarjetas y banners utilizan `border border-slate-200` o `border border-slate-300`.
- **Sombras suaves:** `shadow-xs` para estado de reposo, `shadow-md` para hover/elevación activa.
- **Glassmorphism:** `backdrop-blur-md bg-white/95` en la barra de navegación superior y barra flotante inferior.

## Shapes
- **Radio de curvatura:** Tarjetas en `rounded-2xl`, botones de acción en `rounded-xl`, pastillas de cantidad y steppers en `rounded-full`.
- **Área táctil mínima:** Estricto cumplimiento de **44x44px** (`minTouchTarget: 44px`) en todos los botones de incremento, decremento y acciones principales.

## Components
- **Steppers de Cantidad:** Botones circulares `w-11 h-11 min-w-[44px] min-h-[44px]` con fondo contrastado y números centrados no seleccionables.
- **Botón de Reparto Motoboy:** Altura prominente (`py-5`), color esmeralda (`bg-emerald-600`), texto en mayúsculas negritas y respuesta activa elástica (`active:scale-[0.98]`).
- **Navegación Dual:** Botones divididos al 50% para Google Maps y Waze en la tarjeta de entrega del repartidor.

## Do's and Don'ts
- ✅ **DO:** Utilizar siempre `#EA580C` para texto blanco sobre naranja para garantizar cumplimiento de contraste WCAG AA.
- ✅ **DO:** Añadir siempre `motion-reduce:animate-none` en animaciones continuas.
- ❌ **DON'T:** Nunca usar pestañas laterales gruesas `border-l-4` (anti-patrón de diseño de IA).
- ❌ **DON'T:** Nunca colocar `border-b-4` sobre contenedores con esquinas fuertemente redondeadas (`rounded-2xl`).
- ❌ **DON'T:** Jamás mencionar "entrega gratis" o "entrega grátis" en ninguna interfaz.
- ❌ **DON'T:** Nunca usar diálogos bloqueantes `window.alert()`; usar banners reactivos integrados en el componente.
