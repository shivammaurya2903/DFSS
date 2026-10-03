import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Activity, ServerCrash, ServerCog, Search, Filter } from 'lucide-react';
import * as nodeService from '../../services/node.service';
import { useToast } from '../../context/ToastContext';

const AdminNodes = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNodes = async () => {
      setLoading(true);
      try {
        const data = await nodeService.getNodes();
        setNodes(data);
      } catch (err) {
        addToast("Failed to load storage nodes", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchNodes();
  }, [addToast]);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'HEALTHY':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200"><Activity className="w-3 h-3" /> Healthy</span>;
      case 'DEGRADED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200"><ServerCog className="w-3 h-3" /> Degraded</span>;
      case 'DOWN':
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200"><ServerCrash className="w-3 h-3" /> Down</span>;
    }
  };

  const filteredNodes = nodes.filter(node => {
    const matchStatus = filter === 'ALL' || node.status === filter;
    const matchSearch = node.name?.toLowerCase().includes(search.toLowerCase()) || node.id?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Server className="w-6 h-6 text-[#8178F2]" /> Storage Nodes
          </h1>
          <p className="text-sm text-gray-500">Manage and monitor distributed storage nodes</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search nodes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#8178F2]/20 focus:border-[#8178F2] transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#8178F2]/20 focus:border-[#8178F2] transition-all cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="HEALTHY">Healthy</option>
              <option value="DEGRADED">Degraded</option>
              <option value="DOWN">Down</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Node</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Load</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Latency</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Heartbeat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading nodes...</td></tr>
              ) : filteredNodes.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No nodes found.</td></tr>
              ) : (
                filteredNodes.map(node => {
                  const loadPercent = Math.round((node.usedSpace / node.capacity) * 100) || 0;
                  return (
                    <tr 
                      key={node.id} 
                      onClick={() => navigate(`/storage/nodes/${node.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{node.name || node.id}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{node.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(node.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{formatBytes(node.capacity)}</div>
                        <div className="text-xs text-gray-500">{formatBytes(node.usedSpace)} used</div>
                      </td>
                      <td className="px-6 py-4 w-48">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{loadPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${loadPercent > 90 ? 'bg-red-500' : (loadPercent > 75 ? 'bg-orange-500' : 'bg-[#8178F2]')}`} 
                            style={{ width: `${Math.min(100, loadPercent)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-800">{node.latency ? `${node.latency}ms` : 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {node.lastHeartbeat ? new Date(node.lastHeartbeat).toLocaleString() : 'Never'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminNodes;
