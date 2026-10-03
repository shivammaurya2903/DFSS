import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Clock, Trash2, AlertCircle, FileIcon, ExternalLink } from 'lucide-react';
import * as fileService from '../../services/file.service';
import { useToast } from '../../context/ToastContext';

const ShareModal = ({ file, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState([]);
  const [expiresIn, setExpiresIn] = useState('7d');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchShares();
  }, [file._id]);

  const fetchShares = async () => {
    try {
      const data = await fileService.getFileShares(file._id);
      setShares(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load active share links');
    }
  };

  const handleShare = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fileService.shareFile(file._id, expiresIn);
      const newShare = response?.data || response;
      setShares([...shares, newShare]);
      addToast('success', 'Share link created successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (shareId) => {
    if (!window.confirm('Are you sure you want to revoke this link? Anyone with the link will lose access.')) return;
    
    try {
      await fileService.revokeShare(file._id, shareId);
      setShares(shares.filter(s => s._id !== shareId));
      addToast('success', 'Share link revoked successfully');
    } catch (err) {
      setError('Failed to revoke share link');
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getShareUrl = (token) => {
    return `${window.location.origin}/shared/${token}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Share File</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-6">
          {/* File Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <FileIcon className="w-6 h-6 text-[#8178F2]" />
            <span className="font-medium text-gray-700 truncate">{file.filename || file.name}</span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Create Link Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Create new link</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={expiresIn} 
                onChange={(e) => setExpiresIn(e.target.value)}
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:border-[#8178F2]"
                style={{ '--tw-ring-color': '#8178F2' }}
              >
                <option value="1h">Expires in 1 Hour</option>
                <option value="24h">Expires in 24 Hours</option>
                <option value="7d">Expires in 7 Days</option>
                <option value="30d">Expires in 30 Days</option>
                <option value="never">Never Expires</option>
              </select>
              <button 
                onClick={handleShare}
                disabled={loading}
                className="px-5 py-2.5 bg-[#8178F2] text-white rounded-lg text-sm font-medium hover:bg-[#6c63e6] transition-colors disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap shadow-sm shadow-[#8178F2]/20"
              >
                {loading ? 'Creating...' : 'Generate Link'}
              </button>
            </div>
          </div>

          {/* Active Links Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Active Links</h3>
            {shares.length > 0 ? (
              <div className="space-y-3">
                {shares.map((share) => {
                  const shareUrl = getShareUrl(share.token);
                  const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date();
                  
                  return (
                    <div key={share._id} className="p-3.5 border border-gray-100 rounded-xl bg-white shadow-sm flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${isExpired ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 
                            {share.expiresAt ? `Expires ${new Date(share.expiresAt).toLocaleDateString()}` : 'Never expires'}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleRevoke(share._id)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Revoke
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={shareUrl}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none"
                        />
                        <button 
                          onClick={() => copyToClipboard(shareUrl, share._id)}
                          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
                          title="Copy Link"
                        >
                          {copied === share._id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <a 
                          href={shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
                          title="Open Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                <p className="text-sm text-gray-500">No active links. Create your first share link above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
