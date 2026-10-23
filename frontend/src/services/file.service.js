import api from './api';

/**
 * File service — centralized file API calls.
 * All requests go through the api client (which attaches JWT automatically).
 */

export const getFiles = async (options = {}) => {
  const { signal, ...params } = options;
  const response = await api.get('/files', { params, signal });
  return response.data?.data || [];
};

export const getFilesPage = async (options = {}) => {
  const { signal, ...params } = options;
  const response = await api.get('/files', { params, signal });
  return {
    data: response.data?.data || [],
    pagination: response.data?.pagination || null,
  };
};

export const getFileDetails = async (fileId) => {
  const response = await api.get(`/files/${fileId}`);
  return response.data?.data || null;
};

export const getUploadLimits = async () => {
  const response = await api.get('/files/limits');
  return response.data?.data || null;
};

export const uploadFile = async (formData, onUploadProgress) => {
  const response = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 5 * 60 * 1000, // 5 min for large files
    onUploadProgress,
  });
  return response.data;
};

export const downloadFile = async (fileId, filename) => {
  const response = await api.get(`/files/${fileId}/download`, {
    responseType: 'blob',
    timeout: 5 * 60 * 1000,
  });

  // Trigger browser download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename || 'download');
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return { success: true };
};

export const getFileBlob = async (fileId) => {
  const response = await api.get(`/files/${fileId}/view`, {
    responseType: 'blob',
    timeout: 5 * 60 * 1000,
  });
  
  return response.data;
};

export const deleteFile = async (fileId) => {
  const response = await api.delete(`/files/${fileId}`);
  return response.data;
};

export const getFavorites = async (options = {}) => {
  const response = await api.get('/files/favorites', options);
  return response.data?.data || [];
};

export const toggleFavorite = async (fileId) => {
  const response = await api.post(`/files/${fileId}/favorite`);
  return response.data?.data;
};

export const getRecentFiles = async (options = {}) => {
  const { signal } = options;
  const response = await api.get('/files/recent', { signal });
  return response.data?.data || [];
};

export const getSharedFiles = async (options = {}) => {
  const response = await api.get('/files/shared', options);
  return response.data?.data || [];
};

export const getExpiredFiles = async (options = {}) => {
  const response = await api.get('/files/expired', options);
  return response.data?.data || [];
};

export const shareFile = async (fileId, expiresIn) => {
  const response = await api.post(`/files/${fileId}/share`, { expiresIn });
  return response.data;
};

export const getFileShares = async (fileId) => {
  const response = await api.get(`/files/${fileId}/shares`);
  return response.data?.data || [];
};

export const revokeShare = async (fileId, shareId) => {
  const response = await api.delete(`/files/${fileId}/share/${shareId}`);
  return response.data;
};
