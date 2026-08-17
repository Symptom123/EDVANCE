// src/styles/theme.js

// Light-mode pastel theme for the Edvance UI
// Uses soft peach background with teal accents, matching the user‑selected palette.

export const T = {
  // Core colors
  pageBg: "#fffaf5", // very light pastel peach
  sidebarBg: "#fdf6e9",
  accent: "#34d399", // teal‑green accent
  text: "#1f2937",
  muted: "#6b7280",
  light: "#9ca3af",
  border: "#e5e7eb",
  borderLight: "#d1d5db",

  // Typography
  fontSans: "'Inter', sans-serif",
  fontSerif: "'Playfair Display', serif",

  // Shadows / glassmorphism
  glass: "rgba(255,255,255,0.6)",
};

// Helper functions for UI styling (same signatures as existing code expects)
export const rgba = (hex, a = 1) => {
  // Simple conversion from hex to rgba string.
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${a})`;
};

export const btnStyle = (bg) => ({
  background: bg,
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 14px",
  cursor: "pointer",
  fontWeight: 500,
  fontFamily: T.fontSans,
  transition: "background 0.2s",
  ':hover': { background: rgba(bg, 0.85) },
});

export const navItemStyle = (active, accent) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 12px",
  borderRadius: 6,
  background: active ? rgba(accent, 0.15) : "transparent",
  color: active ? accent : "inherit",
  fontFamily: T.fontSans,
  cursor: "pointer",
});

export const cardStyle = {
  background: "rgba(255,255,255,0.9)",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
};

export const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: `1px solid ${T.border}`,
  borderRadius: 6,
  background: "#fff",
  color: T.text,
  fontFamily: T.fontSans,
};

export const badge = (bg, fg) => ({
  background: bg,
  color: fg,
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 600,
});
