import api from './api';

/**
 * File service — centralized file API calls.
 * All requests go through the api client (which attaches JWT automatically).
 */

export const getFiles = async (options = {}) => {
  const response = await api.get('/files', options);
  return response.data?.data || [];
};

export const getFileDetails = async (fileId) => {
  const response = await api.get(`/files/${fileId}`);
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

export const getRecentFiles = async () => {
  const response = await api.get('/files/recent');
  return response.data?.data || [];
};

export const getSharedFiles = async () => {
  const response = await api.get('/files/shared');
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

export const revokeShare = async (fileId, token) => {
  const response = await api.delete(`/files/${fileId}/share/${token}`);
  return response.data;
};
