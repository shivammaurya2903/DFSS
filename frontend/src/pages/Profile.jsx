import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <User className="text-purple-600" /> My Profile
        </h1>
        <Button variant="outline" className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Logout
        </Button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-left text-gray-700">
        {user ? (
          <div className="space-y-3">
            <p><strong className="text-gray-900">Name:</strong> {user.name}</p>
            <p><strong className="text-gray-900">Email:</strong> {user.email}</p>
            <p><strong className="text-gray-900">Role:</strong> {user.role}</p>
          </div>
        ) : 'Loading profile...'}
      </div>
    </PageContainer>
  );
};

export default Profile;

