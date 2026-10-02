import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import { User, LogOut, Mail, Shield, HardDrive } from 'lucide-react';
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

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const used = user?.usedStorage || 0;
  const quota = user?.storageQuota || (100 * 1024 * 1024);

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account information and preferences.</p>
        </div>
        <Button variant="outline" className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
            </div>
            <div className="p-6">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                    <div className="w-12 h-12 bg-[#f4f2ff] rounded-full flex items-center justify-center text-[#8178F2] font-bold text-xl">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium text-gray-800">{user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium text-gray-800">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pb-2">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Role</p>
                      <p className="font-medium text-gray-800 capitalize">{user.role}</p>
                    </div>
                  </div>
                </div>
              ) : 'Loading profile...'}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#f8fafc] rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 text-gray-800 font-semibold mb-4">
              <HardDrive className="w-5 h-5 text-[#8178F2]" />
              Storage Information
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Storage Quota</p>
                <p className="text-lg font-medium text-gray-800">{formatBytes(quota)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Currently Used</p>
                <p className="text-lg font-medium text-[#8178F2]">{formatBytes(used)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Profile;
