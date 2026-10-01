import React from 'react';
import PageContainer from '../components/layout/PageContainer';

const Activity = () => {
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Activity Log</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <p className="text-gray-500">System activity and logs will appear here.</p>
      </div>
    </PageContainer>
  );
};

export default Activity;
