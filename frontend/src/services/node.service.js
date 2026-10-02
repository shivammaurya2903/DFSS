import api from './api';

export const getNodes = async () => {
  const response = await api.get('/storage/nodes');
  return response.data?.data || [];
};

export const getNodeDetails = async (id) => {
  const response = await api.get(`/storage/nodes/${id}`);
  return response.data?.data || null;
};
