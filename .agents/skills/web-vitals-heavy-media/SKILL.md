---
name: web-vitals-heavy-media
description: >
  Protocolo de optimización de Core Web Vitals (LCP, CLS, INP) para aplicaciones web
  con consumo intensivo de medios, imágenes pesadas o galerías de alta resolución (4K/HD).
  Implementa placeholders SVG progresivos, dimensiones fijas anti-shift, lazy loading nativo y fallbacks.
license: MIT
---

# Web Vitals & Heavy Media Optimization

En aplicaciones con medios visuales pesados (fotografías astronómicas de la NASA, catálogos gráficos, dashboards con avatares o mapas), las imágenes mal gestionadas destruyen el rendimiento, provocan saltos de diseño (CLS > 0.25) y ralentizan el Largest Contentful Paint (LCP > 4s). Esta skill define las técnicas obligatorias para mantener una fluidez de 60fps y puntuaciones Lighthouse > 90.

---

## 1. Reglas Innegociables

1. **Prevención de Cumulative Layout Shift (CLS):**
   Toda imagen o contenedor de medio debe tener una relación de aspecto reservada (`aspect-ratio: 16/9`, `aspect-square` o dimensiones explícitas `width` y `height`). El navegador nunca debe desplazar el contenido cuando la imagen termine de cargar.
2. **Estrategia LCP (Above-the-Fold vs Below-the-Fold):**
   - La imagen principal (hero o item del día) **NUNCA** debe llevar `loading="lazy"`. Debe llevar `loading="eager"` y opcionalmente `fetchpriority="high"`.
   - Todas las imágenes secundarias o de galería deben llevar `loading="lazy"` y `decoding="async"`.
3. **Carga Progresiva con Skeleton / Placeholders:**
   Mientras la imagen descarga, el contenedor debe mostrar un skeleton pulido o un placeholder vectorial estilizado, con animación `pulse` respetuosa con accesibilidad (`motion-reduce:animate-none`).
4. **Manejo Defensivo de Errores (Broken Images):**
   Prohibido mostrar el icono de imagen rota del navegador. Toda imagen debe contar con un listener `onError` que conmute a un estado de fallback con mensaje claro y opción de reintento.

---

## 2. Componente Canónico de Imagen Progresiva

```tsx
import React, { useState } from 'react';
import { ImageOff, RefreshCw } from 'lucide-react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  aspectRatio?: string; // e.g. 'aspect-video', 'aspect-square'
  priority?: boolean;
  className?: string;
}

export function ProgressiveImage({
  src,
  alt,
  aspectRatio = 'aspect-video',
  priority = false,
  className = '',
}: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-slate-900 rounded-2xl ${aspectRatio} ${className}`}>
      {/* 1. Placeholder Skeleton enquanto carrega */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-slate-800/80 animate-pulse motion-reduce:animate-none flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
        </div>
      )}

      {/* 2. Estado de Erro Amigável */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950 text-slate-400 border border-slate-800 rounded-2xl">
          <ImageOff className="w-10 h-10 text-slate-500 mb-2" />
          <p className="text-xs font-bold text-slate-300">Falha ao carregar a mídia de alta resolução</p>
          <p className="text-[11px] text-slate-500 mt-0.5">O servidor de mídia pode estar indisponível momentaneamente.</p>
          <button
            type="button"
            onClick={() => setError(false)}
            className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      {/* 3. Imagem Otimizada */}
      {!error && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
```

---

## 3. Checklist de Auditoría Web Vitals

- [ ] ¿La imagen hero tiene `fetchpriority="high"` y no tiene `lazy`?
- [ ] ¿Todos los contenedores tienen `aspect-ratio` o `width`/`height` explícito?
- [ ] ¿Los fallos de red 404/500 son capturados con interfaz de fallback?
- [ ] ¿Se utiliza compresión de imagen o formato moderno (WebP / AVIF) cuando la API lo ofrece?
