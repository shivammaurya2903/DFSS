import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { Users, Trash2, Copy, Link2, ExternalLink } from 'lucide-react';
import * as fileService from '../services/file.service';
import { useToast } from '../context/ToastContext';
import { getFileDisplayName, formatDate } from '../utils/formatters';
import { getFileIconComponent } from '../utils/fileIcons';

const Shared = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('byMe');

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchShares = async () => {
      try {
        setLoading(true);
        const data = await fileService.getSharedFiles({ signal: controller.signal });
        setShares(data);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          addToast('Failed to fetch shared files', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'byMe') {
      fetchShares();
    } else {
      setShares([]);
      setLoading(false);
    }
    
    return () => controller.abort();
  }, [activeTab, addToast]);

  const handleRevoke = async (e, fileId, shareId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to revoke this share link?')) return;
    try {
      await fileService.revokeShare(fileId, shareId);
      setShares(shares.filter(s => s.shareId !== shareId));
      addToast('Share link revoked successfully', 'success');
    } catch (err) {
      addToast('Failed to revoke share link', 'error');
    }
  };

  const handleCopyLink = (e, share) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/share/${share.shareId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => addToast('Link copied to clipboard', 'success'))
      .catch(() => addToast('Failed to copy link', 'error'));
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#17181C] flex items-center gap-3">
          <Users className="text-[#8178F2] w-6 h-6" /> Shared Files
        </h1>
        <p className="text-[#6F737D] text-sm mt-1">Manage files you've shared with others.</p>
      </div>

      <div className="flex border-b border-[#E7E9EF] mb-6">
        <button 
          onClick={() => setActiveTab('byMe')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'byMe' ? 'border-[#8178F2] text-[#8178F2]' : 'border-transparent text-[#6F737D] hover:text-[#17181C]'}`}
        >
          Shared By Me
        </button>
        <button 
          onClick={() => setActiveTab('withMe')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'withMe' ? 'border-[#8178F2] text-[#8178F2]' : 'border-transparent text-[#6F737D] hover:text-[#17181C]'}`}
        >
          Shared With Me <span className="ml-2 px-2 py-0.5 bg-[#F5F7FB] text-[#6F737D] rounded text-xs border border-[#E7E9EF]">Coming Soon</span>
        </button>
      </div>
      
      {activeTab === 'withMe' ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E7E9EF] p-12 flex flex-col items-center justify-center text-center mt-4">
          <div className="bg-[#F5F7FB] p-4 rounded-full mb-4">
            <Users className="w-8 h-8 text-[#8178F2]" />
          </div>
          <h3 className="text-lg font-bold text-[#17181C] mb-1">Coming Soon</h3>
          <p className="text-[#6F737D] text-sm max-w-sm">The ability to see files shared directly with your account is currently in development.</p>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-16 bg-white border border-[#E7E9EF] rounded-xl w-full"></div>
          ))}
        </div>
      ) : shares.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-[#E7E9EF] p-12 flex flex-col items-center justify-center text-center mt-4">
          <div className="bg-[#F5F7FB] p-4 rounded-full mb-4">
            <Link2 className="w-8 h-8 text-[#8178F2]" />
          </div>
          <h3 className="text-lg font-bold text-[#17181C] mb-1">No active share links</h3>
          <p className="text-[#6F737D] text-sm max-w-sm mb-6">Files you share with others using public links will appear here.</p>
          <button onClick={() => navigate('/files')} className="bg-[#8178F2] hover:bg-[#6c63e6] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            Go to Files
          </button>
        </div>
      ) : (
        <div className="bg-white border border-[#E7E9EF] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FC] text-xs text-[#6F737D] border-b border-[#E7E9EF]">
                  <th className="px-5 py-3 font-medium">File Name</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Expires On</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {shares.map(share => {
                  if (!share.file) return null;
                  const isExpired = new Date(share.expiresAt) < new Date();
                  
                  return (
                    <tr key={share.shareId} className="border-b border-[#F8F9FC] hover:bg-[#F8F9FC] cursor-pointer group" onClick={() => navigate(`/files/${share.file._id}/view`)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#F5F7FB] rounded-lg group-hover:bg-white border border-transparent group-hover:border-[#E7E9EF]">
                            {getFileIconComponent(share.file.mimeType)}
                          </div>
                          <div>
                            <p className="font-medium text-[#17181C] truncate max-w-[250px]">{getFileDisplayName(share.file)}</p>
                            <p className="text-xs text-[#6F737D] mt-0.5">Shared on {formatDate(share.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isExpired ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-[#E88B8B]">Expired</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-[#69B38A]">Active</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#6F737D] whitespace-nowrap">
                        {formatDate(share.expiresAt)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => handleCopyLink(e, share)} 
                            className="p-2 text-[#6F737D] hover:text-[#8178F2] hover:bg-[#F5F7FB] rounded-lg transition-colors flex items-center gap-1 border border-transparent hover:border-[#E7E9EF]"
                          >
                            <Copy className="w-4 h-4" />
                            <span className="text-xs font-medium hidden sm:inline">Copy Link</span>
                          </button>
                          <button 
                            onClick={(e) => handleRevoke(e, share.file._id, share.shareId)} 
                            className="p-2 text-[#E88B8B] hover:bg-red-50 rounded-lg transition-colors" 
                            title="Revoke Link"
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
      )}
    </PageContainer>
  );
};

export default Shared;
