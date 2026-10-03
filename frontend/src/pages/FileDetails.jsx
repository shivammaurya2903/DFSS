import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Eye, FileText, Image, Video, Music, Archive, File as FileIcon,
  HardDrive, Shield, CheckCircle, Activity, Server, Clock, Trash2, Edit
} from 'lucide-react';
import { getFileDetails, downloadFile, deleteFile } from '../services/file.service';
import { useToast } from '../context/ToastContext';

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const getFileIcon = (mimeType) => {
  if (!mimeType) return <FileIcon className="w-12 h-12 text-gray-400" />;
  if (mimeType.startsWith('image/')) return <Image className="w-12 h-12 text-blue-500" />;
  if (mimeType.startsWith('video/')) return <Video className="w-12 h-12 text-purple-500" />;
  if (mimeType.startsWith('audio/')) return <Music className="w-12 h-12 text-yellow-500" />;
  if (mimeType.includes('pdf') || mimeType.includes('text')) return <FileText className="w-12 h-12 text-red-500" />;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <Archive className="w-12 h-12 text-orange-500" />;
  return <FileIcon className="w-12 h-12 text-gray-400" />;
};

const FileDetails = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  useEffect(() => {
    fetchFile();
  }, [fileId]);

  const fetchFile = async () => {
    try {
      setLoading(true);
      const data = await getFileDetails(fileId);
      setFile(data);
    } catch (err) {
      setError('Failed to fetch file details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadFile(file._id, file.filename);
    } catch (err) {
      addToast('Failed to download file', 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(file._id);
        navigate('/files');
        addToast('File deleted', 'success');
      } catch (err) {
        addToast('Failed to delete file', 'error');
      }
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor: '#8178F2'}}></div></div>;
  if (error || !file) return <div className="p-8 text-center text-red-500">{error || 'File not found'}</div>;

  const savedSpace = file.size - (file.storedSize || file.size);
  const compressionRatio = file.size ? ((savedSpace / file.size) * 100).toFixed(1) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto h-full overflow-auto bg-gray-50">
      <button 
        onClick={() => navigate('/files')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Files
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-xl" style={{backgroundColor: '#e6e4fc'}}>
            {getFileIcon(file.mimeType)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1 break-all">{file.filename}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><HardDrive className="w-4 h-4" /> {formatSize(file.size)}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDate(file.createdAt)}</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{file.mimeType || 'Unknown type'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/files/${file._id}/view`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            <Eye className="w-4 h-4" /> View
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 font-medium transition-opacity"
            style={{backgroundColor: '#8178F2'}}
          >
            <Download className="w-4 h-4" /> Download
          </button>
          <button 
            onClick={handleDelete}
            className="flex items-center justify-center p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Storage Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" style={{color: '#8178F2'}} /> Storage Efficiency
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-500">Original Size</span>
              <span className="font-medium text-gray-800">{formatSize(file.size)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-500">Stored Size</span>
              <span className="font-medium text-gray-800">{formatSize(file.storedSize || file.size)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-gray-500">Space Saved</span>
              <span className="font-medium text-green-600">{formatSize(savedSpace)} ({compressionRatio}%)</span>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Compression</span>
                <span className="font-medium">{compressionRatio}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(compressionRatio, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" style={{color: '#8178F2'}} /> Security & Integrity
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800 text-sm">End-to-End Encryption</h3>
                <p className="text-green-600 text-xs mt-1">File is encrypted at rest using AES-256-GCM.</p>
              </div>
            </div>
            
            <div>
              <span className="block text-sm text-gray-500 mb-1">File Hash (SHA-256)</span>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs font-mono text-gray-600 break-all">
                {file.hash || 'Not available'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details (Expandable) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <button 
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <span className="font-semibold text-gray-800 flex items-center gap-2">
            <Server className="w-5 h-5" style={{color: '#8178F2'}} /> Technical Details
          </span>
          <span className="text-sm font-medium" style={{color: '#8178F2'}}>
            {detailsExpanded ? 'Hide' : 'Show'} Details
          </span>
        </button>
        
        {detailsExpanded && (
          <div className="p-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Chunk Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Total Chunks</span>
                    <span className="font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded text-sm">{file.chunks?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Replication Factor</span>
                    <span className="font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded text-sm">{file.replicationFactor || 3}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Node Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Primary Node</span>
                    <span className="font-medium text-gray-800 text-sm">
                      {file.chunks && file.chunks[0] && file.chunks[0].nodeId ? file.chunks[0].nodeId.name || file.chunks[0].nodeId : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Replica Nodes</span>
                    <span className="font-medium text-gray-800 text-sm">Multiple</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDetails;
