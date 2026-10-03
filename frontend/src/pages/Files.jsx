import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Search, Grid, List as ListIcon, Star,
  MoreVertical, Eye, Download, Trash2, Share2, X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';
import ShareModal from '../components/common/ShareModal';
import { formatBytes, formatDate, getFileDisplayName } from '../utils/formatters';
import { getFileIconComponent, getFileColorClass } from '../utils/fileIcons';
import * as fileService from '../services/file.service';

const SKELETON_CARDS = Array.from({ length: 6 });

const Files = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [sortBy, setSortBy] = useState('Date Modified');

  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [deleteFileItem, setDeleteFileItem] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActionMenuOpen(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch files
  const fetchFiles = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fileService.getFiles({ signal });
      setFiles(data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      setError('Failed to fetch files. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchFiles(controller.signal);
    return () => controller.abort();
  }, [fetchFiles]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Reset input
    e.target.value = null;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await fileService.uploadFile(formData, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      });
      addToast('File uploaded successfully.', 'success');
      fetchFiles();
    } catch (err) {
      addToast(err.userMessage || 'Failed to upload file.', 'error');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleToggleFavorite = async (e, file) => {
    e.stopPropagation();
    try {
      const updated = await fileService.toggleFavorite(file._id);
      setFiles(files.map(f => f._id === file._id ? { ...f, isFavorite: updated.isFavorite } : f));
    } catch (err) {
      addToast('Failed to update favorite.', 'error');
    }
    setActionMenuOpen(null);
  };

  const handleDownload = async (e, file) => {
    e.stopPropagation();
    try {
      await fileService.downloadFile(file._id, getFileDisplayName(file));
      addToast('Download started.', 'success');
    } catch (err) {
      addToast(err.userMessage || 'Failed to download file.', 'error');
    }
    setActionMenuOpen(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteFileItem) return;
    try {
      await fileService.deleteFile(deleteFileItem._id);
      setFiles(files.filter(f => f._id !== deleteFileItem._id));
      addToast('File deleted successfully.', 'success');
    } catch (err) {
      addToast(err.userMessage || 'Failed to delete file.', 'error');
    } finally {
      setDeleteFileItem(null);
    }
  };

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];

    // Search
    if (debouncedSearch) {
      const lowerQuery = debouncedSearch.toLowerCase();
      result = result.filter(f => getFileDisplayName(f).toLowerCase().includes(lowerQuery));
    }

    // Filter
    if (filterType !== 'All Types') {
      result = result.filter(f => {
        const mime = f.mimeType || '';
        switch (filterType) {
          case 'Documents': return mime.includes('pdf') || mime.includes('text') || mime.includes('document');
          case 'Images': return mime.startsWith('image/');
          case 'Videos': return mime.startsWith('video/');
          case 'Audio': return mime.startsWith('audio/');
          case 'Archives': return mime.includes('zip') || mime.includes('tar') || mime.includes('rar');
          case 'Other': return true;
          default: return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'Name') return getFileDisplayName(a).localeCompare(getFileDisplayName(b));
      if (sortBy === 'Date Modified') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'Size') return (b.storedSize || b.size) - (a.storedSize || a.size);
      return 0;
    });

    return result;
  }, [files, debouncedSearch, filterType, sortBy]);

  const renderGridCards = () => {
    if (loading) {
      return SKELETON_CARDS.map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-48 animate-pulse flex flex-col justify-between">
          <div className="w-12 h-12 bg-gray-200 rounded-full self-center mt-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mt-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mt-2"></div>
        </div>
      ));
    }

    if (filteredAndSortedFiles.length === 0) {
      return null; // Handled below
    }

    return filteredAndSortedFiles.map(file => {
      const displayName = getFileDisplayName(file);
      const isFav = file.isFavorite;

      return (
        <div
          key={file._id}
          onClick={() => navigate(`/files/${file._id}`)}
          className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow relative group cursor-pointer flex flex-col"
        >
          {/* Top Left: Favorite */}
          <button
            onClick={(e) => handleToggleFavorite(e, file)}
            className={`absolute top-3 left-3 z-10 p-1.5 rounded-md ${isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity hover:bg-gray-50`}
          >
            <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
          </button>

          {/* Top Right: Actions Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/files/${file._id}/view`); }}
              className="p-1.5 bg-white rounded-md border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-600"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => handleDownload(e, file)}
              className="p-1.5 bg-white rounded-md border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-600"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShareFile(file);
              }}
              className="p-1.5 bg-white rounded-md border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-600"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActionMenuOpen(actionMenuOpen === file._id ? null : file._id);
                }}
                className="p-1.5 bg-white rounded-md border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-600"
                title="More"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {actionMenuOpen === file._id && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-lg shadow-lg z-50 py-1">
                  <button
                    onClick={(e) => handleToggleFavorite(e, file)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {isFav ? 'Unfavorite' : 'Favorite'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShareFile(file);
                      setActionMenuOpen(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Share
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteFileItem(file);
                      setActionMenuOpen(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Icon Area */}
          <div className="flex-1 flex items-center justify-center pt-8 pb-4">
            <div className={`p-4 rounded-full ${getFileColorClass(file.mimeType)}`}>
              {getFileIconComponent(file.mimeType, 'lg')}
            </div>
          </div>

          {/* File Info */}
          <div className="text-center mt-auto">
            <h3 className="font-medium text-gray-800 text-sm truncate px-2" title={displayName}>
              {displayName}
            </h3>
            <div className="flex items-center justify-center gap-2 mt-1.5 text-xs text-gray-500">
              <span className="uppercase">{file.mimeType?.split('/')[1] || 'FILE'}</span>
              <span>•</span>
              <span>{formatBytes(file.storedSize || file.size)}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatDate(file.createdAt)}
            </div>
            
            {/* Compression Badge */}
            {file.compressionApplied && (
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
                Optimized
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  const renderListView = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <tbody>
              {SKELETON_CARDS.map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></td>
                  <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (filteredAndSortedFiles.length === 0) return null;

    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Stored Size</th>
                <th className="px-4 py-3">Orig. Size</th>
                <th className="px-4 py-3 text-center">Compression</th>
                <th className="px-4 py-3">Modified</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAndSortedFiles.map(file => {
                const displayName = getFileDisplayName(file);
                const isFav = file.isFavorite;
                return (
                  <tr 
                    key={file._id} 
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/files/${file._id}`)}
                  >
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${getFileColorClass(file.mimeType)}`}>
                        {getFileIconComponent(file.mimeType, 'sm')}
                      </div>
                      <span className="font-medium text-gray-800 truncate max-w-[200px]" title={displayName}>
                        {displayName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 uppercase text-xs">
                      {file.mimeType?.split('/')[1] || 'FILE'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {formatBytes(file.storedSize || file.size)}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatBytes(file.size)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {file.compressionApplied ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
                          Optimized
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleToggleFavorite(e, file)}
                          className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-gray-100 rounded"
                          title="Favorite"
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/files/${file._id}/view`); }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDownload(e, file)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShareFile(file); }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteFileItem(file); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F7FB] overflow-hidden">
      {/* Upload Progress Banner */}
      {uploading && (
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <span className="text-sm font-medium text-gray-700">Uploading file...</span>
            <div className="flex-1 max-w-md h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#8178F2] transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 w-12">{uploadProgress}%</span>
          </div>
          <button onClick={() => setUploading(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-6 md:p-8 flex-1 overflow-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Files</h1>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Loading...' : `${files.length} file${files.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          
          <button
            onClick={handleUploadClick}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#8178F2] hover:bg-[#6c63e6] text-white font-medium rounded-xl shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8178F2]/20 focus:border-[#8178F2] transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-2.5 pl-3 pr-8 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8178F2]/20 focus:border-[#8178F2] shadow-sm appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
            >
              <option>All Types</option>
              <option>Documents</option>
              <option>Images</option>
              <option>Videos</option>
              <option>Audio</option>
              <option>Archives</option>
              <option>Other</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2.5 pl-3 pr-8 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8178F2]/20 focus:border-[#8178F2] shadow-sm appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em` }}
            >
              <option>Date Modified</option>
              <option>Name</option>
              <option>Size</option>
            </select>

            <div className="flex bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#8178F2]/10 text-[#8178F2]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#8178F2]/10 text-[#8178F2]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => fetchFiles()} className="font-medium underline hover:text-red-700">Retry</button>
          </div>
        )}

        {/* Empty States */}
        {!loading && files.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-[#8178F2]/10 rounded-full flex items-center justify-center mb-6">
              <Upload className="w-8 h-8 text-[#8178F2]" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No files yet</h2>
            <p className="text-gray-500 mb-8 max-w-md">
              Upload your first file to securely store and share it across your devices.
            </p>
            <button
              onClick={handleUploadClick}
              className="px-6 py-2.5 bg-[#8178F2] hover:bg-[#6c63e6] text-white font-medium rounded-xl shadow-sm transition-colors"
            >
              Upload your first file
            </button>
          </div>
        )}

        {!loading && files.length > 0 && filteredAndSortedFiles.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-1">No files match your search</h3>
            <p className="text-gray-500 text-sm">Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* Content */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {renderGridCards()}
          </div>
        ) : (
          renderListView()
        )}
      </div>

      {/* Modals */}
      {deleteFileItem && (
        <ConfirmModal
          isOpen={!!deleteFileItem}
          title="Delete File"
          message={`Are you sure you want to delete "${getFileDisplayName(deleteFileItem)}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteFileItem(null)}
          isDestructive={true}
        />
      )}

      {shareFile && (
        <ShareModal
          isOpen={!!shareFile}
          file={shareFile}
          onClose={() => setShareFile(null)}
        />
      )}
    </div>
  );
};

export default Files;
