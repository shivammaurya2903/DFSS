import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, AlertCircle, FileIcon } from 'lucide-react';
import { getFileDetails, getFileBlob, downloadFile } from '../services/file.service';

const FileViewer = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let url = null;
    
    const loadFile = async () => {
      try {
        setLoading(true);
        // Fetch metadata
        const fileData = await getFileDetails(fileId);
        setFile(fileData);
        
        // Fetch blob
        const blob = await getFileBlob(fileId);
        
        // Handle text files
        if (fileData.mimeType && (fileData.mimeType.includes('text') || fileData.mimeType.includes('json') || fileData.mimeType.includes('xml'))) {
          const text = await blob.text();
          setTextContent(text);
        } else {
          // Handle other viewable types (images, pdfs)
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
    if (file) {
      try {
        await downloadFile(file._id, file.filename);
      } catch (err) {
        alert('Failed to download file');
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4" style={{borderColor: '#8178F2'}}></div>
        <p className="text-gray-500">Loading file viewer...</p>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="h-full flex flex-col justify-center items-center bg-gray-50 p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error || 'File not found'}</p>
        <button 
          onClick={() => navigate('/files')}
          className="px-6 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Files
        </button>
      </div>
    );
  }

  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';
  const isText = textContent !== null;

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 text-white shadow-md z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-medium text-sm truncate max-w-md" title={file.filename}>{file.filename}</h1>
            <p className="text-xs text-gray-400">{file.mimeType || 'Unknown type'}</p>
          </div>
        </div>
        
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors border border-gray-600"
        >
          <Download className="w-4 h-4" /> Download
        </button>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {isImage ? (
          <img 
            src={blobUrl} 
            alt={file.filename} 
            className="max-w-full max-h-full object-contain shadow-lg"
          />
        ) : isText ? (
          <div className="w-full h-full bg-white rounded-lg p-6 overflow-auto shadow-lg">
            <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-words">
              {textContent}
            </pre>
          </div>
        ) : isPdf ? (
          <iframe 
            src={blobUrl} 
            title={file.filename}
            className="w-full h-full rounded-lg bg-white shadow-lg"
            frameBorder="0"
          ></iframe>
        ) : (
          <div className="bg-gray-800 p-8 rounded-xl flex flex-col items-center max-w-md text-center border border-gray-700">
            <FileIcon className="w-20 h-20 text-gray-500 mb-6" />
            <h2 className="text-xl font-semibold text-white mb-2">No preview available</h2>
            <p className="text-gray-400 mb-8 text-sm">
              This file type ({file.mimeType || 'unknown'}) cannot be previewed in the browser.
            </p>
            <button 
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-opacity w-full justify-center"
              style={{backgroundColor: '#8178F2'}}
            >
              <Download className="w-5 h-5" /> Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
