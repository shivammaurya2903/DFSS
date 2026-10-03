import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { Shield, HardDrive, User, Info, ChevronRight, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatBytes } from '../utils/formatters';

const Settings = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('security');

  const tabs = [
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'account', label: 'Account', icon: User },
    { id: 'about', label: 'About', icon: Info }
  ];

  const handleUpdatePassword = () => {
    addToast('Password update functionality is coming soon.', 'info');
  };

  const used = user?.usedStorage || 0;
  const quota = user?.storageQuota || (100 * 1024 * 1024);

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#17181C]">Settings</h1>
        <p className="text-[#6F737D] text-sm mt-1">Manage your account, security, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl font-medium text-sm transition-colors ${
                  isActive 
                    ? 'bg-[#8178F2] text-white shadow-sm' 
                    : 'text-[#6F737D] hover:bg-white hover:text-[#17181C] border border-transparent hover:border-[#E7E9EF]'
                }`}
              >
                <Icon className="w-5 h-5" /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-[#E7E9EF] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#E7E9EF]">
                <h2 className="text-lg font-bold text-[#17181C]">Security</h2>
                <p className="text-[#6F737D] text-sm mt-1">Manage your password and active sessions.</p>
              </div>
              
              <div className="p-6 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#F5F7FB]">
                  <div>
                    <h3 className="font-semibold text-[#17181C]">Change Password</h3>
                    <p className="text-sm text-[#6F737D] mt-1 max-w-md">Ensure your account is using a long, random password to stay secure.</p>
                  </div>
                  <button onClick={handleUpdatePassword} className="px-5 py-2.5 bg-white border border-[#E7E9EF] rounded-xl text-sm font-medium text-[#17181C] hover:bg-[#F5F7FB] transition-colors self-start md:self-auto flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Update
                  </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#F5F7FB]">
                  <div>
                    <h3 className="font-semibold text-[#17181C] flex items-center gap-2">Two-Factor Authentication <span className="text-[10px] uppercase bg-[#F5F7FB] border border-[#E7E9EF] text-[#6F737D] px-2 py-0.5 rounded font-bold">Coming Soon</span></h3>
                    <p className="text-sm text-[#6F737D] mt-1 max-w-md">Add an extra layer of security to your account.</p>
                  </div>
                  <button disabled className="px-5 py-2.5 border border-[#E7E9EF] rounded-xl text-sm font-medium text-[#6F737D] bg-[#F5F7FB] cursor-not-allowed self-start md:self-auto">
                    Enable
                  </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-[#17181C]">Active Sessions</h3>
                    <p className="text-sm text-[#6F737D] mt-1 max-w-md">Current active session via JWT token.</p>
                  </div>
                  <div className="text-sm text-[#8178F2] bg-[#8178F2]/10 px-3 py-1.5 rounded-lg font-medium border border-[#8178F2]/20">
                    Current Device
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="bg-white rounded-xl border border-[#E7E9EF] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#E7E9EF]">
                <h2 className="text-lg font-bold text-[#17181C]">Storage Preferences</h2>
                <p className="text-[#6F737D] text-sm mt-1">View your current usage and limits.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F5F7FB] rounded-xl border border-[#E7E9EF]">
                    <p className="text-xs font-semibold text-[#6F737D] uppercase mb-1">Total Quota</p>
                    <p className="text-2xl font-bold text-[#17181C]">{formatBytes(quota)}</p>
                  </div>
                  <div className="p-4 bg-[#F5F7FB] rounded-xl border border-[#E7E9EF]">
                    <p className="text-xs font-semibold text-[#6F737D] uppercase mb-1">Currently Used</p>
                    <p className="text-2xl font-bold text-[#8178F2]">{formatBytes(used)}</p>
                  </div>
                </div>
                <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Your quota is calculated from the optimized size stored, not the original file size. Deduplication works across your entire account automatically.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="bg-white rounded-xl border border-[#E7E9EF] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#E7E9EF]">
                <h2 className="text-lg font-bold text-[#17181C]">Account Data</h2>
                <p className="text-[#6F737D] text-sm mt-1">Manage your identity and session.</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4 pb-6 border-b border-[#F5F7FB]">
                  <div>
                    <p className="text-xs font-semibold text-[#6F737D] uppercase mb-1">Name</p>
                    <p className="font-medium text-[#17181C]">{user?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#6F737D] uppercase mb-1">Email</p>
                    <p className="font-medium text-[#17181C]">{user?.email}</p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#F5F7FB]">
                  <div>
                    <h3 className="font-semibold text-[#17181C]">Sign Out</h3>
                    <p className="text-sm text-[#6F737D] mt-1 max-w-md">Log out of your current session.</p>
                  </div>
                  <button onClick={() => { logout(); navigate('/'); }} className="px-5 py-2.5 border border-[#E7E9EF] rounded-xl text-sm font-medium text-[#17181C] hover:bg-[#F5F7FB] transition-colors self-start md:self-auto">
                    Sign Out
                  </button>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-[#E88B8B]">Delete Account</h3>
                    <p className="text-sm text-[#6F737D] mt-1 max-w-md">Permanently delete your account and all data.</p>
                  </div>
                  <button disabled className="px-5 py-2.5 border border-red-200 bg-red-50 rounded-xl text-sm font-medium text-red-400 cursor-not-allowed self-start md:self-auto" title="Coming soon">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white rounded-xl border border-[#E7E9EF] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#E7E9EF]">
                <h2 className="text-lg font-bold text-[#17181C]">About DFSS</h2>
                <p className="text-[#6F737D] text-sm mt-1">System information and architecture.</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-[#17181C] mb-2">Version</h3>
                  <p className="text-[#6F737D] text-sm">DFSS v1.0.0 (Beta)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#17181C] mb-2">Architecture</h3>
                  <p className="text-[#6F737D] text-sm max-w-2xl leading-relaxed">
                    Distributed File Storage System utilizes block-level deduplication, chunking, and distributed storage nodes (simulated) to provide efficient, redundant, and secure storage for your files. All files are compressed and encrypted before being sliced into chunks.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default Settings;
