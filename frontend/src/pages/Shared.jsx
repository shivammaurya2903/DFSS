import React from 'react';
import PageContainer from '../components/layout/PageContainer';

const Shared = () => {
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shared With Me</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
        <p className="text-gray-500">Shared files will appear here.</p>
      </div>
    </PageContainer>
  );
};

export default Shared;
