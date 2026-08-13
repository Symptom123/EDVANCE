const fs = require('fs');
const path = require('path');

const files = ['AdminDashboard.jsx', 'TeacherPortal.jsx', 'StudentPortal.jsx', 'ParentPortal.jsx'];
const dir = 'c:\\Users\\Symptom_black\\Desktop\\SMS\\edusphere-react\\src\\pages';

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Colors
  content = content.replace(/#0d0b1a/g, '#F9F9F6');
  content = content.replace(/#f1f5f9/g, '#0A192F');
  content = content.replace(/#94a3b8/g, '#475569');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.04\)/g, '#FFFFFF');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.08\)/g, '#E2E8F0');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, '#E2E8F0');
  
  // Typography
  content = content.replace(/'Fredoka',\s*sans-serif/g, "'Zilla Slab', serif");
  content = content.replace(/'Open Sans',\s*sans-serif/g, "'Work Sans', sans-serif");

  // Specific copy replacements for "demi data" (TeacherPortal example)
  content = content.replace(/Math Worksheet 3/g, 'Algebra II: Quadratics');
  content = content.replace(/History Essay/g, 'AP Euro: Industrial Revolution');
  content = content.replace(/Science Project/g, 'Biology Lab Report');
  
  fs.writeFileSync(filePath, content, 'utf8');
});

// Also inject the Google Fonts into index.html
const indexHtmlPath = 'c:\\Users\\Symptom_black\\Desktop\\SMS\\edusphere-react\\index.html';
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');
  if (!html.includes('Zilla+Slab')) {
    html = html.replace('</title>', `</title>\n    <link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600&family=Zilla+Slab:wght@400;600;700&display=swap" rel="stylesheet">`);
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
  }
}

console.log('Update complete.');
