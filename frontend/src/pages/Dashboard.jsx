import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import * as fileService from '../services/file.service';
import * as activityService from '../services/activity.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatBytes, formatDate, formatRelativeTime, getFileDisplayName } from '../utils/formatters';
import { getFileIconComponent } from '../utils/fileIcons';
import { 
  Cloud, HardDrive, FileText, Share2, Zap, Upload, Folder, 
  Eye, Download, Trash2, MoreVertical, Loader, Activity as ActivityIcon 
} from 'lucide-react';
import ShareModal from '../components/common/ShareModal';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);
  
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [shareFile, setShareFile] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        const recentFiles = await fileService.getRecentFiles({ signal: controller.signal });
        setFiles(Array.isArray(recentFiles) ? recentFiles.slice(0, 5) : []);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          addToast('Failed to load recent files', 'error');
        }
      } finally {
        setLoadingFiles(false);
      }

      try {
        const result = await activityService.getActivity({ signal: controller.signal });
        const acts = result?.data || [];
        setActivities(Array.isArray(acts) ? acts.slice(0, 5) : []);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          addToast('Failed to load recent activity', 'error');
        }
      } finally {
        setLoadingActivities(false);
      }
    };
    
    loadData();
    return () => controller.abort();
  }, [addToast]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadStatus({ statusText: 'Preparing...', progress: 0, fileName: file.name, loaded: 0, total: file.size });

      const formData = new FormData();
      formData.append('file', file);

      await fileService.uploadFile(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadStatus({
          statusText: percentCompleted < 100 ? 'Uploading...' : 'Processing...',
          progress: percentCompleted,
          fileName: file.name,
          loaded: progressEvent.loaded,
          total: progressEvent.total
        });
      });

      addToast('File uploaded successfully', 'success');
      setUploadStatus(null);
      
      const newFiles = await fileService.getRecentFiles();
      setFiles(Array.isArray(newFiles) ? newFiles.slice(0, 5) : []);
      const actsResult = await activityService.getActivity();
      const acts = actsResult?.data || [];
      setActivities(Array.isArray(acts) ? acts.slice(0, 5) : []);

    } catch (err) {
      addToast(err.userMessage || err.message || 'Upload failed', 'error');
      setUploadStatus(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await fileService.deleteFile(id);
      setFiles(files.filter(f => f._id !== id));
      addToast('File deleted successfully', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to delete file', 'error');
    } finally {
      setActionMenuOpen(null);
    }
  };

  const handleDownload = async (e, file) => {
    e.stopPropagation();
    try {
      await fileService.downloadFile(file._id, getFileDisplayName(file));
      addToast('Download started', 'success');
      setActionMenuOpen(null);
    } catch (err) {
      addToast(err.message || 'Failed to download file', 'error');
    }
  };

  const used = user?.usedStorage || 0;
  const quota = user?.storageQuota || (100 * 1024 * 1024);
  const percentage = Math.min(100, Math.round((used / quota) * 100)) || 0;
  
  let originalTotal = 0;
  let storedTotal = 0;
  files.forEach(f => {
    originalTotal += (f.originalSize || f.size || 0);
    storedTotal += (f.storedSize || f.size || 0);
  });
  const saved = originalTotal > storedTotal ? originalTotal - storedTotal : 0;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17181C]">
            {getGreeting()}, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-[#6F737D] text-sm mt-1">Your files are secure, distributed, and ready when you need them.</p>
        </div>
        <div>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} disabled={uploading} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-[#8178F2] hover:bg-[#6c63e6] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div className="mb-6 p-4 border border-[#E7E9EF] rounded-xl bg-white shadow-sm max-w-2xl">
          <div className="flex justify-between text-sm mb-2 text-[#17181C]">
            <span className="font-medium">{uploadStatus.statusText}</span>
            <span>{uploadStatus.progress}%</span>
          </div>
          <div className="w-full bg-[#F5F7FB] rounded-full h-2 mb-2 overflow-hidden">
            <div className="bg-[#8178F2] h-full rounded-full transition-all duration-300" style={{ width: `${uploadStatus.progress}%` }}></div>
          </div>
          <div className="flex justify-between text-xs text-[#6F737D]">
            <span className="truncate max-w-[250px]">{uploadStatus.fileName}</span>
            <span>{formatBytes(uploadStatus.loaded)} / {formatBytes(uploadStatus.total)}</span>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-[#E7E9EF] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-[#8178F2]/10 rounded-full flex items-center justify-center text-[#8178F2] shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[#6F737D] font-medium">Storage Used</p>
            <p className="text-lg font-bold text-[#17181C]">{formatBytes(used)}</p>
            <p className="text-xs text-[#6F737D]">of {formatBytes(quota)}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E7E9EF] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[#6F737D] font-medium">Total Files</p>
            <p className="text-xl font-bold text-[#17181C]">{files.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E7E9EF] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 shrink-0">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[#6F737D] font-medium">Active Shares</p>
            <p className="text-xl font-bold text-[#17181C]">N/A</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E7E9EF] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-[#69B38A] shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-[#6F737D] font-medium">Compression Saved</p>
            <p className="text-xl font-bold text-[#17181C]">{formatBytes(saved)}</p>
          </div>
        </div>
      </div>

      {/* Storage Progress */}
      <div className="bg-white p-6 rounded-xl border border-[#E7E9EF] shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#17181C] font-semibold flex items-center gap-2"><Cloud className="w-5 h-5 text-[#8178F2]" /> Cloud Storage</span>
            <span className="text-sm font-medium text-[#6F737D]">{percentage}% Used</span>
          </div>
          <div className="w-full bg-[#F5F7FB] rounded-full h-3">
            <div className={`h-full rounded-full transition-all duration-500 ${percentage > 90 ? 'bg-[#E88B8B]' : 'bg-[#8178F2]'}`} style={{ width: `${percentage}%` }}></div>
          </div>
          <div className="flex justify-between text-xs text-[#6F737D] mt-2">
            <span>{formatBytes(used)} used</span>
            <span>{formatBytes(quota - used)} free</span>
          </div>
        </div>
        <div className="hidden md:block w-px h-16 bg-[#E7E9EF]"></div>
        <div className="flex gap-4">
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-3 w-20 h-20 rounded-xl bg-[#F5F7FB] hover:bg-[#E7E9EF] transition-colors text-[#17181C] group">
            <Upload className="w-6 h-6 text-[#8178F2] mb-1 group-hover:-translate-y-1 transition-transform" />
            <span className="text-xs font-medium">Upload</span>
          </button>
          <button onClick={() => navigate('/files')} className="flex flex-col items-center justify-center p-3 w-20 h-20 rounded-xl bg-[#F5F7FB] hover:bg-[#E7E9EF] transition-colors text-[#17181C] group">
            <Folder className="w-6 h-6 text-[#6F737D] mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">My Files</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#17181C]">Recent Files</h2>
            <button onClick={() => navigate('/recent')} className="text-sm text-[#8178F2] font-medium hover:underline">View All</button>
          </div>
          
          <div className="bg-white border border-[#E7E9EF] rounded-xl overflow-hidden shadow-sm">
            {loadingFiles ? (
              <div className="p-8 text-center"><Loader className="w-6 h-6 animate-spin text-[#8178F2] mx-auto" /></div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-[#6F737D]">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent files.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F8F9FC] text-xs text-[#6F737D] border-b border-[#E7E9EF]">
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Size</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {files.map(file => (
                      <tr key={file._id} className="border-b border-[#F8F9FC] hover:bg-[#F8F9FC] cursor-pointer group" onClick={() => navigate(`/files/${file._id}/view`)}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#F8F9FC] rounded-lg group-hover:bg-white border border-transparent group-hover:border-[#E7E9EF]">
                              {getFileIconComponent(file.mimeType)}
                            </div>
                            <div>
                              <p className="font-medium text-[#17181C] truncate max-w-[180px]">{getFileDisplayName(file)}</p>
                              <p className="text-xs text-[#6F737D]">{file.mimeType || 'Unknown Type'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[#6F737D] whitespace-nowrap">
                          {formatBytes(file.storedSize || file.size)}
                        </td>
                        <td className="px-5 py-3 text-[#6F737D] whitespace-nowrap">{formatDate(file.updatedAt || file.createdAt)}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1 relative">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/files/${file._id}/view`); }} className="p-2 text-[#6F737D] hover:text-[#17181C] hover:bg-[#E7E9EF] rounded-lg" title="View"><Eye className="w-4 h-4" /></button>
                            <button onClick={(e) => handleDownload(e, file)} className="p-2 text-[#6F737D] hover:text-[#17181C] hover:bg-[#E7E9EF] rounded-lg" title="Download"><Download className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setActionMenuOpen(actionMenuOpen === file._id ? null : file._id); }} className="p-2 text-[#6F737D] hover:text-[#17181C] hover:bg-[#E7E9EF] rounded-lg"><MoreVertical className="w-4 h-4" /></button>
                            
                            {actionMenuOpen === file._id && (
                              <div className="absolute right-0 top-10 w-36 bg-white rounded-xl shadow-lg border border-[#E7E9EF] z-10 py-1">
                                <button onClick={(e) => { e.stopPropagation(); setShareFile(file); setActionMenuOpen(null); }} className="w-full px-4 py-2 text-sm text-[#17181C] hover:bg-[#F8F9FC] flex items-center gap-2"><Share2 className="w-4 h-4 text-[#6F737D]" /> Share</button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(file._id); }} className="w-full px-4 py-2 text-sm text-[#E88B8B] hover:bg-red-50 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
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
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#17181C]">Recent Activity</h2>
            <button onClick={() => navigate('/activity')} className="text-sm text-[#8178F2] font-medium hover:underline">View All</button>
          </div>
          
          <div className="bg-white border border-[#E7E9EF] rounded-xl overflow-hidden shadow-sm p-5">
            {loadingActivities ? (
              <div className="py-4 text-center"><Loader className="w-5 h-5 animate-spin text-[#8178F2] mx-auto" /></div>
            ) : activities.length === 0 ? (
              <div className="py-8 text-center text-[#6F737D]">
                <ActivityIcon className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recent activity.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act._id || act.id} className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#F5F7FB] flex items-center justify-center shrink-0">
                      <ActivityIcon className="w-4 h-4 text-[#8178F2]" />
                    </div>
                    <div>
                      <p className="text-sm text-[#17181C]">{act.action}</p>
                      <p className="text-xs text-[#6F737D] mt-0.5">{formatRelativeTime(act.createdAt || act.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {shareFile && <ShareModal file={shareFile} onClose={() => setShareFile(null)} />}
    </PageContainer>
  );
};

export default Dashboard;
