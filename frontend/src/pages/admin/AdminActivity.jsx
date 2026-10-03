import React, { useState, useEffect } from 'react';
import { Activity, Search, Filter } from 'lucide-react';
import * as activityService from '../../services/activity.service';
import { useToast } from '../../context/ToastContext';

const AdminActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');
  const { addToast } = useToast();

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await activityService.getAdminActivity({ limit: 100 });
        setActivities(data?.data || data?.activities || []);
      } catch (err) {
        addToast("Failed to load admin activity logs.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [addToast]);

  const filteredActivities = activities.filter(act => {
    if (filterAction === 'ALL') return true;
    return act.action === filterAction;
  });

  const actions = ['ALL', ...new Set(activities.map(a => a.action))];

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
              onChange={(e) => setFilterAction(e.target.value)}
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
                      {act.fileId ? (
                        <div className="truncate max-w-[200px]" title={act.details?.filename || (typeof act.fileId === 'object' ? act.fileId.originalName : act.fileId)}>
                          {act.details?.filename || (typeof act.fileId === 'object' ? act.fileId.originalName || act.fileId._id : act.fileId)}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {act.details ? (
                        <div className="truncate max-w-[250px]" title={JSON.stringify(act.details)}>
                          {Object.entries(act.details)
                            .filter(([k]) => k !== 'filename')
                            .map(([k, v]) => `${k}: ${v}`).join(', ') || '-'}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(act.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminActivity;
