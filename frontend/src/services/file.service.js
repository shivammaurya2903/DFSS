import api from './api';

export const getFiles = async () => {
  const response = await api.get('/files');
  return response.data;
};

export const getFolders = async () => {
  const response = await api.get('/folders');
  return response.data;
};

export const uploadFile = async (fileData) => {
  const response = await api.post('/files', fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteFile = async (id) => {
  const response = await api.delete(`/files/${id}`);
  return response.data;
};
