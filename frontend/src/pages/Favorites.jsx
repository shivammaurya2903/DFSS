import React, { useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Star } from 'lucide-react';
import axios from 'axios';

const Favorites = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // In a real app we'd use a generic configured axios instance
    axios.get('http://localhost:5000/api/files/favorites', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => setData(res.data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Star className="text-purple-600" /> Favorites
        </h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
        {data.length === 0 ? 'No favorite files found.' : 'Favorites loaded.'}
      </div>
    </PageContainer>
  );
};

export default Favorites;
