import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Grid, List as ListIcon, Filter, FileText, Image, Video, Music, Archive, MoreVertical, Eye, Download, Trash2, File as FileIcon, Clock, HardDrive, AlertCircle } from 'lucide-react';
import { getFiles, deleteFile, downloadFile } from '../services/file.service';

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const getFileIcon = (mimeType) => {
  if (!mimeType) return <FileIcon className="w-8 h-8 text-gray-400" />;
  if (mimeType.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
  if (mimeType.startsWith('video/')) return <Video className="w-8 h-8 text-purple-500" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8 text-yellow-500" />;
  if (mimeType.includes('pdf') || mimeType.includes('text')) return <FileText className="w-8 h-8 text-red-500" />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <Archive className="w-8 h-8 text-orange-500" />;
  return <FileIcon className="w-8 h-8 text-gray-400" />;
};

const Files = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterType, setFilterType] = useState('all');
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchFiles(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchFiles = async (signal) => {
    try {
      setLoading(true);
      const data = await getFiles({ signal });
      setFiles(data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      setError('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(id);
        setFiles(files.filter(f => f._id !== id));
        setActionMenuOpen(null);
      } catch (err) {
        alert('Failed to delete file');
      }
    }
  };

  const handleDownload = async (e, file) => {
    e.stopPropagation();
    try {
      await downloadFile(file._id, file.filename);
      setActionMenuOpen(null);
    } catch (err) {
      alert('Failed to download file');
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/files/${id}`);
  };

  const toggleActionMenu = (e, id) => {
    e.stopPropagation();
    if (actionMenuOpen === id) setActionMenuOpen(null);
    else setActionMenuOpen(id);
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.filename.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    if (!f.mimeType) return false;
    if (filterType === 'images') return f.mimeType.startsWith('image/');
    if (filterType === 'documents') return f.mimeType.includes('pdf') || f.mimeType.includes('text') || f.mimeType.includes('document');
    if (filterType === 'videos') return f.mimeType.startsWith('video/');
    if (filterType === 'audio') return f.mimeType.startsWith('audio/');
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.filename.localeCompare(b.filename);
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'size') return (b.storedSize || b.size) - (a.storedSize || a.size);
    return 0;
  });

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: '#8178F2'}}></div></div>;
  
  if (error) return <div className="p-8 text-center text-red-500 flex flex-col items-center gap-2"><AlertCircle /> {error}</div>;

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">My Files</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search files..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white"
              style={{focusRingColor: '#8178F2'}}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="documents">Documents</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
            <option value="audio">Audio</option>
          </select>
          
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="size">Sort by Size</option>
          </select>

          <div className="flex border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button 
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              className={`p-2 border-l border-gray-200 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 py-20">
            <div className="w-24 h-24 mb-6 rounded-full flex items-center justify-center" style={{backgroundColor: '#e6e4fc'}}>
              <FileIcon className="w-12 h-12" style={{color: '#8178F2'}} />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No files found</h2>
            <p className="text-gray-500">
              {files.length === 0 ? 'No files yet. Upload your first file to get started.' : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map(file => (
              <div 
                key={file._id} 
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative group"
                onClick={() => handleViewDetails(file._id)}
              >
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => toggleActionMenu(e, file._id)}
                    className="p-1.5 bg-white rounded-md shadow-sm border border-gray-100 hover:bg-gray-50"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  {actionMenuOpen === file._id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/files/${file._id}/view`); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Eye className="w-4 h-4" /> View</button>
                      <button onClick={(e) => handleDownload(e, file)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Download className="w-4 h-4" /> Download</button>
                      <button onClick={(e) => handleDelete(e, file._id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center text-center pt-4">
                  <div className="mb-4">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <h3 className="font-medium text-sm text-gray-800 mb-1 truncate w-full" title={file.filename}>{file.filename}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> {formatSize(file.storedSize || file.size)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(file.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Date Modified</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFiles.map(file => (
                  <tr key={file._id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleViewDetails(file._id)}>
                    <td className="px-6 py-4 flex items-center gap-3">
                      {getFileIcon(file.mimeType)}
                      <span className="font-medium text-gray-800 truncate max-w-xs" title={file.filename}>{file.filename}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatSize(file.storedSize || file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/files/${file._id}/view`); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={(e) => handleDownload(e, file)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                        <button onClick={(e) => handleDelete(e, file._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Files;
