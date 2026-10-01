import React, { useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Clock } from 'lucide-react';
import axios from 'axios';

const Recent = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/files/recent', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => setData(res.data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Clock className="text-purple-600" /> Recent
        </h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
        {data.length === 0 ? 'No recent files found.' : 'Recent files loaded.'}
      </div>
    </PageContainer>
  );
};

export default Recent;
