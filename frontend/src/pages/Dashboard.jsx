import React, { useState, useEffect } from 'react';
import { Folder, MoreHorizontal, LayoutGrid, List, File, FileText, Image as ImageIcon, CheckSquare, Settings, Share2, Info, X, Cloud, Loader2, AlertCircle, UploadCloud, HardDrive } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import * as fileService from '../services/file.service';

import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { refreshUser } = useAuth();
  const [viewMode, setViewMode] = useState('list');
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const filesData = await fileService.getFiles({ signal: controller.signal });
        setFiles(Array.isArray(filesData) ? filesData : []);
        // Also refresh user quota
        await refreshUser();
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error('Error fetching data:', err);
        setError("We couldn't load your files. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      controller.abort();
    };
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Frontend validation: Maximum individual upload size = 10 MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds the maximum upload size of 10 MB.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadStatus('Preparing upload...');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      setUploadStatus({
        fileName: file.name,
        progress: 0,
        loaded: 0,
        total: file.size,
        statusText: 'Preparing upload...'
      });

      const response = await fileService.uploadFile(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadStatus(prev => ({
            ...prev,
            progress: percentCompleted,
            loaded: progressEvent.loaded,
            statusText: percentCompleted === 100 ? 'Encrypting, chunking, and replicating...' : 'Uploading...'
          }));
        }
      });
      
      setUploadStatus('');
      await loadData();
      
      alert(`✓ Upload completed`);

    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      if (err.response?.data?.code === 'STORED_FILE_LIMIT_EXCEEDED') {
        setError(`File exceeds the 10 MB stored-file limit. This file could not be reduced below the 10 MB storage limit.`);
      } else if (err.response?.data?.code === 'USER_STORAGE_QUOTA_EXCEEDED') {
        setError(`Not enough storage. Please delete some files.`);
      } else {
        setError(`Upload failed: ${msg}`);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const getFileIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf': return <FileText className="text-red-500 w-8 h-8" />;
      case 'excel': case 'xlsx': case 'csv': return <FileText className="text-green-500 w-8 h-8" />;
      case 'figma': case 'png': case 'jpg': case 'jpeg': return <ImageIcon className="text-purple-500 w-8 h-8" />;
      case 'word': case 'docx': case 'doc': return <FileText className="text-blue-500 w-8 h-8" />;
      default: return <File className="text-gray-500 w-8 h-8" />;
    }
  };

  // Mock folders for UI since backend doesn't have folders yet
  const folders = []; // Fixed: Using real backend state

  return (
    <div className="flex h-full relative">
      <PageContainer className="flex-1 overflow-x-hidden">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Your Workspace
          </h1>
          <div className="relative">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button variant="primary">{uploading ? 'Uploading...' : 'Upload file'}</Button>
          </div>
        </div>
        <p className="text-gray-500 mb-6 text-sm">
          Manage your files, monitor storage usage, and keep your digital workspace organized.
        </p>

        {uploadStatus && (
          <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50 max-w-md">
            <div className="flex justify-between text-sm mb-2 text-gray-700">
              <span className="font-medium">{typeof uploadStatus === 'string' ? uploadStatus : uploadStatus.statusText}</span>
              {typeof uploadStatus === 'object' && <span>{uploadStatus.progress}%</span>}
            </div>
            {typeof uploadStatus === 'object' && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-[#8178F2] h-2 rounded-full transition-all duration-300" style={{ width: `${uploadStatus.progress}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="truncate max-w-[200px]">{uploadStatus.fileName}</span>
                  <span>{(uploadStatus.loaded / 1024 / 1024).toFixed(1)} MB / {(uploadStatus.total / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {folders.map(folder => (
              <div 
                key={folder.id} 
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  folder.active ? 'bg-[#f4f2ff] border-[#8178F2]/30' : 'bg-white border-gray-100 hover:border-[#8178F2]/30 hover:shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-xl ${folder.active ? 'bg-[#8178F2]/20' : 'bg-gray-50'}`}>
                    <Folder className={`w-6 h-6 ${folder.active ? 'text-[#8178F2]' : 'text-gray-400'}`} />
                  </div>
                  <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{folder.name}</h3>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{folder.count} files</span>
                  <span>{folder.storage}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Your Files</h2>
            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-[#f4f2ff] text-[#8178F2]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-[#f4f2ff] text-[#8178F2]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#8178F2]" />
              <p>Loading your files...</p>
            </div>
          ) : files.length === 0 && !error ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center text-center">
              <div className="bg-purple-50 p-4 rounded-full mb-4">
                <UploadCloud className="w-8 h-8 text-[#8178F2]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Your workspace is empty</h3>
              <p className="text-gray-500 text-sm max-w-sm mb-6">Upload your first file to start building your DFSS storage.</p>
              
              <div className="relative">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <Button variant="primary">{uploading ? 'Uploading...' : 'Upload file'}</Button>
              </div>
              {uploadStatus && typeof uploadStatus === "string" && <p className="text-xs text-[#8178F2] mt-3">{uploadStatus}</p>}
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Size</th>
                    <th className="px-6 py-4 font-medium">Owner</th>
                    <th className="px-6 py-4 font-medium w-12"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {files.map(file => (
                    <tr 
                      key={file._id || file.id} 
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedFile(file)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.extension || file.type)}
                          <span className="font-medium text-gray-700">{file.originalName || file.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{new Date(file.createdAt || file.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-500">{(file.size / 1024).toFixed(2)} KB</td>
                      <td className="px-6 py-4 text-gray-500">{file.owner?.name || file.owner || 'You'}</td>
                      <td className="px-6 py-4">
                        <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map(file => (
                <div 
                  key={file._id || file.id} 
                  className="bg-white p-4 rounded-xl border border-gray-100 hover:border-[#8178F2]/30 hover:shadow-sm cursor-pointer transition-all"
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="h-32 bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
                    {getFileIcon(file.extension || file.type)}
                  </div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-800 truncate pr-2" title={file.originalName || file.name}>{file.originalName || file.name}</h3>
                    <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(file.createdAt || file.date).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </PageContainer>

      {/* File Details Panel (Right Drawer) */}
      {selectedFile && (
        <div className="w-80 bg-white border-l border-gray-100 flex-shrink-0 flex flex-col absolute right-0 top-0 bottom-0 z-20 shadow-xl lg:relative lg:shadow-none transition-transform">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="font-semibold text-gray-800">File Details</h2>
            <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-gray-600 bg-white border border-gray-200 p-1.5 rounded-md shadow-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                {getFileIcon(selectedFile.extension || selectedFile.type)}
              </div>
              <h3 className="font-medium text-center text-gray-800 px-2 break-all">{selectedFile.originalName || selectedFile.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB • {selectedFile.mimetype || selectedFile.type}</p>
            </div>

            <div className="flex gap-2 mb-6">
              <Button variant="primary" className="flex-1 text-sm py-2" onClick={() => window.open(selectedFile.url || '#', '_blank')}>Download</Button>
              <Button variant="outline" className="flex-1 text-sm py-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600">Delete</Button>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1"><Info className="w-3 h-3"/> Property</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Size</span><span className="font-medium text-gray-800">{(selectedFile.size / 1024).toFixed(2)} KB</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-gray-800 truncate max-w-[120px]">{selectedFile.mimetype || selectedFile.type}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Owner</span><span className="font-medium text-gray-800">{selectedFile.owner?.name || 'You'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Uploaded</span><span className="font-medium text-gray-800">{new Date(selectedFile.createdAt || selectedFile.date).toLocaleDateString()}</span></div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1"><Settings className="w-3 h-3"/> System Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Chunks</span><span className="font-medium text-gray-800">{selectedFile.chunks || 3}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Replicas</span><span className="font-medium text-gray-800">{selectedFile.replicas || 2}</span></div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-1"><HardDrive className="w-3 h-3"/> Storage Information</h4>
                <div className="bg-[#f8fafc] border border-gray-100 p-3 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">Original size</span><span className="font-medium text-gray-500">{((selectedFile.originalSize || selectedFile.size) / 1024 / 1024).toFixed(2)} MB</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">Stored size</span><span className="font-medium text-[#8178F2]">{((selectedFile.storedSize || selectedFile.size) / 1024 / 1024).toFixed(2)} MB</span></div>
                  {selectedFile.compressionApplied && (
                    <>
                      <div className="flex justify-between"><span className="text-gray-500 text-xs">Space saved</span><span className="font-medium text-green-600">{(selectedFile.spaceSavedBytes / 1024 / 1024).toFixed(2)} MB</span></div>
                      <div className="flex justify-between border-t border-gray-200 pt-1 mt-1"><span className="text-gray-500 text-xs">Compression</span><span className="font-medium text-green-600">{((1 - selectedFile.compressionRatio) * 100).toFixed(1)}%</span></div>
                    </>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-1 mt-1"><span className="text-gray-500 text-xs">Encryption</span><span className="font-medium text-gray-800">✓ {selectedFile.encryptionInfo?.algorithm || 'AES-256'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">Integrity</span><span className="font-medium text-gray-800">✓ SHA-256</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">Chunks</span><span className="font-medium text-gray-800">{selectedFile.chunkCount || selectedFile.chunks || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 text-xs">Replication</span><span className="font-medium text-gray-800">{selectedFile.replicationFactor || 2} copies</span></div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


