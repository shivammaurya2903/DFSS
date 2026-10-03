import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, AlertCircle, FileText, Image as ImageIcon, Video, Music, File as FileIcon, Loader } from 'lucide-react';

const SharedView = () => {
  const { token } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadSharedData = async () => {
      try {
        setLoading(true);
        // Using direct fetch to bypass axios interceptors that might require auth
        const res = await fetch(`/api/shared/${token}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Shared link is invalid or expired.');
        }
        
        const data = await res.json();
        setFile(data.data || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadSharedData();
  }, [token]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/shared/${token}/download`);
      
      if (!res.ok) {
        const type = res.headers.get('content-type');
        if (type && type.includes('application/json')) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to download file.');
        }
        throw new Error('Failed to download file.');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Extract filename from headers if possible
      const contentDisposition = res.headers.get('content-disposition');
      let filename = file?.filename || file?.originalName || 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <FileIcon className="w-16 h-16 text-gray-400" />;
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-16 h-16 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="w-16 h-16 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-16 h-16 text-yellow-500" />;
    if (mimeType.includes('pdf') || mimeType.includes('text')) return <FileText className="w-16 h-16 text-red-500" />;
    return <FileIcon className="w-16 h-16 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <Loader className="w-10 h-10 animate-spin text-indigo-600 mb-4" style={{color: '#8178F2'}} />
        <p className="text-gray-500">Loading shared file...</p>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center border border-gray-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Unavailable</h2>
          <p className="text-gray-600 mb-6">{error || 'This shared link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-gray-100 text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center">
            {getFileIcon(file.mimeType || file.type)}
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2 break-words">
          {file.filename || file.originalName || file.name || 'Shared File'}
        </h1>
        
        <div className="text-sm text-gray-500 mb-8 space-y-1">
          {file.size && <p>Size: {(file.size / 1024).toFixed(2)} KB</p>}
          {(file.mimeType || file.type) && <p>Type: {file.mimeType || file.type}</p>}
        </div>

        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70"
          style={{backgroundColor: '#8178F2'}}
        >
          {downloading ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {downloading ? 'Downloading...' : 'Download File'}
        </button>
      </div>
    </div>
  );
};

export default SharedView;
