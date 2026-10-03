import React, { useState, useEffect } from 'react';
import { Microscope, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminResearch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/storage/admin/placement/debug');
      setData(response.data?.data || null);
    } catch (err) {
      console.warn("Placement debug not available", err);
      // Mock data for display if endpoint fails
      setData({
        strategy: "Cost-Optimized Geographic Placement",
        lastRun: new Date().toISOString(),
        decisions: [
          { fileId: "mock-123", chunks: 3, nodesChosen: ["node-A", "node-B", "node-C"], latency: "12ms" }
        ],
        candidateScores: {
          "node-A": { score: 98, factors: { load: 0.1, capacity: 0.9, latency: 10 } },
          "node-B": { score: 85, factors: { load: 0.4, capacity: 0.6, latency: 15 } }
        }
      });
      addToast("Loaded mock data. Debug API unavailable.", "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Microscope className="w-6 h-6 text-[#8178F2]" /> Research & Placement Analytics
          </h1>
          <p className="text-sm text-gray-500">Internal metrics for file distribution strategies</p>
        </div>
        <button 
          onClick={fetchDebugData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {!data && !loading && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Data Unavailable</h3>
            <p className="text-xs mt-1">The placement metrics API returned no data.</p>
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Strategy</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Active Algorithm</div>
                <div className="font-medium text-[#8178F2]">{data.strategy || "Unknown"}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Evaluation</div>
                <div className="font-medium text-gray-800">
                  {data.lastRun ? new Date(data.lastRun).toLocaleString() : "Never"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Placement Decisions</h2>
              <div className="space-y-3">
                {data.decisions?.map((dec, i) => (
                  <div key={i} className="p-3 border border-gray-100 rounded-lg text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">{dec.fileId}</span>
                      <span className="text-xs bg-[#f4f2ff] text-[#8178F2] px-2 py-0.5 rounded">{dec.chunks} chunks</span>
                    </div>
                    <div className="text-gray-500 text-xs mt-2">
                      Nodes: {dec.nodesChosen?.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Candidate Node Scores</h2>
              <div className="space-y-3">
                {data.candidateScores && Object.entries(data.candidateScores).map(([nodeId, info]) => (
                  <div key={nodeId} className="p-3 border border-gray-100 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700 text-sm">{nodeId}</span>
                      <span className="text-sm font-bold text-[#8178F2]">{info.score} pts</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mt-2">
                      <div>Load: {info.factors?.load}</div>
                      <div>Cap: {info.factors?.capacity}</div>
                      <div>Lat: {info.factors?.latency}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResearch;
