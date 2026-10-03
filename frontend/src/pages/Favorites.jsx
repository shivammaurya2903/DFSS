import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { Star, Eye, Download, MoreVertical, Trash2, File as FileIcon, Share2, Loader, Image, Video, Music, FileText, Archive } from 'lucide-react';
import * as fileService from '../services/file.service';
import EmptyState from '../components/common/EmptyState';
import ShareModal from '../components/common/ShareModal';
import { useToast } from '../context/ToastContext';

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

const Favorites = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchFavorites(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchFavorites = async (signal) => {
    try {
      setLoading(true);
      const data = await fileService.getFavorites({ signal });
      setFiles(data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      setError('Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e, id) => {
    e.stopPropagation();
    try {
      await fileService.toggleFavorite(id);
      setFiles(files.filter(f => f._id !== id)); // Remove from list
    } catch (err) {
      addToast('Failed to update favorite status', 'error');
    }
  };

  const confirmDelete = (e, id) => {
    e.stopPropagation();
    setShowConfirmDelete(id);
    setActionMenuOpen(null);
  };

  const handleDelete = async (id) => {
    try {
      setShowConfirmDelete(null);
      await fileService.deleteFile(id);
      setFiles(files.filter(f => f._id !== id));
      addToast('File deleted successfully', 'success');
    } catch (err) {
      addToast('Failed to delete file', 'error');
    }
  };

  const handleDownload = async (e, file) => {
    e.stopPropagation();
    try {
      await fileService.downloadFile(file._id, file.filename);
      setActionMenuOpen(null);
    } catch (err) {
      addToast(err.message || 'Failed to download file', 'error');
    }
  };

  const handleShare = (e, file) => {
    e.stopPropagation();
    setShareFile(file);
    setActionMenuOpen(null);
  };

  const toggleActionMenu = (e, id) => {
    e.stopPropagation();
    if (actionMenuOpen === id) setActionMenuOpen(null);
    else setActionMenuOpen(id);
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader className="animate-spin text-[#8178F2] w-8 h-8" /></div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Star className="text-[#8178F2] w-6 h-6 fill-current" /> Favorites
        </h1>
      </div>
      
      {files.length === 0 ? (
        <EmptyState 
          icon={Star} 
          title="No favorites yet" 
          description="Files and folders you star will appear here for quick access." 
        />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {files.map(file => (
                <tr key={file._id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer group" onClick={() => navigate(`/files/${file._id}/view`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white">{getFileIcon(file.mimeType)}</div>
                      <div>
                        <p className="font-medium text-gray-700 truncate max-w-[300px]">{file.filename || file.originalName || file.name}</p>
                        <p className="text-xs text-gray-400">{file.mimeType || 'Unknown Type'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatSize(file.storedSize || file.size)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(file.updatedAt || file.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 relative">
                      <button onClick={(e) => handleToggleFavorite(e, file._id)} className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded" title="Remove from Favorites"><Star className="w-4 h-4 fill-current" /></button>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/files/${file._id}/view`); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDownload(e, file)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded" title="Download"><Download className="w-4 h-4" /></button>
                      <button onClick={(e) => toggleActionMenu(e, file._id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"><MoreVertical className="w-4 h-4" /></button>
                      
                      {actionMenuOpen === file._id && (
                        <div className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 text-left">
                          <button onClick={(e) => handleShare(e, file)} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Share2 className="w-4 h-4" /> Share</button>
                          <button onClick={(e) => confirmDelete(e, file._id)} className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {shareFile && <ShareModal file={shareFile} onClose={() => setShareFile(null)} />}
      
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-800 mb-2">Delete file?</h2>
            <p className="text-gray-600 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowConfirmDelete(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">Cancel</button>
              <button onClick={() => handleDelete(showConfirmDelete)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default Favorites;
