import React, { useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { User } from 'lucide-react';
import axios from 'axios';

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => setUser(res.data.user))
      .catch(err => console.error(err));
  }, []);

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <User className="text-purple-600" /> My Profile
        </h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-left text-gray-500">
        {user ? (
          <div>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
          </div>
        ) : 'Loading profile...'}
      </div>
    </PageContainer>
  );
};

export default Profile;
