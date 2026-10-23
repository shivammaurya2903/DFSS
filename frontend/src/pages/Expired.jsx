import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { Clock, Eye, AlertCircle, FileText, Loader } from 'lucide-react';
import * as fileService from '../services/file.service';
import EmptyState from '../components/common/EmptyState';
import { getFileDisplayName, formatDate } from '../utils/formatters';
import { getFileIconComponent } from '../utils/fileIcons';

const Expired = () => {
  const navigate = useNavigate();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    
    fileService.getExpiredFiles({ signal: controller.signal })
      .then(data => setShares(data))
      .catch(err => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#17181C] flex items-center gap-3">
          <Clock className="text-[#8178F2] w-6 h-6" /> Expired Shares
        </h1>
        <p className="text-[#6F737D] text-sm mt-1">Files with expired or revoked sharing permissions.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-[#E7E9EF] p-12 flex justify-center items-center">
          <Loader className="w-8 h-8 animate-spin text-[#8178F2]" />
        </div>
      ) : shares.length === 0 ? (
        <EmptyState 
          icon={Clock} 
          title="No expired links" 
          description="Files with expired or revoked sharing links will be listed here." 
        />
      ) : (
        <div className="bg-white border border-[#E7E9EF] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FC] text-xs text-[#6F737D] border-b border-[#E7E9EF]">
                  <th className="px-5 py-3 font-medium">File Name</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Expiration / Revocation</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {shares.map(share => {
                  if (!share.file) return null;
                  return (
                    <tr key={share.shareId || share._id} className="border-b border-[#F8F9FC] hover:bg-[#F8F9FC] cursor-pointer group" onClick={() => navigate(`/files/${share.file._id}/view`)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#F5F7FB] rounded-lg group-hover:bg-white border border-transparent group-hover:border-[#E7E9EF]">
                            {getFileIconComponent(share.file.mimeType)}
                          </div>
                          <div>
                            <p className="font-medium text-[#17181C] truncate max-w-[250px]">{getFileDisplayName(share.file)}</p>
                            <p className="text-xs text-[#6F737D] mt-0.5">Created {formatDate(share.createdAt)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {share.isRevoked ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-100">Revoked</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100">Expired</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#6F737D] whitespace-nowrap">
                        {formatDate(share.revokedAt || share.expiresAt)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/files/${share.file._id}/view`); }} 
                          className="p-2 text-[#6F737D] hover:text-[#8178F2] hover:bg-[#F5F7FB] rounded-lg transition-colors inline-flex items-center gap-1"
                          title="View File"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-medium">View</span>
                        </button>
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

export default Expired;

