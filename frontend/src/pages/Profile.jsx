import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Mail, Shield, HardDrive, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatBytes, formatDate } from '../utils/formatters';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const used = user?.usedStorage || 0;
  const quota = user?.storageQuota || (100 * 1024 * 1024);
  const percentage = Math.min(100, Math.round((used / quota) * 100)) || 0;

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#17181C]">My Profile</h1>
        <p className="text-[#6F737D] text-sm mt-1">Manage your account information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[#E7E9EF] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#E7E9EF] flex items-center gap-6">
              <div className="w-20 h-20 bg-[#F5F7FB] rounded-full flex items-center justify-center text-[#8178F2] font-bold text-3xl shrink-0">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#17181C]">{user?.name || 'DFSS User'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#8178F2]/10 text-[#8178F2] capitalize">
                    {user?.role || 'User'}
                  </span>
                  <span className="text-sm text-[#6F737D] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-sm font-semibold text-[#17181C] uppercase tracking-wider mb-4">Personal Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-[#F8F9FC] p-4 rounded-lg border border-[#E7E9EF]">
                  <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-[#6F737D]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6F737D] font-medium uppercase">Email Address</p>
                    <p className="font-medium text-[#17181C]">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-[#F8F9FC] p-4 rounded-lg border border-[#E7E9EF]">
                  <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-[#6F737D]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#6F737D] font-medium uppercase">Account Role</p>
                    <p className="font-medium text-[#17181C] capitalize">{user?.role || 'User'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#E7E9EF] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#E7E9EF] flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[#8178F2]" />
              <h2 className="text-lg font-bold text-[#17181C]">Storage</h2>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-[#17181C]">{percentage}% Used</span>
                  <span className="text-[#6F737D]">{formatBytes(used)} / {formatBytes(quota)}</span>
                </div>
                <div className="w-full bg-[#F5F7FB] rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${percentage > 90 ? 'bg-[#E88B8B]' : 'bg-[#8178F2]'}`} style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
              <p className="text-xs text-[#6F737D] bg-[#F5F7FB] p-3 rounded-lg border border-[#E7E9EF]">
                Your quota is calculated from the optimized size stored, not the original file size. Uploading identical files will deduplicate and save you space.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E9EF] overflow-hidden shadow-sm">
            <div className="p-6">
              <h2 className="text-sm font-semibold text-[#17181C] uppercase tracking-wider mb-4">Account Actions</h2>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E7E9EF] rounded-xl text-sm font-medium text-[#E88B8B] hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Profile;
