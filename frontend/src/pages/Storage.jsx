import React, { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import * as nodeService from '../services/node.service';
import * as fileService from '../services/file.service';
import { useAuth } from '../context/AuthContext';
import { Server, HardDrive, CheckCircle, AlertTriangle, Cloud, Zap } from 'lucide-react';

const Storage = () => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        const nodesData = await nodeService.getNodes({ signal: controller.signal });
        setNodes(Array.isArray(nodesData) ? nodesData : []);
        
        const filesData = await fileService.getFiles({ signal: controller.signal });
        setFiles(Array.isArray(filesData) ? filesData : []);
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error('Error fetching data:', err);
      }
    };
    
    loadData();
    
    return () => {
      controller.abort();
    };
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const used = user?.usedStorage || 0;
  const quota = user?.storageQuota || (100 * 1024 * 1024);
  const available = quota - used;
  const percentage = Math.min(100, Math.round((used / quota) * 100)) || 0;

  // Calculate compression savings
  let originalTotal = 0;
  let storedTotal = 0;
  files.forEach(f => {
    originalTotal += (f.size || 0);
    storedTotal += (f.storedSize || f.size || 0);
  });
  const saved = originalTotal - storedTotal;
  const savedPercentage = originalTotal > 0 ? Math.round((saved / originalTotal) * 100) : 0;

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Your Storage</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor your available storage, see how much space your optimized files consume, and identify the files using the most space.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-5 rounded-xl border border-gray-100 col-span-1 md:col-span-2">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3 text-gray-500">
              <Cloud className="w-5 h-5 text-[#8178F2]" />
              <span className="text-sm font-medium">Storage Quota</span>
            </div>
            <div className="text-sm font-semibold text-gray-700">{percentage}% Used</div>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{formatBytes(used)} <span className="text-base font-normal text-gray-500">/ {formatBytes(quota)}</span></div>
          <p className="text-xs text-gray-500 mb-4">{formatBytes(available)} available</p>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className={`h-2 rounded-full ${percentage > 90 ? 'bg-red-500' : 'bg-[#8178F2]'}`} style={{ width: `${percentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <Zap className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium">Compression Savings</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{formatBytes(saved)}</div>
          <div className="text-xs text-green-600 mt-2 font-medium bg-green-50 inline-block px-2 py-1 rounded-md">
            Saved {savedPercentage}% space
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <HardDrive className="w-5 h-5" />
            <span className="text-sm font-medium">Files Stored</span>
          </div>
          <div className="text-3xl font-bold text-gray-800">{files.length}</div>
          <div className="text-xs text-gray-500 mt-2">Across your workspace</div>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">System Storage Nodes</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {nodes.map(node => (
          <div key={node.id || node._id} className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${(node.status || 'Unknown') === 'HEALTHY' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{node.name || node.nodeId || 'Unknown Node'}</h3>
                  <div className="flex items-center gap-1 text-xs mt-0.5">
                    {(node.status || 'Unknown') === 'HEALTHY' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-orange-500" />}
                    <span className={(node.status || 'Unknown') === 'HEALTHY' ? 'text-green-600' : 'text-orange-600'}>{node.status || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">{(node.usedSpace / 1024 / 1024 / 1024).toFixed(2) || '0'} GB / {(node.capacity / 1024 / 1024 / 1024).toFixed(2) || '0'} GB</div>
                <div className="text-xs text-gray-500">Used</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Storage Load</span>
                  <span className="font-medium">{node.currentLoad || '0%'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${parseInt(node.currentLoad || '0') > 80 ? 'bg-orange-500' : 'bg-[#8178F2]'}`} style={{ width: node.currentLoad || '0%' }}></div>
                </div>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-gray-50">
                <span className="text-gray-500">Network Latency</span>
                <span className="font-medium text-gray-700">{node.latency || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
        {nodes.length === 0 && (
          <div className="col-span-full p-8 text-center border border-dashed border-gray-200 rounded-xl text-gray-500">
            No active storage nodes available.
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Storage;
