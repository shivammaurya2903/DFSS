const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/FileViewer.jsx', 'utf8');

const oldCheck = "if (mime.includes('text') || mime.includes('json') || mime.includes('xml') || mime.includes('javascript') || mime.includes('csv')) {";
const newCheck = `
          const isTextType = mime.startsWith('text/') || 
                             mime === 'application/json' || 
                             mime === 'application/javascript' || 
                             mime === 'text/csv' ||
                             mime === 'application/xml';
                             
          if (isTextType && !mime.includes('openxmlformats')) {
`;

c = c.replace(oldCheck, newCheck);
fs.writeFileSync('frontend/src/pages/FileViewer.jsx', c);
