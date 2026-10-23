import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, HardDrive, FileText, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import * as nodeService from '../../services/node.service';
import * as activityService from '../../services/activity.service';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityError, setActivityError] = useState(false);
  const [metricsError, setMetricsError] = useState(false);
  const [metrics, setMetrics] = useState({ totalUsers: 0, totalFiles: 0, totalStorage: 0 });
  const [nodes, setNodes] = useState([]);
  const [activities, setActivities] = useState([]);
  const { addToast } = useToast();

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    setActivityError(false);
    setMetricsError(false);
    try {
      const nodesData = await nodeService.getNodes();
      setNodes(nodesData);

      try {
        const actData = await activityService.getAdminActivity({ limit: 5 });
        setActivities(actData?.data || actData?.activities || []);
      } catch (err) {
        console.error("Failed to load admin activity:", err);
        setActivityError(true);
      }

      try {
        const metricsRes = await api.get('/storage/admin/metrics');
        if (metricsRes.data?.data) {
          setMetrics(metricsRes.data.data);
        } else {
          setMetricsError(true);
        }
      } catch (err) {
        console.warn("Metrics endpoint not available", err);
        setMetricsError(true);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data.");
      addToast("Failed to load some dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [addToast]);

  const healthyNodes = nodes.filter(n => n.status === 'HEALTHY').length;
  const degradedNodes = nodes.filter(n => n.status === 'DEGRADED').length;
  const offlineNodes = nodes.filter(n => ['OFFLINE', 'DOWN'].includes(n.status)).length;

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading admin dashboard...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-[#8178F2] w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">System overview and health metrics</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm">{error}</span>
          <button
            onClick={fetchAdminData}
            className="px-3 py-1.5 bg-white border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {metricsError && !error && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-3 text-sm">
          Live metrics are temporarily unavailable. Node and activity data are still shown.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={metrics.totalUsers ?? 'N/A'} 
          icon={Users} 
          colorClass="bg-blue-50 text-blue-500" 
        />
        <StatCard 
          title="Total Files" 
          value={metrics.totalFiles ?? 'N/A'} 
          icon={FileText} 
          colorClass="bg-green-50 text-green-500" 
        />
        <StatCard 
          title="Storage Used" 
          value={formatBytes(metrics.totalStorage)} 
          icon={HardDrive} 
          colorClass="bg-purple-50 text-purple-500" 
        />
        <StatCard 
          title="Node Health" 
          value={`${healthyNodes}/${nodes.length}`} 
          subtitle={`${degradedNodes} Degraded, ${offlineNodes} Offline`}
          icon={Activity} 
          colorClass={offlineNodes > 0 ? "bg-red-50 text-red-500" : (degradedNodes > 0 ? "bg-orange-50 text-orange-500" : "bg-emerald-50 text-emerald-500")} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Node Health Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Storage Nodes</h2>
            <Link to="/admin/nodes" className="text-sm text-[#8178F2] hover:underline">View All</Link>
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-80">
            {nodes.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-4">No nodes available</div>
            ) : (
              nodes.slice(0, 5).map(node => (
                <div key={node.nodeId || node._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${node.status === 'HEALTHY' ? 'bg-emerald-500' : (node.status === 'DEGRADED' ? 'bg-orange-500' : 'bg-red-500')}`} title={node.status}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{node.name || node.nodeId || node._id}</div>
                      <div className="text-xs text-gray-500">{formatBytes(node.usedSpace || 0)} / {formatBytes(node.capacity || node.totalSpace || 0)}</div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    {Math.round(((node.usedSpace || 0) / (node.capacity || node.totalSpace || 1)) * 100)}% Load
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">System Activity</h2>
            <Link to="/admin/activity" className="text-sm text-[#8178F2] hover:underline">View All</Link>
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-80">
            {activityError ? (
              <div className="text-red-600 text-sm text-center py-4">
                Failed to load recent activity.
                <button onClick={fetchAdminData} className="ml-2 underline">Retry</button>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-4">No recent activity</div>
            ) : (
              activities.map((act, i) => (
                <div key={act._id || i} className="flex gap-3 text-sm p-2 border-b border-gray-50 last:border-0">
                  <div className="text-[#8178F2] font-medium min-w-[80px]">{act.action}</div>
                  <div className="text-gray-600 truncate flex-1">{act.metadata?.filename || act.fileId || "System Event"}</div>
                  <div className="text-gray-400 text-xs whitespace-nowrap">
                    {new Date(act.timestamp || act.createdAt || act.date || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
