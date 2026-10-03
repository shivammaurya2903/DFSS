const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/Files.jsx', 'utf8');

c = c.replace("import { Search, Grid, List as ListIcon", "import { Star, Search, Grid, List as ListIcon");

const func = `
  const handleToggleFavorite = async (e, id) => {
    e.stopPropagation();
    try {
      const updated = await toggleFavorite(id);
      setFiles(files.map(f => f._id === id ? { ...f, isFavorite: updated.isFavorite } : f));
    } catch (err) {
      alert('Failed to update favorite');
    }
  };
`;

if (!c.includes('handleToggleFavorite')) {
  c = c.replace('const handleDelete = async (id) => {', func + '\n  const handleDelete = async (id) => {');
}

const listBtn = `<button onClick={(e) => handleToggleFavorite(e, file._id)} className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-gray-100 rounded-lg transition-colors" title="Favorite"><Star className={\`w-4 h-4 \${file.isFavorite ? 'text-yellow-500 fill-current' : ''}\`} /></button>`;
const listEye = `<button onClick={(e) => { e.stopPropagation(); navigate(\`/files/\${file._id}/view\`); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>`;

c = c.replace(listEye, listBtn + '\n                          ' + listEye);

const menuBtn = `<button onClick={(e) => handleToggleFavorite(e, file._id)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Star className={\`w-4 h-4 \${file.isFavorite ? 'text-yellow-500 fill-current' : ''}\`} /> {file.isFavorite ? 'Unfavorite' : 'Favorite'}</button>`;
const menuEye = `<button onClick={(e) => { e.stopPropagation(); navigate(\`/files/\${file._id}/view\`); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Eye className="w-4 h-4" /> View</button>`;

c = c.replace(menuEye, menuBtn + '\n                        ' + menuEye);

fs.writeFileSync('frontend/src/pages/Files.jsx', c);
