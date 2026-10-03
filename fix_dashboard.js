const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');
c = c.replace(/\\\'lucide-react\\\'/g, "'lucide-react'");
fs.writeFileSync('frontend/src/pages/Dashboard.jsx', c);
