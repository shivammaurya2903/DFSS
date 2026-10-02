import api from './api';

export const getActivity = async (params = {}) => {
  const response = await api.get('/activity', { params });
  return response.data;
};

export const getAdminActivity = async (params = {}) => {
  const response = await api.get('/activity/admin', { params });
  return response.data;
};
