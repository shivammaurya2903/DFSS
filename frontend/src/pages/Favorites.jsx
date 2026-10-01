import React, { useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Star } from 'lucide-react';
import axios from 'axios';
import EmptyState from '../components/common/EmptyState';

const Favorites = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // In a real app we'd use a generic configured axios instance
    axios.get(`\$\{import.meta.env.VITE_API_URL\}/files/favorites`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => setData(res.data.data))
      .catch(err => console.error(err));
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

