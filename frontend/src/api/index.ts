import axios from 'axios';
import type { Project, ContactForm, ContactMessage, VisitorStats, Profile, BlogPost, Organization, Certification } from '../types';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const projectsApi = {
  list: () => api.get<Project[]>('/projects').then(r => r.data),
  get: (id: number) => api.get<Project>(`/projects/${id}`).then(r => r.data),
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
  reset: () => api.delete('/stats'),
  daily: (days = 30) => api.get<{ date: string; count: number }[]>(`/stats/daily?days=${days}`).then(r => r.data),
};

export const authApi = {
  login: (password: string) => api.post<{ access_token: string }>('/auth/login', { password }).then(r => r.data),
};

export const profileApi = {
  get: () => api.get<Profile>('/profile').then(r => r.data),
  update: (data: Profile) => api.put<Profile>('/profile', data).then(r => r.data),
};

export const blogApi = {
  list: () => api.get<BlogPost[]>('/blog').then(r => r.data),
  listAll: () => api.get<BlogPost[]>('/blog/all').then(r => r.data),
  get: (slug: string) => api.get<BlogPost>(`/blog/${slug}`).then(r => r.data),
  create: (data: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>) => api.post<BlogPost>('/blog', data).then(r => r.data),
  update: (id: number, data: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>) => api.put<BlogPost>(`/blog/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/blog/${id}`),
};

export const certificationsApi = {
  list: () => api.get<Certification[]>('/certifications').then(r => r.data),
  create: (data: Omit<Certification, 'id'>) => api.post<Certification>('/certifications', data).then(r => r.data),
  update: (id: number, data: Omit<Certification, 'id'>) => api.put<Certification>(`/certifications/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/certifications/${id}`),
};

export const organizationsApi = {
  list: () => api.get<Organization[]>('/organizations').then(r => r.data),
  create: (data: Omit<Organization, 'id'>) => api.post<Organization>('/organizations', data).then(r => r.data),
  update: (id: number, data: Omit<Organization, 'id'>) => api.put<Organization>(`/organizations/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/organizations/${id}`),
};

export const uploadsApi = {
  upload: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ url: string }>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    }).then(r => r.data.url);
  },
  uploadImage: (file: File, onProgress?: (pct: number) => void) =>
    uploadsApi.upload(file, onProgress),
};
