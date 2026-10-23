import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { Server, CheckCircle, AlertTriangle, ArrowLeft, Activity, HardDrive, Wifi, Clock, Database } from 'lucide-react';
import * as nodeService from '../services/node.service';
import { formatBytes } from '../utils/formatters';

const NodeDetails = () => {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const [node, setNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchNode = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await nodeService.getNodeDetails(nodeId);
        setNode(data);
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        setError('Failed to load storage node details.');
      } finally {
        setLoading(false);
      }
    };

    fetchNode();
    return () => controller.abort();
  }, [nodeId]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center py-20 text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8178F2] mr-3"></div>
          Loading storage node details...
        </div>
      </PageContainer>
    );
  }

  if (error || !node) {
    return (
      <PageContainer>
        <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
        <div className="bg-white rounded-xl border border-red-100 p-8 text-center text-red-500">
          {error || 'Storage node not found.'}
        </div>
      </PageContainer>
    );
  }

  const capacity = node.capacity || node.totalSpace || 0;
  const used = node.usedSpace || node.used || 0;
  const loadPercentage = capacity > 0 ? Math.min(100, Math.round((used / capacity) * 100)) : 0;
  const status = node.status || 'HEALTHY';

  return (
    <PageContainer>
      <button 
        onClick={() => navigate('/storage')} 
        className="flex items-center text-sm text-[#6F737D] hover:text-[#17181C] mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Storage
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E7E9EF] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-xl ${status === 'HEALTHY' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
            <Server className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#17181C]">{node.name || node.nodeId || nodeId}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${status === 'HEALTHY' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                {status === 'HEALTHY' ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />}
                {status}
              </span>
            </div>
            <p className="text-xs text-[#6F737D] mt-1 font-mono">ID: {node.id || node._id || nodeId} {node.url ? `• URL: ${node.url}` : ''}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E7E9EF] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[#6F737D] flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#8178F2]" /> Capacity Used
            </span>
            <span className="text-xs font-semibold text-[#8178F2]">{loadPercentage}%</span>
          </div>
          <div className="text-2xl font-bold text-[#17181C] mb-2">{formatBytes(used)}</div>
          <div className="w-full bg-[#F5F7FB] rounded-full h-2 mb-2 overflow-hidden">
            <div className="bg-[#8178F2] h-full rounded-full transition-all duration-500" style={{ width: `${loadPercentage}%` }}></div>
          </div>
          <div className="text-xs text-[#6F737D]">Total Capacity: {formatBytes(capacity)}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E7E9EF] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[#6F737D] flex items-center gap-2">
              <Wifi className="w-4 h-4 text-blue-500" /> Network Latency
            </span>
          </div>
          <div className="text-2xl font-bold text-[#17181C] mb-2">{node.latency ? `${node.latency} ms` : 'N/A'}</div>
          <div className="text-xs text-[#6F737D]">Internal cluster node communication speed</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E7E9EF] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[#6F737D] flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-500" /> Last Heartbeat
            </span>
          </div>
          <div className="text-xl font-bold text-[#17181C] mb-2">
            {node.lastHeartbeat ? new Date(node.lastHeartbeat).toLocaleTimeString() : 'Active'}
          </div>
          <div className="text-xs text-[#6F737D]">
            {node.lastHeartbeat ? new Date(node.lastHeartbeat).toLocaleDateString() : 'Monitoring active'}
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E7E9EF]">
        <h2 className="text-base font-semibold text-[#17181C] mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-[#8178F2]" /> System Node Information
        </h2>
        <div className="space-y-4 text-sm divide-y divide-[#F5F7FB]">
          <div className="flex justify-between items-center pt-3">
            <span className="text-[#6F737D]">Node Name / Identifier</span>
            <span className="font-medium text-[#17181C]">{node.name || node.nodeId || nodeId}</span>
          </div>
          <div className="flex justify-between items-center pt-3">
            <span className="text-[#6F737D]">Node Base Endpoint</span>
            <span className="font-mono text-xs text-[#8178F2] bg-[#F5F7FB] px-2 py-1 rounded border border-[#E7E9EF]">{node.url || node.internalUrl || 'Internal Node Endpoint'}</span>
          </div>
          <div className="flex justify-between items-center pt-3">
            <span className="text-[#6F737D]">Storage Allocation State</span>
            <span className="font-medium text-green-600">Active (Accepting Chunks)</span>
          </div>
          <div className="flex justify-between items-center pt-3">
            <span className="text-[#6F737D]">Current Storage Load</span>
            <span className="font-semibold text-[#17181C]">{node.currentLoad || `${loadPercentage}%`}</span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default NodeDetails;

