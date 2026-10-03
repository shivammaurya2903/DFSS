import api from './api';

export const getActivity = async (options = {}) => {
  const { signal, ...params } = options;
  const response = await api.get('/activity', { params, signal });
  return response.data?.data || [];
};

export const getAdminActivity = async (params = {}) => {
  const response = await api.get('/activity/admin', { params });
  return response.data;
};
