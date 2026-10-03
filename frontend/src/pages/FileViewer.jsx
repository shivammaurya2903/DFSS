import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Share2, MoreVertical, 
  File as FileIcon, AlertCircle, Loader, Copy,
  Info, Trash2, X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';
import ShareModal from '../components/common/ShareModal';
import { getFileDetails, getFileBlob, downloadFile, deleteFile } from '../services/file.service';
import { formatBytes, formatDate, getFileDisplayName } from '../utils/formatters';
import { getFileIconComponent, getFileColorClass } from '../utils/fileIcons';

const FileViewer = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [file, setFile] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // UI State
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('#more-menu-container')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    let url = null;
    
    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);

        const fileData = await getFileDetails(fileId);
        setFile(fileData);
        
        const blob = await getFileBlob(fileId);
        const mime = fileData.mimeType || '';
        
        const isTextType = mime.startsWith('text/') || 
                           mime === 'application/json' || 
                           mime === 'application/javascript' || 
                           mime === 'text/csv' ||
                           mime === 'application/xml';
                           
        if (isTextType && !mime.includes('openxmlformats')) {
          const text = await blob.text();
          setTextContent(text);
        } else {
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err) {
        console.error('View error:', err);
        setError(err.userMessage || err.message || 'Failed to load file for viewing.');
      } finally {
        setLoading(false);
      }
    };
    
    loadFile();
    
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [fileId]);

  const handleDownload = async () => {
    if (!file) return;
    try {
      setDownloadLoading(true);
      await downloadFile(fileId, getFileDisplayName(file));
      addToast('Download started.', 'success');
    } catch (err) {
      addToast(err.userMessage || 'Download failed.', 'error');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteFile(fileId);
      addToast('File deleted successfully.', 'success');
      navigate('/files');
    } catch (err) {
      addToast(err.userMessage || 'Failed to delete file.', 'error');
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#F5F7FB] flex flex-col justify-center items-center">
        <Loader className="w-10 h-10 animate-spin text-[#8178F2] mb-4" />
        <p className="text-gray-600 font-medium">Retrieving and decrypting your file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-[#F5F7FB] flex flex-col justify-center items-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading File</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => navigate(-1)} 
              className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2.5 bg-[#8178F2] text-white font-medium rounded-xl hover:bg-[#6c63e6] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mime = file?.mimeType || '';
  const isImage = mime.startsWith('image/');
  const isPdf = mime === 'application/pdf';
  const isVideo = mime.startsWith('video/');
  const isAudio = mime.startsWith('audio/');
  const isText = textContent !== null;
  const filename = getFileDisplayName(file);

  return (
    <div className="h-screen flex flex-col bg-[#F5F7FB] overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-1.5 rounded-lg shrink-0 ${getFileColorClass(mime)}`}>
              {getFileIconComponent(mime, 'sm')}
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-gray-800 text-sm md:text-base truncate" title={filename}>
                {filename}
              </h1>
              <p className="text-xs text-gray-500 truncate">{mime || 'Unknown type'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button 
            onClick={() => setShareModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          
          <button 
            onClick={handleDownload}
            disabled={downloadLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#8178F2] text-white rounded-lg hover:bg-[#6c63e6] font-medium text-sm transition-colors disabled:opacity-70 shadow-sm"
          >
            {downloadLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Download</span>
          </button>

          <div className="relative" id="more-menu-container">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                <button 
                  onClick={() => { setShareModalOpen(true); setMenuOpen(false); }}
                  className="w-full sm:hidden text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-gray-400" /> Share
                </button>
                <button 
                  onClick={() => { setShowInfo(!showInfo); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Info className="w-4 h-4 text-gray-400" /> File Details
                </button>
                <div className="h-px bg-gray-100 my-1"></div>
                <button 
                  onClick={() => { setDeleteModalOpen(true); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-red-500" /> Delete File
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex relative">
        <div className={`flex-1 overflow-auto flex flex-col transition-all ${showInfo ? 'mr-0 lg:mr-80' : ''}`}>
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            {isImage ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 flex p-1 z-10">
                  <button onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 text-sm font-medium w-8 h-8 flex items-center justify-center">-</button>
                  <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-x border-gray-200 flex items-center justify-center min-w-[3rem]">
                    {Math.round(zoom * 100)}%
                  </div>
                  <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-700 text-sm font-medium w-8 h-8 flex items-center justify-center">+</button>
                </div>
                <div 
                  className="w-full h-full overflow-auto flex items-center justify-center bg-gray-100/50 rounded-xl"
                  style={{ backgroundImage: 'conic-gradient(#e5e7eb 25%, transparent 25%, transparent 75%, #e5e7eb 75%, #e5e7eb)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}
                >
                  <img 
                    src={blobUrl} 
                    alt={filename} 
                    style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out', transformOrigin: 'center' }}
                    className="max-w-full max-h-full object-contain shadow-sm border border-gray-200 bg-white" 
                  />
                </div>
              </div>
            ) : isText ? (
              <div className="w-full h-full max-w-5xl bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-gray-900 text-gray-200 px-4 py-2.5 text-xs font-mono border-b border-gray-800 flex justify-between items-center shrink-0">
                  <span className="truncate pr-4">{filename}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(textContent);
                      addToast('Copied to clipboard', 'success');
                    }} 
                    className="flex items-center gap-1.5 hover:text-white transition-colors bg-gray-800 px-3 py-1.5 rounded-md border border-gray-700 hover:border-gray-600"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
                <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 text-sm font-mono text-gray-300 selection:bg-indigo-500/30">
                  <div className="table w-full">
                    <div className="table-row-group">
                      {textContent.split('\n').map((line, i) => (
                        <div key={i} className="table-row hover:bg-white/5 group">
                          <div className="table-cell w-1 pr-4 text-right select-none text-gray-600 border-r border-gray-700/50 group-hover:text-gray-400 font-mono text-xs align-top">
                            {i + 1}
                          </div>
                          <div className="table-cell pl-4 whitespace-pre-wrap break-all leading-relaxed pb-0.5">
                            {line || ' '}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : isPdf ? (
              <div className="w-full h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-blue-50 text-blue-700 text-xs px-4 py-2 text-center border-b border-blue-100 shrink-0">
                  If the PDF doesn't display correctly, please download it to view locally.
                </div>
                <iframe src={blobUrl} className="w-full flex-1" title={filename} />
              </div>
            ) : isVideo ? (
              <div className="w-full max-w-5xl bg-black rounded-xl shadow-xl overflow-hidden flex items-center justify-center">
                <video src={blobUrl} controls className="max-w-full max-h-[80vh]" />
              </div>
            ) : isAudio ? (
              <div className="bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-800 w-full max-w-md text-center">
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Music className="w-16 h-16 text-[#8178F2]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 truncate px-4">{filename}</h2>
                <p className="text-gray-400 text-sm mb-8">{formatBytes(file.size)}</p>
                <audio src={blobUrl} controls className="w-full accent-[#8178F2]" />
              </div>
            ) : (
              <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-center max-w-sm w-full">
                <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${getFileColorClass(mime)}`}>
                  {getFileIconComponent(mime, 'lg')}
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2 truncate px-2" title={filename}>{filename}</h2>
                <div className="text-sm text-gray-500 mb-2">{mime || 'Unknown type'}</div>
                <div className="text-sm text-gray-700 font-medium mb-8">{formatBytes(file.size)}</div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-8">
                  <p className="text-gray-600 text-sm">This file type cannot be previewed in the browser.</p>
                </div>
                
                <button 
                  onClick={handleDownload}
                  disabled={downloadLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#8178F2] text-white rounded-xl font-medium hover:bg-[#6c63e6] transition-colors w-full shadow-sm"
                >
                  {downloadLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  Download to view
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Sidebar */}
        <div 
          className={`absolute inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 z-20 overflow-y-auto
            ${showInfo ? 'translate-x-0' : 'translate-x-full'} 
            lg:relative lg:shadow-none lg:translate-x-0 ${!showInfo ? 'lg:hidden' : ''}`}
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
            <h3 className="font-semibold text-gray-800">File Details</h3>
            <button onClick={() => setShowInfo(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-4 ${getFileColorClass(mime)}`}>
                {getFileIconComponent(mime, 'md')}
              </div>
              <h4 className="font-medium text-gray-900 break-all">{filename}</h4>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">MIME Type</div>
                <div className="text-gray-800 break-all">{mime || 'Unknown'}</div>
              </div>
              
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Created</div>
                <div className="text-gray-800">{formatDate(file.createdAt, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-3">Storage</div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Size:</span>
                    <span className="font-medium text-gray-800">{formatBytes(file.size)}</span>
                  </div>
                  
                  {file.compressionApplied && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stored Size:</span>
                        <span className="font-medium text-[#8178F2]">{formatBytes(file.storedSize)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-600">Status:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100">
                          Optimized (-{Math.round((1 - file.storedSize / file.size) * 100)}%)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">SHA-256 Hash</div>
                <div className="text-gray-800 font-mono text-xs break-all bg-gray-50 p-2 rounded border border-gray-100">
                  {file.hash || 'Not available'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {deleteModalOpen && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          title="Delete File"
          message={`Are you sure you want to delete "${filename}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteModalOpen(false)}
          isDestructive={true}
        />
      )}

      {shareModalOpen && (
        <ShareModal
          isOpen={shareModalOpen}
          file={file}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default FileViewer;
