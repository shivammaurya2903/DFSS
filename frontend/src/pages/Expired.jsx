import React, { useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Trash2 } from 'lucide-react';
import api from '../services/api';
import EmptyState from '../components/common/EmptyState';

const Expired = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    api.get(`/files/expired`, { signal: controller.signal })
      .then(res => setData(res.data?.data || []))
      .catch(err => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
        console.error(err);
      });
    return () => controller.abort();
  }, []);

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trash2 className="text-purple-600 w-6 h-6" /> Expired Files
        </h1>
      </div>
      {data.length === 0 ? (
        <EmptyState 
          icon={Trash2} 
          title="No expired links" 
          description="Files with expired sharing permissions will be listed here." 
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
          Expired files loaded.
        </div>
      )}
    </PageContainer>
  );
};

export default Expired;

