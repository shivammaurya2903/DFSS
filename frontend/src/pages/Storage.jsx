import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import * as nodeService from '../services/node.service';
import * as fileService from '../services/file.service';
import { useAuth } from '../context/AuthContext';
import { Server, HardDrive, CheckCircle, AlertTriangle, Cloud, Zap, FileText, Image as ImageIcon, Video, Music, Archive, FileIcon, BarChart2, Activity } from 'lucide-react';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Storage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        const [nodesData, filesData] = await Promise.all([
          nodeService.getNodes({ signal: controller.signal }),
          fileService.getFiles({ signal: controller.signal })
        ]);
        
        setNodes(Array.isArray(nodesData) ? nodesData : []);
        setFiles(Array.isArray(filesData) ? filesData : []);
      } catch (err) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error('Error fetching data:', err);
      }
    };
    
    loadData();
    
    return () => controller.abort();
  }, []);

  const used = user?.usedStorage || 0;
  const quota = user?.storageQuota || (100 * 1024 * 1024);
  const available = Math.max(0, quota - used);
  const percentage = Math.min(100, Math.round((used / quota) * 100)) || 0;

  // Compression savings
  let originalTotal = 0;
  let storedTotal = 0;
  let compressionApplied = false;
  
  files.forEach(f => {
    const orig = f.size || 0;
    const stored = f.storedSize || orig;
    originalTotal += orig;
    storedTotal += stored;
    if (stored < orig) compressionApplied = true;
  });
  
  const saved = Math.max(0, originalTotal - storedTotal);

  // Health summary
  const healthyNodes = nodes.filter(n => n.status === 'HEALTHY').length;
  
  // File type breakdown
  const fileTypes = {
    Images: { size: 0, count: 0, color: '#3b82f6', icon: ImageIcon },
    Documents: { size: 0, count: 0, color: '#10b981', icon: FileText },
    Videos: { size: 0, count: 0, color: '#8b5cf6', icon: Video },
    Audio: { size: 0, count: 0, color: '#f59e0b', icon: Music },
    Archives: { size: 0, count: 0, color: '#ef4444', icon: Archive },
    Other: { size: 0, count: 0, color: '#6b7280', icon: FileIcon }
  };

  files.forEach(f => {
    const size = f.storedSize || f.size || 0;
    const type = (f.mimetype || f.type || '').toLowerCase();
    
    if (type.startsWith('image/')) {
      fileTypes.Images.size += size;
      fileTypes.Images.count++;
    } else if (type.includes('pdf') || type.includes('text') || type.includes('msword') || type.includes('document')) {
      fileTypes.Documents.size += size;
      fileTypes.Documents.count++;
    } else if (type.startsWith('video/')) {
      fileTypes.Videos.size += size;
      fileTypes.Videos.count++;
    } else if (type.startsWith('audio/')) {
      fileTypes.Audio.size += size;
      fileTypes.Audio.count++;
    } else if (type.includes('zip') || type.includes('tar') || type.includes('gzip') || type.includes('rar') || type.includes('7z')) {
      fileTypes.Archives.size += size;
      fileTypes.Archives.count++;
    } else {
      fileTypes.Other.size += size;
      fileTypes.Other.count++;
    }
  });

  const activeCategories = Object.entries(fileTypes).filter(([_, data]) => data.count > 0).sort((a, b) => b[1].size - a[1].size);

  // Largest files
  const topFiles = [...files]
    .sort((a, b) => (b.storedSize || b.size || 0) - (a.storedSize || a.size || 0))
    .slice(0, 5);

  const getProgressColor = (pct) => {
    if (pct > 90) return 'bg-red-500';
    if (pct >= 80) return 'bg-orange-500';
    return 'bg-[#8178F2]';
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">Storage</h1>
        <p className="text-gray-500 text-sm mt-1">Track your distributed storage usage, compression savings, and system health.</p>
      </div>
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Cloud className="w-4 h-4 text-[#8178F2]" />
            <span className="text-sm font-medium">Storage Used</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{formatBytes(used)}</div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
            <div className={`h-1.5 rounded-full ${getProgressColor(percentage)}`} style={{ width: `${percentage}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <HardDrive className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Files Stored</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{files.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total distributed files</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Compression Saved</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{formatBytes(saved)}</div>
          <div className="text-xs text-gray-500 mt-1">Space saved by optimization</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Server className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Storage Nodes</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{nodes.length}</div>
          <div className="text-xs text-gray-500 mt-1">{healthyNodes}/{nodes.length} nodes healthy</div>
        </div>
      </div>

      {/* Storage Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#8178F2]" />
          Storage Overview
        </h2>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4">
          <div>
            <div className="text-4xl font-bold text-gray-800 tracking-tight">
              {formatBytes(used)} <span className="text-xl font-medium text-gray-400">/ {formatBytes(quota)}</span>
            </div>
          </div>
          <div className="mt-2 md:mt-0 text-right">
            <div className="text-sm font-medium text-gray-600">{formatBytes(available)} available</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
          <div className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(percentage)}`} style={{ width: `${percentage}%` }}></div>
        </div>
        
        <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg inline-block border border-gray-100">
          Storage usage is calculated from the optimized size stored by the system, not the original file size.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* File Type Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#8178F2]" />
            File Type Breakdown
          </h2>
          
          {activeCategories.length > 0 ? (
            <div className="space-y-4">
              {activeCategories.map(([name, data]) => {
                const pct = storedTotal > 0 ? (data.size / storedTotal) * 100 : 0;
                return (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${data.color}15`, color: data.color }}>
                      <data.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{name} <span className="text-gray-400 font-normal text-xs ml-1">({data.count})</span></span>
                        <span className="text-gray-600">{formatBytes(data.size)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: data.color }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">No files stored yet.</div>
          )}
        </div>

        {/* Compression Analysis */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#8178F2]" />
            Compression Analysis
          </h2>
          
          {compressionApplied && saved > 0 ? (
            <div className="flex flex-col h-full justify-center pb-8">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Original Size</div>
                  <div className="text-xl font-semibold text-gray-700">{formatBytes(originalTotal)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Stored Size</div>
                  <div className="text-xl font-semibold text-[#8178F2]">{formatBytes(storedTotal)}</div>
                </div>
              </div>
              
              <div className="relative pt-4">
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex">
                  <div className="bg-[#8178F2] h-full" style={{ width: `${(storedTotal/originalTotal)*100}%` }}></div>
                  <div className="bg-green-400 h-full relative overflow-hidden" style={{ width: `${(saved/originalTotal)*100}%` }}>
                    <div className="absolute inset-0 bg-white/20" style={{ background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)' }}></div>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs font-medium">
                  <span className="text-[#8178F2]">Used Space</span>
                  <span className="text-green-600">Saved {Math.round((saved/originalTotal)*100)}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
              <Zap className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">No compression savings yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px]">Upload files that can be compressed to see savings here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Largest Files */}
      {topFiles.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileIcon className="w-5 h-5 text-[#8178F2]" />
            Largest Files
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium px-2">File</th>
                  <th className="pb-3 font-medium px-2">Original Size</th>
                  <th className="pb-3 font-medium px-2">Stored Size</th>
                  <th className="pb-3 font-medium px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {topFiles.map(file => {
                  const orig = file.size || 0;
                  const stored = file.storedSize || orig;
                  const isCompressed = stored < orig;
                  
                  return (
                    <tr 
                      key={file._id || file.id} 
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/files/${file._id || file.id}`)}
                    >
                      <td className="py-3 px-2 flex items-center gap-3">
                        <div className="bg-purple-50 p-2 rounded-lg text-[#8178F2]">
                          <FileIcon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-700 truncate max-w-[200px] sm:max-w-[300px]">{file.filename || file.name}</span>
                      </td>
                      <td className="py-3 px-2 text-gray-500">{formatBytes(orig)}</td>
                      <td className="py-3 px-2 font-medium text-gray-700">{formatBytes(stored)}</td>
                      <td className="py-3 px-2 text-right">
                        {isCompressed && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                            <Zap className="w-3 h-3" />
                            -{Math.round(((orig - stored) / orig) * 100)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Storage Nodes */}
      <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2 mt-8">
        <Server className="w-5 h-5 text-[#8178F2]" />
        Storage Nodes
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {nodes.map(node => (
          <div 
            key={node.id || node._id} 
            className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow cursor-pointer shadow-sm"
            onClick={() => navigate(`/storage/nodes/${node.id || node._id}`)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${(node.status || 'Unknown') === 'HEALTHY' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{node.name || node.nodeId || 'Unknown Node'}</h3>
                  <div className="flex items-center gap-1.5 text-xs mt-1">
                    {(node.status || 'Unknown') === 'HEALTHY' ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                    <span className={(node.status || 'Unknown') === 'HEALTHY' ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>{node.status || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">
                  {formatBytes(node.usedSpace || 0)} <span className="text-gray-400 font-normal">/ {formatBytes(node.capacity || 0)}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">Used Capacity</div>
              </div>
            </div>
            
            <div className="space-y-3 bg-gray-50 rounded-lg p-3 border border-gray-100/50">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">Storage Load</span>
                  <span className="font-semibold text-gray-700">{node.currentLoad || '0%'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${parseInt(node.currentLoad || '0') > 80 ? 'bg-orange-500' : 'bg-[#8178F2]'}`} style={{ width: node.currentLoad || '0%' }}></div>
                </div>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-gray-200">
                <span className="text-gray-500">Network Latency</span>
                <span className="font-medium text-gray-700">{node.latency || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-gray-500">Last Heartbeat</span>
                <span className="font-medium text-gray-700">{node.lastHeartbeat ? new Date(node.lastHeartbeat).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
        {nodes.length === 0 && (
          <div className="col-span-full p-10 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <Server className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-700 font-medium mb-1">No active storage nodes</h3>
            <p className="text-gray-500 text-sm">There are currently no storage nodes registered to the system.</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Storage;
