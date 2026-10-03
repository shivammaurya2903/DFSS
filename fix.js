const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');
c = c.replace(/<section className="mb-8">\s*<h2[^>]*>Quick Folders<\/h2>[\s\S]*?<\/section>/g, '');
c = c.replace(/\/\/ Mock folders for UI since backend doesn't have folders yet\s*const folders = \[\]; \/\/ Fixed: Using real backend state/g, '');
fs.writeFileSync('frontend/src/pages/Dashboard.jsx', c);
