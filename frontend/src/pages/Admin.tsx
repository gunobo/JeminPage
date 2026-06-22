import { useEffect, useState } from 'react';
import { projectsApi, authApi, statsApi } from '../api';
import type { Project, VisitorStats } from '../types';

const EMPTY_FORM = {
  title: '', description: '', tech_stack: [] as string[], github_url: '',
  demo_url: '', thumbnail_url: '', is_featured: false,
};

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [techInput, setTechInput] = useState('');

  const isLoggedIn = !!token;

  useEffect(() => {
    if (isLoggedIn) {
      projectsApi.list().then(setProjects);
      statsApi.get().then(setStats).catch(() => {});
    }
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { access_token } = await authApi.login(password);
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setLoginError('');
    } catch {
      setLoginError('비밀번호가 틀렸습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await projectsApi.update(editingId, form);
    } else {
      await projectsApi.create(form);
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    projectsApi.list().then(setProjects);
  };

  const handleEdit = (p: Project) => {
    setEditingId(p.id);
    setForm({ title: p.title, description: p.description, tech_stack: p.tech_stack,
      github_url: p.github_url || '', demo_url: p.demo_url || '',
      thumbnail_url: p.thumbnail_url || '', is_featured: p.is_featured });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await projectsApi.delete(id);
    setProjects(projects.filter(p => p.id !== id));
  };

  const addTech = () => {
    if (techInput.trim()) {
      setForm({ ...form, tech_stack: [...form.tech_stack, techInput.trim()] });
      setTechInput('');
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="pt-16 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border border-gray-200 rounded-lg p-10 w-full max-w-sm">
          <h1 className="font-serif text-2xl font-bold text-[#1a1a2e] mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]"
              placeholder="비밀번호"
            />
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-[#1a1a2e] text-white font-medium rounded hover:bg-[#0f3460] transition-colors">
              로그인
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-16">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-serif text-3xl font-bold text-[#1a1a2e]">Admin Dashboard</h1>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-[#e94560] transition-colors">
            로그아웃
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-[#1a1a2e]">{stats.today}</p>
              <p className="text-sm text-gray-500 mt-1">오늘 방문자</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold text-[#1a1a2e]">{stats.total}</p>
              <p className="text-sm text-gray-500 mt-1">누적 방문자</p>
            </div>
          </div>
        )}

        {/* Project Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-10">
          <h2 className="font-serif text-xl font-bold text-[#1a1a2e] mb-6">
            {editingId ? '프로젝트 수정' : '프로젝트 추가'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="프로젝트 이름" className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]" />
            <textarea required rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="설명" className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e] resize-none" />
            <div className="flex gap-2">
              <input value={techInput} onChange={e => setTechInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())}
                placeholder="기술 스택 추가 (Enter)" className="flex-1 px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]" />
              <button type="button" onClick={addTech} className="px-4 py-2.5 border border-gray-300 rounded hover:bg-gray-50">+</button>
            </div>
            {form.tech_stack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tech_stack.map((t, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-gray-100 rounded-full flex items-center gap-1">
                    {t}
                    <button type="button" onClick={() => setForm({ ...form, tech_stack: form.tech_stack.filter((_, j) => j !== i) })}
                      className="text-gray-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })}
                placeholder="GitHub URL" className="px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]" />
              <input value={form.demo_url} onChange={e => setForm({ ...form, demo_url: e.target.value })}
                placeholder="Demo URL" className="px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]" />
              <input value={form.thumbnail_url} onChange={e => setForm({ ...form, thumbnail_url: e.target.value })}
                placeholder="썸네일 URL" className="px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
              메인 페이지에 표시 (Featured)
            </label>
            <div className="flex gap-3">
              <button type="submit" className="px-6 py-2.5 bg-[#1a1a2e] text-white font-medium rounded hover:bg-[#0f3460] transition-colors">
                {editingId ? '수정' : '추가'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded hover:bg-gray-50">
                  취소
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Projects List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-600">이름</th>
                <th className="px-6 py-3 text-left font-medium text-gray-600">기술</th>
                <th className="px-6 py-3 text-left font-medium text-gray-600">Featured</th>
                <th className="px-6 py-3 text-right font-medium text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-[#1a1a2e]">{p.title}</td>
                  <td className="px-6 py-4 text-gray-500">{p.tech_stack.join(', ')}</td>
                  <td className="px-6 py-4">{p.is_featured ? '✓' : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline mr-4">수정</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">삭제</button>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">프로젝트 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
