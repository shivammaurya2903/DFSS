import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="text-purple-600" /> Settings
        </h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
        Settings panel is under construction.
      </div>
    </PageContainer>
  );
};

export default Settings;
