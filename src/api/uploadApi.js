import api from './axiosInstance';

export const uploadApi = {
  uploadAvatar: async (file) => {
    if (!file) throw new Error('File tidak valid.');
    if (file.size && file.size > 5 * 1024 * 1024) {
      throw new Error('Ukuran foto maksimal 5MB, bos!');
    }
    const formData = new FormData();
    formData.append('avatar', file);
    // NOTE: jangan set Content-Type manual agar axios menyisipkan boundary otomatis.
    // Token Authorization otomatis dari axiosInstance interceptor.
    const response = await api.post('/upload/avatar', formData);
    return response.data;
  },

  updateAvatarUrl: async (avatarUrl) => {
    const response = await api.put('/upload/avatar-url', { avatar_url: avatarUrl });
    return response.data;
  }
};
