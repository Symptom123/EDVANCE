const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\Symptom_black\\Desktop\\SMS\\edusphere-react\\src\\components';
const files = ['Hero.jsx', 'Features.jsx', 'Showcase.jsx', 'HowItWorks.jsx', 'Testimonials.jsx', 'Analytics.jsx', 'Pricing.jsx', 'Contact.jsx'];

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Hero.jsx cleanup: Remove the subtle grid pattern inline div completely
  if (file === 'Hero.jsx') {
    content = content.replace(/\{\/\* Subtle grid pattern \*\/\}.*?<\/div>/s, '');
    // Remove inline styles from hero-content wrapper to let CSS handle it
    content = content.replace(/style=\{\{\s*textAlign:\s*'center',\s*maxWidth:\s*'820px',\s*margin:\s*'0 auto'\s*\}\}/, '');
  }

  // 2. Showcase.jsx cleanup: Remove the dark backgrounds or conflicting inline styles
  if (file === 'Showcase.jsx') {
    content = content.replace(/background:\s*'(?:#0[a-zA-Z0-9]+|rgba\([^)]+\))'/g, "background: '#ffffff'");
    content = content.replace(/border:\s*'1px solid rgba\([^)]+\)'/g, "border: '1px solid #e2e8f0'");
  }

  // 3. HowItWorks.jsx & Analytics.jsx: Remove background inline images that break the minimal look
  if (file === 'HowItWorks.jsx' || file === 'Analytics.jsx') {
    content = content.replace(/backgroundImage:\s*`url\("\$\{.*?_IMG\}"\)`/g, "background: 'none'");
  }

  // 4. Global cleanup: Remove reveal delay classes if they exist (we disabled the CSS rule, but good to clean up)
  content = content.replace(/reveal-delay-[0-9]/g, '');

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Cleanup script executed.');
