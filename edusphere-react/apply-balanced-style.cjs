const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Symptom_black\\Desktop\\SMS\\edusphere-react\\src\\pages';
const files = ['AdminDashboard.jsx', 'TeacherPortal.jsx', 'StudentPortal.jsx', 'ParentPortal.jsx'];

const newStyles = `const s = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#fcfdfd', fontFamily: "'DM Sans', sans-serif", color: '#1e293b' },
  sidebar: { width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', padding: '24px 0', zIndex: 10 },
  logo: { padding: '0 32px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '12px' },
  brandName: { fontSize: '24px', fontWeight: '400', color: '#1e293b', fontFamily: "'DM Serif Text', serif" },
  navGroup: { padding: '24px 16px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', color: '#64748b', textDecoration: 'none', borderRadius: '12px', marginBottom: '4px', fontSize: '15px', fontWeight: '500', transition: 'all 0.2s' },
  navItemActive: { backgroundColor: '#059669', color: '#ffffff' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fcfdfd', overflowX: 'hidden' },
  header: { backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', padding: '20px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 5 },
  headerTitle: { margin: 0, fontSize: '24px', fontWeight: '400', color: '#1e293b', fontFamily: "'DM Serif Text', serif" },
  headerRight: { display: 'flex', alignItems: 'center', gap: '24px' },
  iconBtn: { background: 'none', border: '1px solid #f1f5f9', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' },
  avatar: { width: '40px', height: '40px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '15px' },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '15px', fontWeight: '600', color: '#1e293b' },
  userRole: { fontSize: '13px', color: '#64748b' },
  content: { padding: '48px', flex: 1 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '32px' },
  card: { backgroundColor: '#ffffff', borderRadius: '20px', padding: '32px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' },
  cardValue: { margin: '0', fontSize: '36px', fontWeight: '400', color: '#1e293b', fontFamily: "'DM Serif Text', serif" },
  cardSub: { margin: '8px 0 0', fontSize: '14px', color: '#64748b' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '20px', borderBottom: '1px solid #f1f5f9', color: '#1e293b', fontSize: '15px' },
  badge: { padding: '6px 12px', borderRadius: '9999px', fontSize: '13px', fontWeight: '600' },
  badgeActive: { backgroundColor: '#d1fae5', color: '#059669' },
  badgePending: { backgroundColor: '#fef3c7', color: '#d97706' },
  btnPrimary: { backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '9999px', fontWeight: '500', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.2)' }
};`;

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the 'const s = { ... };' block
  content = content.replace(/const s = \{[\s\S]*?\};\n/g, newStyles + '\n');
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Balanced styles applied to portals.');
