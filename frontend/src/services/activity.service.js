import api from './api';

export const getActivityPage = async (options = {}) => {
  const { signal, ...params } = options;
  const response = await api.get('/activity', { params, signal });
  return {
    data: response.data?.data || [],
    pagination: response.data?.pagination || null,
  };
};

export const getActivity = async (options = {}) => {
  const { data } = await getActivityPage(options);
  return data;
};

export const getAdminActivity = async (params = {}) => {
  const response = await api.get('/activity/admin', { params });
  return response.data;
};
