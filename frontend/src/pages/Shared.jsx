import React from 'react';
import PageContainer from '../components/layout/PageContainer';
import { Users } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';

const Shared = () => {
  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-purple-600 w-6 h-6" /> Shared With Me
        </h1>
      </div>
      <EmptyState 
        icon={Users} 
        title="No shared files" 
        description="Files shared with you by other users in the distributed network will appear here." 
      />
    </PageContainer>
  );
};

export default Shared;

