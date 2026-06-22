import axios from 'axios';
import type { Project, ContactForm, ContactMessage, VisitorStats, Profile } from '../types';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const projectsApi = {
  list: () => api.get<Project[]>('/projects').then(r => r.data),
  create: (data: Omit<Project, 'id' | 'created_at'>) => api.post<Project>('/projects', data).then(r => r.data),
  update: (id: number, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/projects/${id}`),
};

export const contactApi = {
  send: (data: ContactForm) => api.post('/contact', data),
  listMessages: () => api.get<ContactMessage[]>('/contact/messages').then(r => r.data),
  markRead: (id: number) => api.patch(`/contact/messages/${id}/read`),
  deleteMessage: (id: number) => api.delete(`/contact/messages/${id}`),
};

export const statsApi = {
  get: () => api.get<VisitorStats>('/stats').then(r => r.data),
  visit: () => api.post('/stats/visit').catch(() => {}),
};

export const authApi = {
  login: (password: string) => api.post<{ access_token: string }>('/auth/login', { password }).then(r => r.data),
};

export const profileApi = {
  get: () => api.get<Profile>('/profile').then(r => r.data),
  update: (data: Profile) => api.put<Profile>('/profile', data).then(r => r.data),
};

export const uploadsApi = {
  uploadImage: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ url: string }>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }).then(r => r.data.url);
  },
};
