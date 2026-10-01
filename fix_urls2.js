const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            content = content.replace(/['"]??\$\{import\.meta\.env\.VITE_API_URL\}(.*?)?['"]?/g, '$');
            fs.writeFileSync(fullPath, content);
        }
    }
}
processDir(path.join(__dirname, 'frontend/src'));
