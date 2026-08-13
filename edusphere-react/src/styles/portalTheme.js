// Balanced template design tokens — shared across all portals
export const T = {
  // Backgrounds
  pageBg: '#f5f3ef',
  sidebarBg: '#ffffff',
  cardBg: '#ffffff',
  hoverBg: '#f9f7f4',

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

// Helper: hex color to rgba
export const rgba = (hex, alpha) => {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return `rgba(37,99,235,${alpha})`;
  }
};

// Shared sidebar nav item style generator
export const navItemStyle = (isActive, accent) => ({
  display: 'flex', alignItems: 'center', gap: 12,
  width: '100%', padding: '10px 14px',
  background: isActive ? rgba(accent, 0.1) : 'transparent',
  color: isActive ? accent : '#6b6b6b',
  border: 'none', borderRadius: '8px',
  cursor: 'pointer', textAlign: 'left',
  fontSize: 14, fontWeight: isActive ? 600 : 500,
  fontFamily: '"DM Sans", system-ui, sans-serif',
  transition: 'all 0.15s ease',
  letterSpacing: '0.1px',
});

// Shared card style
export const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e8e4dc',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
};

// Shared input style
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
