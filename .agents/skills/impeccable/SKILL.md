---
name: impeccable
description: Provee instrucciones para generar tokens de diseño de alta calidad, paletas de colores armónicas, tipografía moderna y presets de animación, evitando el diseño genérico de IA.
---
# Impeccable Design Skill

## Propósito
Este skill guía al **Designer Agent** para producir una capa visual premium, coherente y moderna para Center Gás Curitiba, enfocándose en la experiencia de usuario (UX) en dispositivos móviles.

## Directrices de Diseño
1. **Evitar Colores Genéricos:** Utilizar los tokens de color definidos en `07-ui-ux.md` (`#F6842F` y `#046BD2`). Derivar paletas tonales usando modelos HSL.
2. **Tipografía Moderna:** Implementar fuentes web modernas (ej. Inter, Roboto o Outfit) como predeterminadas en el proyecto Astro, evitando fuentes nativas aburridas.
3. **Estructura de Archivos:** Generar configuraciones limpias para Tailwind CSS (`tailwind.config.js`) y utilidades.
4. **Micro-animaciones:** No producir interfaces estáticas y aburridas. Generar presets de animación (por ejemplo con Framer Motion o Solid Spring) en `packages/ui/motion.ts` para hover states, transiciones de carrito y modales.
5. **No Tocar Lógica:** Tu único objetivo es la capa de presentación (HTML/CSS/Tokens).
