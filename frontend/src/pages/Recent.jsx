import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { Clock, Eye, Download, Share2 } from 'lucide-react';
import * as fileService from '../services/file.service';
import { useToast } from '../context/ToastContext';
import { formatBytes, formatRelativeTime, getFileDisplayName } from '../utils/formatters';
import { getFileIconComponent } from '../utils/fileIcons';

const Recent = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchRecent = async () => {
      try {
        setLoading(true);
        const data = await fileService.getRecentFiles({ signal: controller.signal });
        setFiles(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          addToast('Failed to load recent files', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
    return () => controller.abort();
  }, [addToast]);

  const handleDownload = async (e, file) => {
    e.stopPropagation();
    try {
      await fileService.downloadFile(file._id, getFileDisplayName(file));
      addToast('Download started', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to download file', 'error');
    }
  };

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#17181C] flex items-center gap-3">
          <Clock className="text-[#8178F2] w-6 h-6" /> Recent Files
        </h1>
        <p className="text-[#6F737D] text-sm mt-1">Files you recently uploaded, modified, or accessed.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-white border border-[#E7E9EF] p-5 rounded-xl">
              <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E7E9EF] p-12 flex flex-col items-center justify-center text-center mt-4">
          <div className="bg-[#F5F7FB] p-4 rounded-full mb-4">
            <Clock className="w-8 h-8 text-[#8178F2]" />
          </div>
          <h3 className="text-lg font-bold text-[#17181C] mb-1">No recent files</h3>
          <p className="text-[#6F737D] text-sm max-w-sm">Files you interact with will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {files.map(file => (
            <div 
              key={file._id}
              onClick={() => navigate(`/files/${file._id}/view`)}
              className="bg-white border border-[#E7E9EF] rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#F8F9FC] flex items-center justify-center">
                  {getFileIconComponent(file.mimeType)}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => handleDownload(e, file)} className="p-1.5 text-[#6F737D] hover:bg-[#F5F7FB] hover:text-[#17181C] rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/files/${file._id}/view`); }} className="p-1.5 text-[#6F737D] hover:bg-[#F5F7FB] hover:text-[#17181C] rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-[#17181C] truncate mb-1" title={getFileDisplayName(file)}>
                {getFileDisplayName(file)}
              </h3>
              
              <div className="mt-auto pt-4 flex items-center justify-between text-xs text-[#6F737D]">
                <span>{formatBytes(file.storedSize || file.size)}</span>
                <span>{formatRelativeTime(file.updatedAt || file.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
};

export default Recent;
