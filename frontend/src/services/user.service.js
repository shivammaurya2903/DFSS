import api from './api';

export const getUsers = async (params = {}) => {
  const response = await api.get('/users', { params });
  return response.data;
};
