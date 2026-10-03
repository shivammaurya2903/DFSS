import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, AlertCircle, Cloud, Loader, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const SharedView = () => {
  const { token } = useParams();
  const { addToast } = useToast();
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [downloading, setDownloading] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewType, setPreviewType] = useState(null); // 'image', 'text', 'pdf', 'video', 'audio', 'none'
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const loadSharedData = async () => {
      try {
        setLoading(true);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await fetch(`${baseUrl}/files/shared/${token}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'This shared link is no longer valid or has expired.');
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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/files/shared/${token}/download`);
      
      if (!res.ok) {
        throw new Error('Failed to download file. Link might be expired.');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      let filename = file?.filename || file?.originalName || 'download';
      const contentDisposition = res.headers.get('content-disposition');
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
      addToast('Download started successfully', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async () => {
    try {
      setPreviewLoading(true);
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/files/shared/${token}/view`);
      
      if (!res.ok) throw new Error('Preview not available');
      
      const mime = file?.mimeType || file?.type || '';
      const blob = await res.blob();
      
      if (mime.startsWith('image/')) {
        setPreviewType('image');
        setPreviewContent(URL.createObjectURL(blob));
      } else if (mime.startsWith('text/') || mime === 'application/json' || mime === 'application/javascript') {
        setPreviewType('text');
        setPreviewContent(await blob.text());
      } else if (mime === 'application/pdf') {
        setPreviewType('pdf');
        setPreviewContent(URL.createObjectURL(blob));
      } else if (mime.startsWith('video/')) {
        setPreviewType('video');
        setPreviewContent(URL.createObjectURL(blob));
      } else if (mime.startsWith('audio/')) {
        setPreviewType('audio');
        setPreviewContent(URL.createObjectURL(blob));
      } else {
        setPreviewType('none');
      }
    } catch (err) {
      addToast('Failed to load preview', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const isPreviewable = (mime) => {
    if (!mime) return false;
    return mime.startsWith('image/') || 
           mime.startsWith('video/') || 
           mime.startsWith('audio/') || 
           mime === 'application/pdf' || 
           mime.startsWith('text/') || 
           mime === 'application/json' || 
           mime === 'application/javascript';
  };

  const mime = file?.mimeType || file?.type;
  const filename = file?.filename || file?.originalName || file?.name || 'Shared File';

  // SVG Icons to avoid import dependency issues in this standalone view
  const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
  );

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col font-sans">
      {/* Brand Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-[#8178F2]/10 rounded-xl flex items-center justify-center">
          <Cloud className="w-6 h-6 text-[#8178F2]" />
        </div>
        <div>
          <h1 className="font-bold text-xl text-gray-900 leading-tight">DFSS</h1>
          <p className="text-xs text-gray-500 font-medium">Distributed File Storage</p>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md w-full my-auto">
            <Loader className="w-10 h-10 animate-spin text-[#8178F2] mb-4" />
            <p className="text-gray-500 font-medium">Retrieving shared file...</p>
          </div>
        ) : error || !file ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md w-full my-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Unavailable</h2>
              <p className="text-gray-600 mb-6">{error || 'This shared link is invalid or has expired.'}</p>
              <Link to="/" className="inline-block px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">
                Go to Homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg mt-8 mb-auto flex flex-col gap-6">
            {/* Main Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#8178F2]"></div>
              
              <div className="mb-6 flex justify-center mt-2">
                <div className="w-24 h-24 bg-[#8178F2]/10 text-[#8178F2] rounded-2xl flex items-center justify-center transform rotate-3">
                  <div className="-rotate-3">
                    <FileIcon />
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3 break-words leading-tight">
                {filename}
              </h2>
              
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-600 mb-8 bg-gray-50 py-2.5 px-4 rounded-xl inline-flex mx-auto">
                {file.size && <span className="font-medium">{formatBytes(file.size)}</span>}
                {file.size && mime && <span className="text-gray-300">•</span>}
                {mime && <span className="uppercase text-xs font-bold tracking-wider">{mime.split('/')[1] || mime}</span>}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {isPreviewable(mime) && !previewContent && (
                  <button 
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="flex-1 py-3 px-6 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-200 transition-all disabled:opacity-70"
                  >
                    {previewLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Preview'}
                  </button>
                )}
                
                <button 
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 py-3 px-6 bg-[#8178F2] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#6c63e6] transition-all disabled:opacity-70 shadow-sm"
                >
                  {downloading ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {file.expiresAt ? `Expires ${new Date(file.expiresAt).toLocaleDateString()}` : 'Link never expires'}
              </div>
            </div>

            {/* Inline Preview */}
            {previewContent && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 text-sm">Preview</h3>
                </div>
                
                <div className="p-4 bg-gray-100/50 flex justify-center">
                  {previewType === 'image' && (
                    <img src={previewContent} alt="Preview" className="max-w-full rounded-xl shadow-sm bg-white" />
                  )}
                  
                  {previewType === 'text' && (
                    <div className="w-full bg-[#1e1e1e] rounded-xl shadow-sm overflow-hidden text-left">
                      <pre className="p-6 text-xs sm:text-sm font-mono text-gray-300 overflow-auto max-h-[60vh] whitespace-pre-wrap break-all">
                        {previewContent}
                      </pre>
                    </div>
                  )}
                  
                  {previewType === 'pdf' && (
                    <iframe src={previewContent} className="w-full h-[60vh] rounded-xl bg-white shadow-sm" title="PDF Preview" />
                  )}
                  
                  {previewType === 'video' && (
                    <video src={previewContent} controls className="max-w-full rounded-xl shadow-sm bg-black" />
                  )}
                  
                  {previewType === 'audio' && (
                    <div className="w-full bg-white p-8 rounded-xl shadow-sm text-center">
                      <audio src={previewContent} controls className="w-full accent-[#8178F2]" />
                    </div>
                  )}
                  
                  {previewType === 'none' && (
                    <p className="text-gray-500 py-12 text-sm font-medium">Preview format not supported.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center shrink-0">
        <p className="text-gray-400 text-xs font-medium">
          Powered by <Link to="/" className="text-gray-500 hover:text-[#8178F2] transition-colors">DFSS Distributed Storage</Link>
        </p>
      </footer>
    </div>
  );
};

export default SharedView;
