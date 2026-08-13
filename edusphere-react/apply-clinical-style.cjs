const fs = require('fs');
const path = require('path');

const newStyles = `const s = {
    page: { backgroundColor: '#f9fafa', minHeight: '100vh', display: 'flex', color: '#1e293b', fontFamily: '"Inter", "Work Sans", sans-serif' },
    sidebar: { width: 240, backgroundColor: '#ffffff', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' },
    main: { flex: 1, padding: '32px 40px', overflowY: 'auto', maxWidth: 'calc(100vw - 540px)', backgroundColor: '#f9fafa' },
    rightPanel: { width: 300, backgroundColor: '#ffffff', borderLeft: '1px solid #f1f5f9', flexShrink: 0, padding: 32, display: 'flex', flexDirection: 'column', gap: 28, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' },
    card: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
    h1: { fontFamily: '"Inter", "Work Sans", sans-serif', fontSize: 24, margin: '0 0 4px', color: '#0f172a', fontWeight: 700 },
    h2: { fontFamily: '"Inter", "Work Sans", sans-serif', fontSize: 13, margin: '0 0 16px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
    sub: { color: '#64748b', margin: 0, fontSize: 13 },
    btn: (bg, color = 'white') => ({ padding: '8px 16px', borderRadius: 8, border: '1px solid ' + (bg === 'white' ? '#e2e8f0' : bg), background: bg, color, fontWeight: 500, cursor: 'pointer', fontFamily: '"Inter", "Work Sans", sans-serif', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }),
    input: { width: '100%', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', color: '#0f172a', fontFamily: '"Inter", "Work Sans", sans-serif', outline: 'none', boxSizing: 'border-box', fontSize: 13 },
    label: { display: 'block', color: '#64748b', fontSize: 12, marginBottom: 6, fontWeight: 500 },
    statCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
    tag: (color) => {
      const bg = color === '#10b981' ? '#ecfdf5' : color === '#f59e0b' ? '#fffbeb' : color === '#ef4444' ? '#fef2f2' : color === '#3b82f6' ? '#eff6ff' : '#f1f5f9';
      const text = color === '#10b981' ? '#059669' : color === '#f59e0b' ? '#d97706' : color === '#ef4444' ? '#dc2626' : color === '#3b82f6' ? '#2563eb' : color;
      return { padding: '4px 10px', borderRadius: 100, fontSize: 12, fontWeight: 500, background: bg, color: text, display: 'inline-flex', alignItems: 'center', gap: '6px' };
    },
  };`;

const dir = 'c:\\Users\\Symptom_black\\Desktop\\SMS\\edusphere-react\\src\\pages';
const files = ['AdminDashboard.jsx', 'TeacherPortal.jsx', 'StudentPortal.jsx', 'ParentPortal.jsx'];

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the old const s = { ... } block
  // Using a robust regex to find the block
  const sStart = content.indexOf('const s = {');
  if (sStart !== -1) {
    let brackets = 0;
    let sEnd = -1;
    for (let i = sStart + 10; i < content.length; i++) {
      if (content[i] === '{') brackets++;
      if (content[i] === '}') {
        brackets--;
        if (brackets === 0) {
          sEnd = i + 1;
          if (content[sEnd] === ';') sEnd++;
          break;
        }
      }
    }
    if (sEnd !== -1) {
      content = content.substring(0, sStart) + newStyles + content.substring(sEnd);
    }
  }

  // Inject clinical dashboard top header structure (replacing the h1 + sub greeting)
  // Find standard greeting pattern
  content = content.replace(
    /<div>\s*<h1 style=\{s\.h1\}>(.*?)<\/h1>\s*<p style=\{s\.sub\}>(.*?)<\/p>\s*<\/div>/g,
    `<div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', margin: '0 0 8px' }}>GOOD MORNING</p>
        <h1 style={{ ...s.h1, fontSize: 28, letterSpacing: '-0.02em' }}>$1</h1>
        <p style={s.sub}>$2</p>
      </div>`
  );

  // Table row backgrounds
  content = content.replace(/borderBottom: '1px solid #FFFFFF'/g, "borderBottom: '1px solid #f1f5f9'");
  content = content.replace(/borderBottom: '1px solid rgba\(255,255,255,0\.05\)'/g, "borderBottom: '1px solid #f1f5f9'");

  fs.writeFileSync(filePath, content, 'utf8');
});

// Update index.css for global body background
const cssPath = 'c:\\Users\\Symptom_black\\Desktop\\SMS\\edusphere-react\\src\\index.css';
if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');
    css = css.replace(/--bg-primary: #F9F9F6;/g, '--bg-primary: #f9fafa;');
    css = css.replace(/--text-primary: #0A192F;/g, '--text-primary: #1e293b;');
    fs.writeFileSync(cssPath, css, 'utf8');
}

console.log('Restyle complete.');
