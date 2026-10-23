import React, { useCallback, useEffect, useState } from 'react';
import { Microscope, RefreshCw, AlertCircle, Inbox } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const formatDate = (value) => {
  if (!value) return 'Never';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
};

const AdminResearch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchDebugData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/storage/admin/placement/debug');
      if (!response.data?.data) {
        throw new Error('The placement metrics API returned no data.');
      }
      setData(response.data.data);
    } catch (err) {
      setData(null);
      setError(err.userMessage || err.response?.data?.message || err.message || 'Unable to load placement metrics.');
      addToast('Placement metrics unavailable.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDebugData();
  }, [fetchDebugData]);

  const simulatedNodes = (data?.nodes || []).filter(node => node.injectedConditions?.active);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Microscope className="w-6 h-6 text-[#8178F2]" /> Research & Placement Analytics
          </h1>
          <p className="text-sm text-gray-500">Live placement decisions and strategy evidence</p>
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

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Loading placement analytics...
        </div>
      )}

      {!loading && error && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Placement analytics unavailable</h3>
            <p className="text-xs mt-1">{error}</p>
            <button onClick={fetchDebugData} className="text-xs font-semibold underline mt-2">
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Latest Strategy</div>
              <div className="font-medium text-[#8178F2]">{data.activeStrategy || 'None yet'}</div>
              <div className="text-xs text-gray-400 mt-1">
                {(data.strategies || []).join(', ')}
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Last Decision</div>
              <div className="font-medium text-gray-800">{formatDate(data.lastRun)}</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Decisions</div>
              <div className="font-medium text-gray-800">{data.totalDecisions ?? 0}</div>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Healthy Nodes</div>
              <div className="font-medium text-gray-800">
                {data.eligibleCount ?? 0} / {data.totalNodes ?? 0}
              </div>
            </div>
          </div>

          {simulatedNodes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
              <span className="font-semibold">SIMULATED conditions active:</span>{' '}
              {simulatedNodes.map(node => node.nodeId).join(', ')}. These are logical
              research conditions, not physical hardware measurements.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Placement Decisions</h2>
              {data.decisions?.length ? (
                <div className="space-y-3">
                  {data.decisions.map((decision) => (
                    <div key={decision.decisionId} className="p-3 border border-gray-100 rounded-lg text-sm">
                      <div className="flex justify-between items-center gap-3 mb-2">
                        <span className="font-medium text-gray-700 truncate">
                          {decision.fileId || 'Unknown file'}
                        </span>
                        <span className="text-xs bg-[#f4f2ff] text-[#8178F2] px-2 py-0.5 rounded shrink-0">
                          {decision.strategy}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs space-y-1">
                        <div>Chunk: {decision.chunkId}</div>
                        <div>Nodes: {(decision.nodesChosen || []).join(', ') || 'None'}</div>
                        <div>
                          Decision time: {decision.latency ?? 0} ms
                          {decision.score != null ? ` | Score: ${Number(decision.score).toFixed(3)}` : ''}
                        </div>
                        <div>{formatDate(decision.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Inbox className="w-8 h-8 mb-2" />
                  <p className="text-sm">No placement decisions recorded yet.</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">Candidate Node Scores</h2>
              <p className="text-xs text-gray-500 mb-4">{data.candidateScoresNote}</p>
              {data.candidateScores?.length ? (
                <div className="space-y-3">
                  {data.candidateScores.map((candidate, index) => (
                    <div key={`${candidate.nodeId}-${index}`} className="p-3 border border-gray-100 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700 text-sm">{candidate.nodeId}</span>
                        <span className="text-sm font-bold text-[#8178F2]">
                          {candidate.score != null ? Number(candidate.score).toFixed(3) : 'N/A'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mt-2">
                        <div>Load: {candidate.factors?.load ?? 'N/A'}</div>
                        <div>Free: {candidate.factors?.capacity ?? 'N/A'}</div>
                        <div>Latency: {candidate.factors?.latency ?? 'N/A'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <Inbox className="w-8 h-8 mb-2" />
                  <p className="text-sm">No adaptive pair scores recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResearch;
