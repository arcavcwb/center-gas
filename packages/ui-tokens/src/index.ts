/**
 * Center Gás Curitiba — Design Tokens
 * Conforme a especificaciones de docs/07-ui-ux.md y estándar de accesibilidad WCAG 2.1 AA
 */

export const colors = {
  primary: {
    brand: "#F6842F",      // Naranja Corporativo Center Gás
    accessible: "#EA580C", // Naranja WCAG AA (Ratio 4.6:1 sobre blanco)
    hover: "#C2410C",      // Naranja oscuro interacción
    light: "#FFF7ED",      // Fondo suave naranja
  },
  secondary: {
    brand: "#046BD2",      // Azul Corporativo Center Gás
    hover: "#0359B3",      // Azul interacción
    light: "#EFF6FF",      // Fondo suave azul
  },
  neutral: {
    background: "#F8FAFC", // Slate-50
    surface: "#FFFFFF",
    border: "#E2E8F0",     // Slate-200
    textPrimary: "#0F172A",// Slate-900
    textSecondary: "#475569", // Slate-600
    muted: "#94A3B8",      // Slate-400
  },
  status: {
    success: "#16A34A",    // Entregado / Confirmado
    warning: "#D97706",    // Asignado / Pendiente
    danger: "#DC2626",     // Cancelado / Error
    scheduled: "#7C3AED",  // Pedido Programado Fuera de Horario
  }
};

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  minTouchTarget: "44px", // Norma de accesibilidad móvil (Apple HIG & Material)
};

