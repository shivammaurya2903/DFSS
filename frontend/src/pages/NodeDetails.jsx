import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { HardDrive } from 'lucide-react';
import axios from 'axios';

const NodeDetails = () => {
  const { nodeId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    import('../services/node.service').then(nodeService => {
      nodeService.getNodeDetails(nodeId)
        .then(res => setData(res))
        .catch(err => console.error(err));
    });
  }, [nodeId]);

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <HardDrive className="text-purple-600" /> Storage Node Details: {nodeId}
        </h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-left text-gray-500">
        {data ? (
          <div>
            <p><strong>Status:</strong> {data.status}</p>
            <p><strong>Capacity:</strong> {data.capacity}</p>
            <p><strong>Used:</strong> {data.used}</p>
          </div>
        ) : 'Loading node details...'}
      </div>
    </PageContainer>
  );
};

export default NodeDetails;

