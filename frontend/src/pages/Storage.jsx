import React, { useState, useEffect } from 'react';
import PageContainer from '../components/layout/PageContainer';
import * as nodeService from '../services/node.service';
import { Server, HardDrive, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

const Storage = () => {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const loadNodes = async () => {
      try {
        const data = await nodeService.getNodes();
        setNodes(data || []);
      } catch (err) {
        console.error('Error fetching nodes:', err);
      }
    };
    loadNodes();
  }, []);
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Storage Nodes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <Server className="w-5 h-5" />
            <span className="text-sm font-medium">Total Nodes</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">4</div>
          <div className="text-xs text-green-500 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> All Healthy</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <HardDrive className="w-5 h-5" />
            <span className="text-sm font-medium">Total Capacity</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">4.5 TB</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium">Used Storage</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">2.25 TB</div>
          <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
            <div className="bg-purple-600 h-1 rounded-full" style={{ width: '50%' }}></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <Server className="w-5 h-5" />
            <span className="text-sm font-medium">Replication Factor</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">2x - 3x</div>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Node Status</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {nodes.map(node => (
          <div key={node.id || node._id} className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${(node.status || 'Unknown') === 'Healthy' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{node.name || 'Unknown Node'}</h3>
                  <div className="flex items-center gap-1 text-xs mt-0.5">
                    {(node.status || 'Unknown') === 'Healthy' ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-orange-500" />}
                    <span className={(node.status || 'Unknown') === 'Healthy' ? 'text-green-600' : 'text-orange-600'}>{node.status || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">{node.used || '0'} / {node.capacity || '0'}</div>
                <div className="text-xs text-gray-500">Used</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Storage Load</span>
                  <span className="font-medium">{node.load || '0%'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${parseInt(node.load || '0') > 80 ? 'bg-orange-500' : 'bg-purple-500'}`} style={{ width: node.load || '0%' }}></div>
                </div>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-gray-50">
                <span className="text-gray-500">Network Latency</span>
                <span className="font-medium text-gray-700">{node.latency || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
};

export default Storage;

