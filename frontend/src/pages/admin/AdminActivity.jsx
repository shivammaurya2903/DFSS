import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter } from 'lucide-react';
import * as activityService from '../../services/activity.service';
import { useToast } from '../../context/ToastContext';

const AdminActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterAction, setFilterAction] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const { addToast } = useToast();

  const fetchActivities = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await activityService.getAdminActivity({
        page,
        limit: 50,
        action: filterAction === 'ALL' ? undefined : filterAction,
      });
      setActivities(data?.data || data?.activities || []);
      setPagination(data?.pagination || null);
    } catch (err) {
      console.error('Failed to load admin activity logs:', err);
      setError(true);
      addToast("Failed to load admin activity logs.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [addToast, page, filterAction]);

  const filteredActivities = activities;
  const actions = [
    'ALL', 'UPLOAD', 'DOWNLOAD', 'FILE_DELETED', 'SHARE', 'REVOKE_SHARE',
    'NODE_FAILURE', 'NODE_RECOVERY', 'REPLICA_REPLACEMENT',
    'CONDITION_INJECTED', 'CONDITION_CLEARED',
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#8178F2]" /> System Activity
          </h1>
          <p className="text-sm text-gray-500">Global audit log of all system events</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
              className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#8178F2]/20 focus:border-[#8178F2] transition-all cursor-pointer"
            >
              {actions.map(action => (
                <option key={action} value={action}>{action === 'ALL' ? 'All Actions' : action}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">File / Target</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading activity...</td></tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-red-600">
                    Failed to load activity logs.
                    <button onClick={fetchActivities} className="ml-2 underline">Retry</button>
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No activity found.</td></tr>
              ) : (
                filteredActivities.map((act, idx) => (
                  <tr key={act._id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#f4f2ff] text-[#8178F2]">
                        {act.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {act.userId && typeof act.userId === 'object' 
                        ? (act.userId.name || act.userId.email) 
                        : (act.userId || 'System')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {act.fileId || act.metadata?.filename ? (
                        <div className="truncate max-w-[200px]" title={act.metadata?.filename || (typeof act.fileId === 'object' ? act.fileId.originalName : act.fileId)}>
                          {act.metadata?.filename || (typeof act.fileId === 'object' ? act.fileId.originalName || act.fileId._id : act.fileId)}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {act.metadata && Object.keys(act.metadata).length > 0 ? (
                        <div className="truncate max-w-[250px]" title={JSON.stringify(act.metadata)}>
                          {Object.entries(act.metadata)
                            .filter(([k]) => k !== 'filename')
                            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ') || '-'}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(act.timestamp || act.createdAt || act.date || Date.now()).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && !error && pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Page {pagination.page} of {pagination.pages} ({pagination.total} events)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivity;
