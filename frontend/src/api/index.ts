import axios from 'axios';
import type { Project, ContactForm, ContactMessage, VisitorStats, Profile, BlogPost, Organization, Certification, VelogPost, Award, AdminUser, AuthConfig, ExportFormat, ExportDoc } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'X-Requested-From': 'imjemin-frontend' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export const projectsApi = {
  list: () => api.get<Project[]>('/projects').then(r => r.data),
  get: (id: number) => api.get<Project>(`/projects/${id}`).then(r => r.data),
  create: (data: Omit<Project, 'id' | 'created_at'>) => api.post<Project>('/projects', data).then(r => r.data),
  update: (id: number, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  reorder: (ids: number[]) => api.put('/projects/order', { ids }),
};

export const awardsApi = {
  list: () => api.get<Award[]>('/awards').then(r => r.data),
  create: (data: Omit<Award, 'id'>) => api.post<Award>('/awards', data).then(r => r.data),
  update: (id: number, data: Omit<Award, 'id'>) => api.put<Award>(`/awards/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/awards/${id}`),
};

/** Content-Disposition의 filename*=UTF-8''... 를 우선 사용 */
function filenameFrom(disposition: string | undefined, fallback: string) {
  if (!disposition) return fallback;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (star) {
    try { return decodeURIComponent(star[1]); } catch { /* fallthrough */ }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : fallback;
}

export const exportApi = {
  /** nginx가 X-Requested-From 없는 /api 요청을 막으므로 <a href> 대신 axios로 받아 저장한다 */
  download: async (format: ExportFormat, doc: ExportDoc = 'portfolio', scope: 'featured' | 'all' = 'featured') => {
    const res = await api.get<Blob>('/export/portfolio', { params: { format, scope, doc }, responseType: 'blob' });
    const name = filenameFrom(res.headers['content-disposition'] as string | undefined, `${doc}.${format}`);
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

export const contactApi = {
  sendOtp: (email: string) => api.post('/contact/otp/send', { email }),
  verifyOtp: (email: string, otp: string) => api.post<{ verified_token: string }>('/contact/otp/verify', { email, otp }).then(r => r.data),
  send: (data: ContactForm & { verified_token: string }) => api.post('/contact', data),
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

type LoginResponse = AdminUser & { access_token: string };

export const authApi = {
  config: () => api.get<AuthConfig>('/auth/config').then(r => r.data),
  google: (credential: string) => api.post<LoginResponse>('/auth/google', { credential }).then(r => r.data),
  login: (password: string) => api.post<LoginResponse>('/auth/login', { password }).then(r => r.data),
  me: () => api.get<AdminUser>('/auth/me').then(r => r.data),
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

export const velogApi = {
  list: () => api.get<VelogPost[]>('/velog').then(r => r.data),
  listAll: () => api.get<VelogPost[]>('/velog/all').then(r => r.data),
  sync: () => api.post<{ synced: number; new: number }>('/velog/sync').then(r => r.data),
  toggle: (id: number) => api.patch<VelogPost>(`/velog/${id}/toggle`).then(r => r.data),
};

/** 업로드 실패 시 서버가 준 이유(detail)를 그대로 보여 준다 */
export function uploadErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (err.response?.status === 413) return '파일이 너무 큽니다 (25MB 이하).';
    if (err.response?.status === 401) return '로그인이 만료되었습니다. 다시 로그인해주세요.';
  }
  return '업로드에 실패했습니다.';
}

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
