import React, { useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Star } from 'lucide-react';
import api from '../services/api';
import EmptyState from '../components/common/EmptyState';

const Favorites = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    api.get(`/files/favorites`, { signal: controller.signal })
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
          <Star className="text-purple-600 w-6 h-6" /> Favorites
        </h1>
      </div>
      {data.length === 0 ? (
        <EmptyState 
          icon={Star} 
          title="No favorites yet" 
          description="Files and folders you star will appear here for quick access." 
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
          Favorites loaded.
        </div>
      )}
    </PageContainer>
  );
};

export default Favorites;

