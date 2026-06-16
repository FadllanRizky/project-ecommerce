import api from './axiosInstance';

export const uploadApi = {
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateAvatarUrl: async (avatarUrl) => {
    const response = await api.put('/upload/avatar-url', { avatar_url: avatarUrl });
    return response.data;
  }
};
