import api from './api';

export const getNodes = async () => {
  const response = await api.get('/nodes');
  return response.data;
};

export const getNodeDetails = async (id) => {
  const response = await api.get(`/nodes/${id}`);
  return response.data;
};
