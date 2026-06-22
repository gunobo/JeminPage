import { useEffect, useState } from 'react';
import { projectsApi, authApi, statsApi, contactApi, profileApi } from '../api';
import ImageUpload from '../components/ui/ImageUpload';
import type { Project, ContactMessage, VisitorStats, Profile, SkillGroup } from '../types';

// ─── Auth ────────────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { access_token } = await authApi.login(password);
      localStorage.setItem('token', access_token);
      onLogin();
    } catch {
      setError('비밀번호가 틀렸습니다.');
    }
  };

  return (
    <main className="pt-16 min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-lg p-10 w-full max-w-sm shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-[#1a1a2e] mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]"
            placeholder="비밀번호"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 bg-[#1a1a2e] text-white font-medium rounded hover:bg-[#0f3460] transition-colors">
            로그인
          </button>
        </form>
      </div>
    </main>
  );
}

// ─── Project form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '', description: '', tech_stack: [] as string[],
  github_url: '', demo_url: '', thumbnail_url: '', is_featured: false,
};

function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [techInput, setTechInput] = useState('');

  const refresh = () => projectsApi.list().then(setProjects);
  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await projectsApi.update(editingId, form);
    } else {
      await projectsApi.create(form);
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    refresh();
  };

  const handleEdit = (p: Project) => {
    setEditingId(p.id);
    setForm({
      title: p.title, description: p.description, tech_stack: p.tech_stack,
      github_url: p.github_url || '', demo_url: p.demo_url || '',
      thumbnail_url: p.thumbnail_url || '', is_featured: p.is_featured,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await projectsApi.delete(id);
    refresh();
  };

  const addTech = () => {
    const t = techInput.trim();
    if (t && !form.tech_stack.includes(t)) {
      setForm({ ...form, tech_stack: [...form.tech_stack, t] });
    }
    setTechInput('');
  };

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h2 className="font-serif text-xl font-bold text-[#1a1a2e] mb-6">
          {editingId ? '프로젝트 수정' : '프로젝트 추가'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="프로젝트 이름"
            className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]"
          />
          <textarea
            required rows={3} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="설명"
            className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e] resize-none"
          />

          {/* Tech stack */}
          <div className="flex gap-2">
            <input
              value={techInput}
              onChange={e => setTechInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())}
              placeholder="기술 스택 추가 (Enter)"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]"
            />
            <button type="button" onClick={addTech} className="px-4 py-2.5 border border-gray-300 rounded hover:bg-gray-50">+</button>
          </div>
          {form.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tech_stack.map((t, i) => (
                <span key={i} className="text-xs px-2.5 py-1 bg-gray-100 rounded-full flex items-center gap-1">
                  {t}
                  <button type="button"
                    onClick={() => setForm({ ...form, tech_stack: form.tech_stack.filter((_, j) => j !== i) })}
                    className="text-gray-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          )}

          {/* Thumbnail upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">썸네일 이미지</label>
            <ImageUpload
              value={form.thumbnail_url}
              onChange={url => setForm({ ...form, thumbnail_url: url })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              value={form.github_url}
              onChange={e => setForm({ ...form, github_url: e.target.value })}
              placeholder="GitHub URL"
              className="px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]"
            />
            <input
              value={form.demo_url}
              onChange={e => setForm({ ...form, demo_url: e.target.value })}
              placeholder="Demo URL"
              className="px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox" checked={form.is_featured}
              onChange={e => setForm({ ...form, is_featured: e.target.checked })}
            />
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

      {/* Projects list */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-12"></th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">이름</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">기술</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Featured</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {p.thumbnail_url
                    ? <img src={p.thumbnail_url} alt="" className="w-10 h-10 object-cover rounded" />
                    : <div className="w-10 h-10 bg-gray-100 rounded" />
                  }
                </td>
                <td className="px-4 py-3 font-medium text-[#1a1a2e]">{p.title}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell max-w-xs truncate">
                  {p.tech_stack.join(', ')}
                </td>
                <td className="px-4 py-3 text-center text-[#e94560]">
                  {p.is_featured ? '✓' : ''}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:underline mr-3">수정</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">삭제</button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">프로젝트 없음</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Messages tab ─────────────────────────────────────────────────────────────

function MessagesTab() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  const refresh = () => contactApi.listMessages().then(setMessages);
  useEffect(() => { refresh(); }, []);

  const handleRead = async (id: number) => {
    await contactApi.markRead(id);
    refresh();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await contactApi.deleteMessage(id);
    refresh();
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
        <h2 className="font-semibold text-[#1a1a2e]">문의 메시지</h2>
        {unreadCount > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 bg-[#e94560] text-white rounded-full">{unreadCount}</span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">문의 메시지가 없습니다.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {messages.map(msg => (
            <li key={msg.id} className={`${!msg.is_read ? 'bg-blue-50/40' : ''}`}>
              <div
                className="px-6 py-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setExpanded(expanded === msg.id ? null : msg.id);
                  if (!msg.is_read) handleRead(msg.id);
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {!msg.is_read && <span className="w-2 h-2 rounded-full bg-[#e94560] flex-shrink-0" />}
                    <span className="font-medium text-[#1a1a2e]">{msg.name}</span>
                    <span className="text-gray-400 text-sm">{msg.email}</span>
                  </div>
                  <p className={`text-sm text-gray-600 ${expanded === msg.id ? '' : 'truncate'}`}>
                    {msg.message}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs text-gray-400">
                    {new Date(msg.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(msg.id); }}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    삭제
                  </button>
                </div>
              </div>
              {expanded === msg.id && (
                <div className="px-6 pb-4">
                  <div className="bg-gray-50 rounded p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {msg.message}
                  </div>
                  <a href={`mailto:${msg.email}`}
                    className="inline-block mt-2 text-xs text-blue-600 hover:underline">
                    {msg.email}로 답장하기 →
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

const EMPTY_PROFILE: Profile = {
  name: '', tagline: '', bio: '', github_url: '', email: '',
  portfolio_url: '', avatar_url: '', skill_groups: [],
};

function ProfileTab() {
  const [form, setForm] = useState<Profile>(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);
  const [skillInput, setSkillInput] = useState<Record<number, string>>({});

  useEffect(() => {
    profileApi.get().then(setForm).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await profileApi.update(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addSkillGroup = () => {
    setForm({ ...form, skill_groups: [...form.skill_groups, { category: '', skills: [] }] });
  };

  const updateGroup = (i: number, patch: Partial<SkillGroup>) => {
    const groups = form.skill_groups.map((g, idx) => idx === i ? { ...g, ...patch } : g);
    setForm({ ...form, skill_groups: groups });
  };

  const removeGroup = (i: number) => {
    setForm({ ...form, skill_groups: form.skill_groups.filter((_, idx) => idx !== i) });
  };

  const addSkill = (groupIdx: number) => {
    const val = (skillInput[groupIdx] || '').trim();
    if (!val) return;
    const group = form.skill_groups[groupIdx];
    if (!group.skills.includes(val)) {
      updateGroup(groupIdx, { skills: [...group.skills, val] });
    }
    setSkillInput({ ...skillInput, [groupIdx]: '' });
  };

  const removeSkill = (groupIdx: number, skillIdx: number) => {
    updateGroup(groupIdx, {
      skills: form.skill_groups[groupIdx].skills.filter((_, i) => i !== skillIdx),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h2 className="font-serif text-xl font-bold text-[#1a1a2e] mb-6">기본 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">이름</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="홍길동"
              className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">이메일</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="hello@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">한 줄 소개 (Tagline)</label>
            <input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })}
              placeholder="백엔드 개발자 · Python 좋아함"
              className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">소개글 (Bio)</label>
            <textarea rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="자신을 소개하는 글을 작성해주세요..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e] resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">GitHub URL</label>
            <input value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })}
              placeholder="https://github.com/username"
              className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">포트폴리오 URL</label>
            <input value={form.portfolio_url} onChange={e => setForm({ ...form, portfolio_url: e.target.value })}
              placeholder="https://portfolio.example.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e]" />
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h2 className="font-serif text-xl font-bold text-[#1a1a2e] mb-6">프로필 사진</h2>
        <div className="max-w-xs">
          <ImageUpload value={form.avatar_url} onChange={url => setForm({ ...form, avatar_url: url })} />
        </div>
      </div>

      {/* Skill groups */}
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-bold text-[#1a1a2e]">기술 스택</h2>
          <button type="button" onClick={addSkillGroup}
            className="text-sm px-4 py-2 border border-[#1a1a2e] rounded hover:bg-gray-50">
            + 카테고리 추가
          </button>
        </div>
        {form.skill_groups.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">카테고리를 추가해주세요.</p>
        )}
        <div className="space-y-4">
          {form.skill_groups.map((group, gi) => (
            <div key={gi} className="border border-gray-200 rounded-lg p-4">
              <div className="flex gap-2 mb-3">
                <input
                  value={group.category}
                  onChange={e => updateGroup(gi, { category: e.target.value })}
                  placeholder="카테고리명 (예: Backend)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#1a1a2e]"
                />
                <button type="button" onClick={() => removeGroup(gi)}
                  className="px-3 py-2 text-red-400 hover:text-red-600 text-sm">삭제</button>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {group.skills.map((s, si) => (
                  <span key={si} className="text-xs px-2.5 py-1 bg-gray-100 rounded-full flex items-center gap-1">
                    {s}
                    <button type="button" onClick={() => removeSkill(gi, si)}
                      className="text-gray-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={skillInput[gi] || ''}
                  onChange={e => setSkillInput({ ...skillInput, [gi]: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(gi))}
                  placeholder="기술 추가 (Enter)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#1a1a2e]"
                />
                <button type="button" onClick={() => addSkill(gi)}
                  className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="submit"
        className="w-full py-3 bg-[#1a1a2e] text-white font-medium rounded hover:bg-[#0f3460] transition-colors">
        {saved ? '✓ 저장됨' : '저장하기'}
      </button>
    </form>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type Tab = 'projects' | 'messages' | 'profile';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [tab, setTab] = useState<Tab>('profile');
  const [stats, setStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    if (isLoggedIn) statsApi.get().then(setStats).catch(() => {});
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <LoginForm onLogin={() => setIsLoggedIn(true)} />;

  return (
    <main className="pt-16">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#1a1a2e]">Admin Dashboard</h1>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-[#e94560] transition-colors">
            로그아웃
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-8">
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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {([['profile', '내 정보'], ['projects', '프로젝트 관리'], ['messages', '문의 메시지']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-[#1a1a2e] text-[#1a1a2e]'
                  : 'border-transparent text-gray-500 hover:text-[#1a1a2e]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'profile' && <ProfileTab />}
        {tab === 'projects' && <ProjectsTab />}
        {tab === 'messages' && <MessagesTab />}
      </div>
    </main>
  );
}
