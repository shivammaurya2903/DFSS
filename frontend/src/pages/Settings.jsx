import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Settings as SettingsIcon, Shield, Bell, HardDrive, Layout, ChevronRight } from 'lucide-react';

const Settings = () => {
  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account, security, and storage preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-1">
          <button className="w-full flex items-center justify-between p-3 rounded-lg bg-[#f4f2ff] text-[#8178F2] font-medium text-sm">
            <div className="flex items-center gap-3"><Shield className="w-4 h-4"/> Security</div>
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm">
            <div className="flex items-center gap-3"><HardDrive className="w-4 h-4"/> Storage</div>
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm">
            <div className="flex items-center gap-3"><Bell className="w-4 h-4"/> Notifications</div>
          </button>
          <button className="w-full flex items-center justify-between p-3 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm">
            <div className="flex items-center gap-3"><Layout className="w-4 h-4"/> Appearance</div>
          </button>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Security Preferences</h2>
              <p className="text-gray-500 text-sm mt-1">Update your password and secure your account.</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-gray-50">
                <div>
                  <h3 className="font-medium text-gray-800">Change Password</h3>
                  <p className="text-sm text-gray-500">Ensure your account is using a long, random password to stay secure.</p>
                </div>
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Update
                </button>
              </div>

              <div className="flex items-center justify-between pb-6 border-b border-gray-50">
                <div>
                  <h3 className="font-medium text-gray-800">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account. (Coming soon)</p>
                </div>
                <button disabled className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed">
                  Enable
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Active Sessions</h3>
                  <p className="text-sm text-gray-500">Manage devices that are currently logged into your account.</p>
                </div>
                <button className="flex items-center gap-1 text-sm font-medium text-[#8178F2] hover:text-purple-700">
                  View sessions <ChevronRight className="w-4 h-4"/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Settings;
