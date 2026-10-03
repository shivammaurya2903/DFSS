import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Clock, Trash2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const ShareModal = ({ file, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState([]);
  const [expiresIn, setExpiresIn] = useState('7d');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    fetchShares();
  }, [file._id]);

  const fetchShares = async () => {
    try {
      const response = await api.get(`/files/${file._id}/shares`);
      setShares(response.data?.data || []);
    } catch (err) {
      console.error(err);
      // Fallback if endpoint doesn't exist
    }
  };

  const handleShare = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/files/${file._id}/share`, { expiresIn });
      const newShare = response.data?.data || response.data;
      setShares([...shares, newShare]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (token) => {
    try {
      // Trying different possible endpoints
      try {
        await api.delete(`/shares/${token}`);
      } catch (e) {
        await api.delete(`/files/${file._id}/share/${token}`);
      }
      setShares(shares.filter(s => s.token !== token));
    } catch (err) {
      setError('Failed to revoke share link');
    }
  };

  const copyToClipboard = (url, token) => {
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const getShareUrl = (token) => {
    return `${window.location.origin}/shared/${token}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Share "{file.filename}"</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Create new link</label>
            <div className="flex gap-2">
              <select 
                value={expiresIn} 
                onChange={(e) => setExpiresIn(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2"
                style={{focusRingColor: '#8178F2'}}
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
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                style={{backgroundColor: '#8178F2'}}
              >
                {loading ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </div>

          {shares.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Active Links</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {shares.map((share) => {
                  // Fallback for url structure
                  const shareUrl = share.url || getShareUrl(share.token);
                  return (
                    <div key={share.token} className="p-3 border border-gray-100 rounded-lg bg-gray-50 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 
                          {share.expiresAt ? `Expires ${new Date(share.expiresAt).toLocaleDateString()}` : 'Never expires'}
                        </span>
                        <button 
                          onClick={() => handleRevoke(share.token)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Revoke
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={shareUrl}
                          className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-600"
                        />
                        <button 
                          onClick={() => copyToClipboard(shareUrl, share.token)}
                          className="p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 text-gray-600 transition-colors"
                          title="Copy Link"
                        >
                          {copied === share.token ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
