// Balanced template design tokens — light and dark mode support
export const lightT = {
  // Backgrounds
  pageBg: '#f5f3ef',
  sidebarBg: '#ffffff',
  cardBg: '#ffffff',
  hoverBg: '#f9f7f4',
  inputBg: '#ffffff',
  tableHeaderBg: '#faf9f7',
  tableRowBorder: '#f0ede8',

  // Borders
  border: '#e8e4dc',
  borderLight: '#f0ede8',

  // Text
  text: '#1a1a1a',
  muted: '#6b6b6b',
  light: '#a0998c',

  // Fonts
  fontSerif: '"DM Serif Text", Georgia, serif',
  fontSans: '"DM Sans", system-ui, sans-serif',

  // Shadows
  shadow: '0 1px 4px rgba(0,0,0,0.07)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.08)',

  // Radii
  radius: '12px',
  radiusSm: '8px',
  radiusPill: '100px',
};

export const darkT = {
  // Backgrounds
  pageBg: '#0f172a',
  sidebarBg: '#1e293b',
  cardBg: '#1e293b',
  hoverBg: '#283347',
  inputBg: '#0f172a',
  tableHeaderBg: '#151f30',
  tableRowBorder: '#293548',

  // Borders
  border: '#334155',
  borderLight: '#293548',

  // Text
  text: '#f8fafc',
  muted: '#94a3b8',
  light: '#64748b',

  // Fonts
  fontSerif: '"DM Serif Text", Georgia, serif',
  fontSans: '"DM Sans", system-ui, sans-serif',

  // Shadows
  shadow: '0 1px 4px rgba(0,0,0,0.3)',
  shadowMd: '0 4px 16px rgba(0,0,0,0.4)',

  // Radii
  radius: '12px',
  radiusSm: '8px',
  radiusPill: '100px',
};

// Returns dynamic design token object based on mode
export const getTheme = (isDark = false) => (isDark ? darkT : lightT);

// Backward-compatible default light tokens
export const T = lightT;

// Helper: hex color to rgba
export const rgba = (hex, alpha) => {
  try {
    if (!hex || !hex.startsWith('#')) return `rgba(37,99,235,${alpha})`;
    const clean = hex.replace('#', '');
    let r, g, b;
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else {
      r = parseInt(clean.slice(0, 2), 16);
      g = parseInt(clean.slice(2, 4), 16);
      b = parseInt(clean.slice(4, 6), 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(37,99,235,${alpha})`;
  }
};

// Dynamic sidebar nav item style generator
export const navItemStyle = (isActive, accent, isDark = false) => {
  const theme = isDark ? darkT : lightT;
  return {
    display: 'flex', alignItems: 'center', gap: 12,
    width: '100%', padding: '10px 14px',
    background: isActive ? rgba(accent, isDark ? 0.22 : 0.1) : 'transparent',
    color: isActive ? accent : theme.muted,
    border: 'none', borderRadius: '8px',
    cursor: 'pointer', textAlign: 'left',
    fontSize: 14, fontWeight: isActive ? 600 : 500,
    fontFamily: '"DM Sans", system-ui, sans-serif',
    transition: 'all 0.15s ease',
    letterSpacing: '0.1px',
  };
};

// Dynamic card style getter
export const getCardStyle = (isDark = false) => {
  const theme = isDark ? darkT : lightT;
  return {
    background: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: theme.shadow,
    color: theme.text,
  };
};

// Backward-compatible static card style
export const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e8e4dc',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
};

// Dynamic input style getter
export const getInputStyle = (isDark = false) => {
  const theme = isDark ? darkT : lightT;
  return {
    width: '100%', padding: '12px 14px',
    fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 14,
    border: `1.5px solid ${theme.border}`, borderRadius: '8px',
    background: theme.inputBg, color: theme.text,
    outline: 'none', boxSizing: 'border-box',
  };
};

// Backward-compatible static input style
export const inputStyle = {
  width: '100%', padding: '12px 14px',
  fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: 14,
  border: '1.5px solid #e8e4dc', borderRadius: '8px',
  background: '#ffffff', color: '#1a1a1a',
  outline: 'none', boxSizing: 'border-box',
};

// Shared button style
export const btnStyle = (accent, outline = false) => ({
  padding: '10px 20px', borderRadius: '100px',
  border: outline ? `1.5px solid ${accent}` : 'none',
  background: outline ? 'transparent' : accent,
  color: outline ? accent : '#ffffff',
  fontFamily: '"DM Sans", system-ui, sans-serif',
  fontSize: 14, fontWeight: 600,
  cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', gap: 6,
  transition: 'opacity 0.15s',
  letterSpacing: '0.1px',
});

// Status badge
export const badge = (color, bg) => ({
  padding: '3px 10px', borderRadius: '100px',
  fontSize: 12, fontWeight: 600,
  background: bg, color,
});
