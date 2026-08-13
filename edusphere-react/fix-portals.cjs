const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Symptom_black\\Desktop\\SMS\\edusphere-react\\src\\pages';
const files = ['AdminDashboard.jsx', 'TeacherPortal.jsx', 'StudentPortal.jsx', 'ParentPortal.jsx'];

const fullSObject = `  const s = {
    page: { display: 'flex', minHeight: '100vh', backgroundColor: '#fcfdfd', fontFamily: "'DM Sans', sans-serif", color: '#1e293b' },
    sidebar: { width: 280, backgroundColor: '#ffffff', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' },
    main: { flex: 1, padding: '48px 56px', overflowY: 'auto' },
    rightPanel: { width: 320, backgroundColor: '#ffffff', borderLeft: '1px solid #f1f5f9', padding: 32, display: 'flex', flexDirection: 'column', gap: 32 },
    card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 32, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    statCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    h1: { fontFamily: "'DM Serif Text', serif", fontSize: 32, margin: '0 0 8px', color: '#1e293b', fontWeight: 400 },
    h2: { fontFamily: "'DM Serif Text', serif", fontSize: 24, margin: '0 0 16px', color: '#1e293b', fontWeight: 400 },
    sub: { color: '#64748b', fontSize: 16, margin: '0 0 32px' },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
    input: { width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 15, fontFamily: "'DM Sans', sans-serif", backgroundColor: '#f8fafc', transition: 'all 0.2s', outline: 'none' },
    btn: (bg, text = 'white') => ({
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
      backgroundColor: bg, color: text, border: 'none', borderRadius: 9999,
      fontWeight: 500, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
      fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 14px rgba(0,0,0,0.05)'
    }),
    tag: (color) => ({
      display: 'inline-block', padding: '6px 14px', borderRadius: 9999,
      backgroundColor: typeof color === 'string' && color.startsWith('#') ? color + '22' : 'rgba(0,0,0,0.1)',
      color: color, fontSize: 13, fontWeight: 600
    })
  };`;

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the start of `const s = {` and find the matching closing brace.
  const startIndex = content.indexOf('const s = {');
  if (startIndex === -1) return;
  
  let braceCount = 0;
  let endIndex = -1;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        // Check for trailing semicolon
        if (content[endIndex] === ';') endIndex++;
        break;
      }
    }
  }
  
  if (endIndex !== -1) {
    // If there is any remaining broken stuff like `    },\n  };` we want to wipe it.
    // The previous bad replace inserted `};\n    },\n  };\n`. 
    // We can just regex replace from `const s = {` to the last `};` before `const navItems` or `return (`.
    const beforeS = content.substring(0, startIndex);
    
    // Find the next known block (e.g., `const navItems =` or `const UserTable =` or `const render`)
    let afterIndex = content.indexOf('const navItems', startIndex);
    if (afterIndex === -1) afterIndex = content.indexOf('const render', startIndex);
    if (afterIndex === -1) afterIndex = content.indexOf('return (', startIndex);
    
    if (afterIndex !== -1) {
      const afterS = content.substring(afterIndex);
      fs.writeFileSync(filePath, beforeS + fullSObject + '\n\n  ' + afterS, 'utf8');
    }
  }
});

console.log('Fixed broken portals.');
