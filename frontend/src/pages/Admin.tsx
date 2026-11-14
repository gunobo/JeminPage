import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { projectsApi, authApi, statsApi, contactApi, profileApi, blogApi, organizationsApi, certificationsApi, velogApi, awardsApi } from '../api';
import ImageUpload from '../components/ui/ImageUpload';
import FileUpload from '../components/ui/FileUpload';
import GoogleLoginButton from '../components/ui/GoogleLoginButton';
import DownloadMenu from '../components/ui/DownloadMenu';
import type { Project, ContactMessage, VisitorStats, Profile, SkillGroup, BlogPost, Organization, Certification, VelogPost, Award, AdminUser, AuthConfig } from '../types';
import { normalizeSkill } from '../types';

const inputCls = 'w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 focus:outline-none focus:border-white/30 transition-colors text-sm';
const btnPrimary = 'px-6 py-3 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-white/80 transition-colors';
const btnSecondary = 'px-6 py-3 border border-white/10 text-white/50 text-xs font-semibold uppercase tracking-widest hover:border-white/30 hover:text-white transition-colors';

function apiError(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (err.response?.status === 429) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  }
  return fallback;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

const BUILD_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    authApi.config().then(setConfig).catch(() => setConfig({ google_client_id: '', password_login: false }));
  }, []);

  const finish = (token: string) => {
    localStorage.setItem('token', token);
    onLogin();
  };

  const handleGoogle = async (credential: string) => {
    setError(''); setBusy(true);
    try {
      finish((await authApi.google(credential)).access_token);
    } catch (err) {
      setError(apiError(err, '로그인에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      finish((await authApi.login(password)).access_token);
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.status === 401 ? '비밀번호가 틀렸습니다.' : apiError(err, '로그인에 실패했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const clientId = BUILD_CLIENT_ID || config?.google_client_id || '';

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-4">관리자</p>
        <h1 className="font-black text-4xl tracking-tighter mb-10">로그인</h1>

        {!config ? (
          <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
        ) : (
          <div className="space-y-6">
            {clientId
              ? <GoogleLoginButton clientId={clientId} onCredential={handleGoogle} />
              : <p className="text-white/30 text-xs">Google 로그인이 설정되지 않았습니다 (GOOGLE_CLIENT_ID).</p>}
            {busy && <p className="text-white/30 text-xs text-center animate-pulse">확인 중...</p>}
            {error && <p className="text-red-400 text-xs text-center" role="alert">{error}</p>}

            {config.password_login && (
              <details className="border-t border-white/10 pt-6">
                <summary className="cursor-pointer text-[11px] font-semibold tracking-widest text-white/30 uppercase hover:text-white/60 list-none">
                  비상 로그인 ▾
                </summary>
                <form onSubmit={handlePassword} className="mt-4">
                  <input
                    type="password" required value={password} autoComplete="current-password"
                    onChange={e => setPassword(e.target.value)}
                    className={inputCls}
                    placeholder="비밀번호"
                  />
                  <button type="submit" disabled={busy} className={`${btnSecondary} w-full mt-3 py-3 disabled:opacity-40`}>
                    입장 →
                  </button>
                </form>
              </details>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Project form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '', description: '', tech_stack: [] as string[],
  github_url: '', demo_url: '', thumbnail_url: '', is_featured: false, category: '',
  period: '', team: '', role: '', problem: '', troubleshooting: '', results: '',
};

const TROUBLE_PLACEHOLDER = `## 라즈베리파이 메모리 부족으로 컨테이너 재시작
원인: MariaDB 기본 buffer pool이 너무 큼
해결: innodb_buffer_pool_size 128M로 제한, swap 2GB 추가
결과: OOM 재시작 0회 (2주 기준)

## 다음 항목 제목
...`;

function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [techInput, setTechInput] = useState('');
  const [error, setError] = useState('');

  const refresh = () => projectsApi.list().then(setProjects);
  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // 성과: 줄마다 1개, 빈 줄 제거
    const payload = { ...form, results: form.results.split('\n').map(s => s.trim()).filter(Boolean) };
    try {
      if (editingId) await projectsApi.update(editingId, payload);
      else await projectsApi.create(payload);
      setForm(EMPTY_FORM); setEditingId(null); refresh();
    } catch (err) {
      setError(apiError(err, '저장에 실패했습니다.'));
    }
  };

  const handleEdit = (p: Project) => {
    setEditingId(p.id);
    setForm({ title: p.title, description: p.description, tech_stack: p.tech_stack,
      github_url: p.github_url || '', demo_url: p.demo_url || '',
      thumbnail_url: p.thumbnail_url || '', is_featured: p.is_featured, category: p.category || '',
      period: p.period || '', team: p.team || '', role: p.role || '', problem: p.problem || '',
      troubleshooting: p.troubleshooting || '', results: (p.results || []).join('\n') });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= projects.length) return;
    const reordered = [...projects];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setProjects(reordered);
    try {
      await projectsApi.reorder(reordered.map(p => p.id));
    } catch (err) {
      setError(apiError(err, '순서 저장에 실패했습니다.'));
      refresh();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await projectsApi.delete(id); refresh();
  };

  const addTech = () => {
    const t = techInput.trim();
    if (t && !form.tech_stack.includes(t)) setForm({ ...form, tech_stack: [...form.tech_stack, t] });
    setTechInput('');
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="border border-white/10 p-8">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-6">
          {editingId ? '프로젝트 수정' : '새 프로젝트'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="프로젝트 제목" className={inputCls} />
          <textarea required rows={3} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="설명 (줄바꿈 유지)" className={`${inputCls} resize-y`} />

          {/* 케이스 스터디 */}
          <div className="border border-white/5 p-4 space-y-4">
            <p className="text-[11px] font-semibold tracking-widest text-white/20 uppercase">케이스 스터디 (선택)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input value={form.period} maxLength={100}
                onChange={e => setForm({ ...form, period: e.target.value })}
                placeholder="기간 (2026.03 ~ 2026.06)" className={inputCls} />
              <input value={form.team} maxLength={200}
                onChange={e => setForm({ ...form, team: e.target.value })}
                placeholder="팀 (4인 · FE2 BE2)" className={inputCls} />
              <input value={form.role} maxLength={200}
                onChange={e => setForm({ ...form, role: e.target.value })}
                placeholder="역할 (백엔드 리드)" className={inputCls} />
            </div>
            <textarea rows={3} value={form.problem}
              onChange={e => setForm({ ...form, problem: e.target.value })}
              placeholder="문제 — 해결하려던 문제, 만든 이유" className={`${inputCls} resize-y`} />
            <div>
              <textarea rows={8} value={form.troubleshooting}
                onChange={e => setForm({ ...form, troubleshooting: e.target.value })}
                placeholder={TROUBLE_PLACEHOLDER} className={`${inputCls} resize-y font-mono text-xs leading-relaxed`} />
              <p className="text-[11px] text-white/20 mt-1">트러블슈팅 — <code>## 제목</code> 줄로 항목을 나눕니다. 첫 항목이 상세 페이지에서 펼쳐지고 PDF에 들어갑니다.</p>
            </div>
            <textarea rows={3} value={form.results}
              onChange={e => setForm({ ...form, results: e.target.value })}
              placeholder={'성과 — 줄마다 1개\n전교생 300명 사용\n응답 1.2s → 0.3s'} className={`${inputCls} resize-y`} />
          </div>

          <div className="flex gap-2">
            <input value={techInput}
              onChange={e => setTechInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())}
              placeholder="기술 스택 입력 후 Enter" className={`${inputCls} flex-1`} />
            <button type="button" onClick={addTech}
              className="border border-white/10 text-white/40 px-4 hover:border-white/30 hover:text-white transition-colors">+</button>
          </div>
          {form.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tech_stack.map((t, i) => (
                <span key={i} className="text-xs px-3 py-1 border border-white/10 text-white/40 flex items-center gap-2">
                  {t}
                  <button type="button"
                    onClick={() => setForm({ ...form, tech_stack: form.tech_stack.filter((_, j) => j !== i) })}
                    className="text-white/20 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold tracking-widest text-white/20 uppercase mb-3">썸네일</p>
            <ImageUpload value={form.thumbnail_url} onChange={url => setForm({ ...form, thumbnail_url: url })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input value={form.github_url}
              onChange={e => setForm({ ...form, github_url: e.target.value })}
              placeholder="GitHub URL" className={inputCls} />
            <input value={form.demo_url}
              onChange={e => setForm({ ...form, demo_url: e.target.value })}
              placeholder="Demo URL" className={inputCls} />
          </div>

          <input value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            placeholder="카테고리 (예: Web, App, VSCode Extension)" className={inputCls} />

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-5 rounded-full transition-colors relative ${form.is_featured ? 'bg-white' : 'bg-white/10'}`}
              onClick={() => setForm({ ...form, is_featured: !form.is_featured })}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform ${form.is_featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">메인 페이지에 표시</span>
          </label>

          {error && <p className="text-red-400 text-xs" role="alert">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" className={btnPrimary}>{editingId ? '수정 완료' : '추가하기'}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}
                className={btnSecondary}>취소</button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-2 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase w-14">순서</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase w-12"></th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase">제목</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase hidden sm:table-cell">스택</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold tracking-widest text-white/20 uppercase">★</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-widest text-white/20 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {projects.map((p, i) => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-2 py-3">
                  <div className="flex flex-col items-center leading-none">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로"
                      className="text-white/30 hover:text-white disabled:opacity-10 px-2 py-0.5">▲</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === projects.length - 1} aria-label="아래로"
                      className="text-white/30 hover:text-white disabled:opacity-10 px-2 py-0.5">▼</button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {p.thumbnail_url
                    ? <img src={p.thumbnail_url} alt="" className="w-10 h-10 object-cover opacity-60" />
                    : <div className="w-10 h-10 bg-white/5" />}
                </td>
                <td className="px-4 py-3 font-medium text-white/70">{p.title}</td>
                <td className="px-4 py-3 text-white/30 hidden sm:table-cell max-w-xs truncate">{p.tech_stack.join(', ')}</td>
                <td className="px-4 py-3 text-center text-white/40">{p.is_featured ? '✓' : ''}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(p)}
                    className="text-xs text-white/30 hover:text-white transition-colors mr-4 uppercase tracking-widest">Edit</button>
                  <button onClick={() => handleDelete(p.id)}
                    className="text-xs text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-widest">Del</button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-white/20 text-xs uppercase tracking-widest">아직 프로젝트가 없습니다.</td></tr>
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

  const handleRead = async (id: number) => { await contactApi.markRead(id); refresh(); };
  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await contactApi.deleteMessage(id); refresh();
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="border border-white/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">메시지</p>
        {unreadCount > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-black">{unreadCount}</span>
        )}
      </div>
      {messages.length === 0 ? (
        <div className="py-16 text-center text-white/20 text-xs uppercase tracking-widest">메시지가 없습니다.</div>
      ) : (
        <ul className="divide-y divide-white/5">
          {messages.map(msg => (
            <li key={msg.id} className={!msg.is_read ? 'bg-white/[0.02]' : ''}>
              <div className="px-6 py-4 flex items-start gap-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
                onClick={() => { setExpanded(expanded === msg.id ? null : msg.id); if (!msg.is_read) handleRead(msg.id); }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {!msg.is_read && <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />}
                    <span className="font-semibold text-white/70 text-sm">{msg.name}</span>
                    <span className="text-white/30 text-xs">{msg.email}</span>
                  </div>
                  <p className={`text-xs text-white/30 ${expanded === msg.id ? '' : 'truncate'}`}>{msg.message}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-xs text-white/20">{new Date(msg.created_at).toLocaleDateString('ko-KR')}</span>
                  <button onClick={e => { e.stopPropagation(); handleDelete(msg.id); }}
                    className="text-xs text-red-400/40 hover:text-red-400 transition-colors uppercase tracking-widest">Del</button>
                </div>
              </div>
              {expanded === msg.id && (
                <div className="px-6 pb-6">
                  <div className="bg-white/[0.03] border border-white/5 p-4 text-sm text-white/50 whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </div>
                  <a href={`mailto:${msg.email}`}
                    className="inline-block mt-3 text-xs text-white/30 hover:text-white transition-colors uppercase tracking-widest">
                    답장하기: {msg.email} →
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
  portfolio_url: '', avatar_url: '', discord: '', cv_url: '', og_image_url: '', cv_mode: 'generated', skill_groups: [], yearly_goals: [], marquee_items: [], education: [],
};

function ProfileTab() {
  const [form, setForm] = useState<Profile>(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);
  const [skillInput, setSkillInput] = useState<Record<number, string>>({});

  useEffect(() => { profileApi.get().then(setForm).catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await profileApi.update(form);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const addSkillGroup = () => setForm({ ...form, skill_groups: [...form.skill_groups, { category: '', skills: [] }] });
  const updateGroup = (i: number, patch: Partial<SkillGroup>) =>
    setForm({ ...form, skill_groups: form.skill_groups.map((g, idx) => idx === i ? { ...g, ...patch } : g) });
  const removeGroup = (i: number) =>
    setForm({ ...form, skill_groups: form.skill_groups.filter((_, idx) => idx !== i) });
  const addSkill = (gi: number) => {
    const val = (skillInput[gi] || '').trim();
    if (!val) return;
    const g = form.skill_groups[gi];
    const names = g.skills.map(s => normalizeSkill(s).name);
    if (!names.includes(val)) updateGroup(gi, { skills: [...g.skills, { name: val, desc: '' }] });
    setSkillInput({ ...skillInput, [gi]: '' });
  };
  const removeSkill = (gi: number, si: number) =>
    updateGroup(gi, { skills: form.skill_groups[gi].skills.filter((_, i) => i !== si) });
  const updateSkillDesc = (gi: number, si: number, desc: string) => {
    const skills = form.skill_groups[gi].skills.map((s, i) =>
      i === si ? { ...normalizeSkill(s), desc } : s
    );
    updateGroup(gi, { skills });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic */}
      <div className="border border-white/10 p-8">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-6">기본 정보</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Name" className={inputCls} />
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="Email" className={inputCls} />
          <input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })}
            placeholder="Tagline" className={`${inputCls} sm:col-span-2`} />
          <textarea rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
            placeholder="Bio" className={`${inputCls} resize-none sm:col-span-2`} />
          <input value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })}
            placeholder="GitHub URL" className={inputCls} />
          <input value={form.portfolio_url} onChange={e => setForm({ ...form, portfolio_url: e.target.value })}
            placeholder="Portfolio URL" className={inputCls} />
        </div>
      </div>

      {/* Avatar */}
      <div className="border border-white/10 p-8">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-6">프로필 사진</p>
        <div className="max-w-xs">
          <ImageUpload value={form.avatar_url} onChange={url => setForm({ ...form, avatar_url: url })} />
        </div>
      </div>

      {/* CV & OG */}
      <div className="border border-white/10 p-8 space-y-8">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-2">CV / Resume</p>
          <p className="text-xs text-white/20 mb-4">직접 만든 CV PDF를 보관합니다. 홈 화면에는 표시되지 않습니다. 자동 생성 포트폴리오·이력서는 상단의 Portfolio / Resume 메뉴에서 받을 수 있습니다.</p>
          <FileUpload
            value={form.cv_url}
            accept="application/pdf"
            label="PDF 업로드"
            onChange={url => setForm({ ...form, cv_url: url })}
          />
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-2">OG 이미지</p>
          <p className="text-xs text-white/20 mb-4">SNS 공유 미리보기 이미지 — 권장 사이즈 1200×630px</p>
          <ImageUpload value={form.og_image_url} onChange={url => setForm({ ...form, og_image_url: url })} />
        </div>
      </div>

      {/* Skills */}
      <div className="border border-white/10 p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">Skills</p>
          <button type="button" onClick={addSkillGroup} className={btnSecondary}>+ 카테고리</button>
        </div>
        {form.skill_groups.length === 0 && (
          <p className="text-xs text-white/20 text-center py-6 uppercase tracking-widest">카테고리가 없습니다.</p>
        )}
        <div className="space-y-4">
          {form.skill_groups.map((group, gi) => (
            <div key={gi} className="border border-white/10 p-4">
              <div className="flex gap-2 mb-3">
                <input value={group.category}
                  onChange={e => updateGroup(gi, { category: e.target.value })}
                  placeholder="카테고리 (예: 백엔드)" className={`${inputCls} flex-1`} />
                <button type="button" onClick={() => removeGroup(gi)}
                  className="px-3 text-red-400/40 hover:text-red-400 transition-colors text-sm">×</button>
              </div>
              <div className="space-y-2 mb-3">
                {group.skills.map((s, si) => {
                  const item = normalizeSkill(s);
                  return (
                    <div key={si} className="border border-white/10 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-white/60 font-medium flex-1">{item.name}</span>
                        <button type="button" onClick={() => removeSkill(gi, si)}
                          className="text-white/20 hover:text-red-400 text-sm">×</button>
                      </div>
                      <textarea
                        value={item.desc || ''}
                        onChange={e => updateSkillDesc(gi, si, e.target.value)}
                        placeholder="이 기술로 무엇을 할 수 있는지 작성해주세요 (선택)"
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 text-white/60 placeholder-white/15 px-3 py-2 focus:outline-none focus:border-white/20 text-xs resize-none"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input value={skillInput[gi] || ''}
                  onChange={e => setSkillInput({ ...skillInput, [gi]: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(gi))}
                  placeholder="기술 추가 후 Enter" className={`${inputCls} flex-1`} />
                <button type="button" onClick={() => addSkill(gi)}
                  className="border border-white/10 text-white/40 px-4 hover:border-white/30 hover:text-white transition-colors">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education (이력서용) */}
      <div className="border border-white/10 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">학력</p>
            <p className="text-xs text-white/20 mt-1">이력서(Resume) 다운로드에만 들어갑니다. 홈 화면에는 표시되지 않습니다.</p>
          </div>
          <button type="button"
            onClick={() => setForm({ ...form, education: [...(form.education || []), { school: '', major: '', period: '', status: '' }] })}
            className={btnSecondary}>+ 추가</button>
        </div>
        {(!form.education || form.education.length === 0) && (
          <p className="text-xs text-white/20 text-center py-6 uppercase tracking-widest">학력이 없습니다.</p>
        )}
        <div className="space-y-3">
          {(form.education || []).map((e, i) => {
            const set = (patch: Partial<typeof e>) =>
              setForm({ ...form, education: form.education.map((x, idx) => idx === i ? { ...x, ...patch } : x) });
            return (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1.3fr_1fr_auto] gap-2">
                <input required value={e.school} maxLength={200} onChange={ev => set({ school: ev.target.value })}
                  placeholder="학교 (부산소프트웨어마이스터고)" className={inputCls} />
                <input value={e.major} maxLength={200} onChange={ev => set({ major: ev.target.value })}
                  placeholder="학과 (소프트웨어개발과)" className={inputCls} />
                <input value={e.period} maxLength={100} onChange={ev => set({ period: ev.target.value })}
                  placeholder="기간 (2025.03 ~)" className={inputCls} />
                <input value={e.status} maxLength={50} onChange={ev => set({ status: ev.target.value })}
                  placeholder="재학/졸업" className={inputCls} />
                <button type="button" onClick={() => setForm({ ...form, education: form.education.filter((_, idx) => idx !== i) })}
                  className="px-3 text-red-400/40 hover:text-red-400 transition-colors">×</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Marquee */}
      <div className="border border-white/10 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">흘러가는 텍스트</p>
            <p className="text-xs text-white/20 mt-1">홈 화면 가운데 띠에 표시되는 키워드</p>
          </div>
          <button type="button"
            onClick={() => setForm({ ...form, marquee_items: [...(form.marquee_items || []), ''] })}
            className={btnSecondary}>+ 추가</button>
        </div>
        {(!form.marquee_items || form.marquee_items.length === 0) && (
          <p className="text-xs text-white/20 text-center py-6 uppercase tracking-widest">키워드가 없습니다.</p>
        )}
        <div className="space-y-2">
          {(form.marquee_items || []).map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={item}
                onChange={e => setForm({ ...form, marquee_items: form.marquee_items.map((v, idx) => idx === i ? e.target.value : v) })}
                placeholder="키워드 (예: 풀스택 개발자)"
                className={`${inputCls} flex-1`}
              />
              <button type="button"
                onClick={() => setForm({ ...form, marquee_items: form.marquee_items.filter((_, idx) => idx !== i) })}
                className="px-3 text-red-400/40 hover:text-red-400 transition-colors">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Goals */}
      <div className="border border-white/10 p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">Goals</p>
          <button type="button"
            onClick={() => {
              const existingYears = [...new Set(form.yearly_goals.map(g => g.year ?? new Date().getFullYear()))];
              const maxYear = existingYears.length > 0 ? Math.max(...existingYears) : new Date().getFullYear() - 1;
              const newYear = maxYear + 1;
              if (existingYears.includes(newYear)) return;
              setForm({ ...form, yearly_goals: [...form.yearly_goals, { text: '', done: false, year: newYear }] });
            }}
            className={btnSecondary}>+ Year</button>
        </div>
        {form.yearly_goals.length === 0 && (
          <p className="text-xs text-white/20 text-center py-6 uppercase tracking-widest">아직 목표가 없습니다.</p>
        )}
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...new Set(form.yearly_goals.map(g => g.year ?? new Date().getFullYear()))].sort((a,b) => a-b).map(year => (
            <div key={year} className="border border-white/10 p-4 min-w-[260px] flex-shrink-0">
              <p className="text-xs font-black tracking-widest text-white/40 uppercase mb-3">{year}</p>
              <div className="space-y-2">
                {form.yearly_goals.map((goal, i) => (goal.year ?? new Date().getFullYear()) !== year ? null : (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex-shrink-0 cursor-pointer transition-colors ${goal.done ? 'bg-white border-white' : 'border-white/20 hover:border-white/50'}`}
                      onClick={() => setForm({ ...form, yearly_goals: form.yearly_goals.map((g, idx) => idx === i ? { ...g, done: !g.done } : g) })}
                    />
                    <input
                      value={goal.text}
                      onChange={e => setForm({ ...form, yearly_goals: form.yearly_goals.map((g, idx) => idx === i ? { ...g, text: e.target.value } : g) })}
                      placeholder="목표 입력"
                      className={`${inputCls} flex-1 text-sm ${goal.done ? 'line-through text-white/30' : ''}`}
                    />
                    <button type="button"
                      onClick={() => setForm({ ...form, yearly_goals: form.yearly_goals.filter((_, idx) => idx !== i) })}
                      className="text-red-400/40 hover:text-red-400 transition-colors">×</button>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setForm({ ...form, yearly_goals: [...form.yearly_goals, { text: '', done: false, year }] })}
                  className="text-xs text-white/20 hover:text-white/50 transition-colors mt-1">+ 추가</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className={`${btnPrimary} w-full py-4`}>
        {saved ? '✓ 저장됨' : '저장하기 →'}
      </button>
    </form>
  );
}

// ─── Blog tab ─────────────────────────────────────────────────────────────────

const EMPTY_POST = { title: '', slug: '', content: '', excerpt: '', tags: [] as string[], thumbnail_url: '', is_published: false };

function renderContent(content: string) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return <h2 key={i} className="font-black text-2xl tracking-tight mt-8 mb-3">{line.slice(2)}</h2>;
    if (line.startsWith('## ')) return <h3 key={i} className="font-black text-xl tracking-tight mt-6 mb-2">{line.slice(3)}</h3>;
    if (line.startsWith('### ')) return <h4 key={i} className="font-bold text-lg mt-4 mb-2 text-white/80">{line.slice(4)}</h4>;
    if (line.startsWith('- ')) return <li key={i} className="text-white/50 ml-4 list-disc mb-1 text-sm">{line.slice(2)}</li>;
    if (line.trim() === '') return <div key={i} className="h-3" />;
    return <p key={i} className="text-white/50 leading-relaxed mb-1 text-sm">{line}</p>;
  });
}

function VelogTab() {
  const [posts, setPosts] = useState<VelogPost[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => velogApi.listAll().then(setPosts).catch(() => {});

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true); setMsg('');
    try {
      const res = await velogApi.sync();
      setMsg(`완료: 총 ${res.synced}개 중 신규 ${res.new}개`);
      load();
    } catch {
      setMsg('동기화 실패');
    } finally {
      setSyncing(false);
    }
  };

  const toggle = async (id: number) => {
    await velogApi.toggle(id);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, is_displayed: !p.is_displayed } : p));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-xl">Velog 포스트</h2>
          <p className="text-white/30 text-xs mt-1">표시할 글을 선택하세요. 블로그 페이지에 노출됩니다.</p>
        </div>
        <div className="flex items-center gap-4">
          {msg && <span className="text-xs text-white/40">{msg}</span>}
          <button onClick={sync} disabled={syncing}
            className="px-5 py-2 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-white/80 transition-colors disabled:opacity-40">
            {syncing ? '동기화 중...' : '벨로그 동기화'}
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-white/20 text-sm">동기화 버튼을 눌러 글을 가져오세요.</div>
      ) : (
        <div className="border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase">표시</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase">제목</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase hidden md:table-cell">시리즈</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase hidden lg:table-cell">태그</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase hidden sm:table-cell">날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-4">
                    <button onClick={() => toggle(post.id)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${post.is_displayed ? 'bg-white' : 'bg-white/10'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${post.is_displayed ? 'bg-black left-5' : 'bg-white/40 left-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <a href={`https://velog.io/@startea0716/${post.slug}`} target="_blank" rel="noreferrer"
                      className="text-sm font-semibold hover:text-white/60 transition-colors line-clamp-1">
                      {post.title}
                    </a>
                    {post.short_description && (
                      <p className="text-xs text-white/20 mt-1 line-clamp-1">{post.short_description}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    {post.series_name ? (
                      <span className="text-[10px] px-2 py-0.5 bg-white/10 text-white/50">{post.series_name}</span>
                    ) : <span className="text-white/10">-</span>}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 border border-white/10 text-white/20">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-white/20 hidden sm:table-cell">
                    {post.released_at ? new Date(post.released_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState(EMPTY_POST);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refresh = () => blogApi.listAll().then(setPosts);
  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) await blogApi.update(editingId, form);
    else await blogApi.create(form);
    setForm(EMPTY_POST); setEditingId(null); setPreview(false); refresh();
  };

  const handleEdit = (p: BlogPost) => {
    setEditingId(p.id);
    setPreview(false);
    setForm({ title: p.title, slug: p.slug, content: p.content, excerpt: p.excerpt || '',
      tags: p.tags, thumbnail_url: p.thumbnail_url || '', is_published: p.is_published });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await blogApi.delete(id); refresh();
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) setForm({ ...form, tags: [...form.tags, tag] });
    setTagInput('');
  };

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const insertText = (before: string, after = '', placeholder = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = form.content.slice(start, end) || placeholder;
    const newContent = form.content.slice(0, start) + before + selected + after + form.content.slice(end);
    setForm({ ...form, content: newContent });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const toolbarItems = [
    { label: 'H1', action: () => insertText('# ', '', '제목') },
    { label: 'H2', action: () => insertText('## ', '', '소제목') },
    { label: 'H3', action: () => insertText('### ', '', '소소제목') },
    { label: 'B', action: () => insertText('**', '**', '굵게') },
    { label: 'I', action: () => insertText('*', '*', '기울임') },
    { label: '`', action: () => insertText('`', '`', 'code') },
    { label: '```', action: () => insertText('```\n', '\n```', 'code block') },
    { label: '—', action: () => insertText('\n---\n') },
    { label: '•', action: () => insertText('- ', '', '항목') },
    { label: '>', action: () => insertText('> ', '', '인용') },
  ];

  return (
    <div className="space-y-6">
      <div className="border border-white/10 p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">
            {editingId ? '글 수정' : '새 글 작성'}
          </p>
          <button type="button" onClick={() => setPreview(!preview)}
            className={`text-xs font-semibold uppercase tracking-widest transition-colors px-4 py-2 border ${
              preview ? 'border-white text-white' : 'border-white/10 text-white/30 hover:border-white/30 hover:text-white'
            }`}>
            {preview ? '✏️ 편집' : '👁 미리보기'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value, slug: editingId ? form.slug : autoSlug(e.target.value) })}
            placeholder="제목" className={inputCls} />
          <input required value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })}
            placeholder="슬러그 (URL용, 영문)" className={inputCls} />
          <input value={form.excerpt}
            onChange={e => setForm({ ...form, excerpt: e.target.value })}
            placeholder="요약 (선택사항 — 목록에 표시)" className={inputCls} />

          <div className="flex gap-2">
            <input value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="태그 입력 후 Enter" className={`${inputCls} flex-1`} />
            <button type="button" onClick={addTag}
              className="border border-white/10 text-white/40 px-4 hover:border-white/30 hover:text-white transition-colors">+</button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag, i) => (
                <span key={i} className="text-xs px-3 py-1 border border-white/10 text-white/40 flex items-center gap-2">
                  {tag}
                  <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((_, j) => j !== i) })}
                    className="text-white/20 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          )}

          {/* 에디터 / 미리보기 */}
          {preview ? (
            <div className="border border-white/10 p-6 min-h-64">
              {form.title && <h1 className="font-black text-3xl tracking-tight mb-4">{form.title}</h1>}
              {form.tags.length > 0 && (
                <div className="flex gap-2 mb-6">
                  {form.tags.map(tag => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 border border-white/10 text-white/20 uppercase tracking-widest">{tag}</span>
                  ))}
                </div>
              )}
              <div className="border-t border-white/10 pt-6">
                {form.content ? renderContent(form.content) : <p className="text-white/20 text-sm">내용을 입력하세요...</p>}
              </div>
            </div>
          ) : (
            <div className="border border-white/10">
              {/* 마크다운 툴바 */}
              <div className="flex flex-wrap gap-px border-b border-white/10 bg-white/5 p-1">
                {toolbarItems.map(({ label, action }) => (
                  <button key={label} type="button" onClick={action}
                    className="px-3 py-1.5 text-xs font-mono text-white/40 hover:text-white hover:bg-white/10 transition-colors rounded">
                    {label}
                  </button>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                required rows={20} value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    insertText('  ');
                  }
                }}
                placeholder={'# 제목\n\n## 소제목\n\n내용을 입력하세요...\n\n- 항목 1\n- 항목 2'}
                className="w-full bg-transparent text-white placeholder-white/20 px-4 py-3 focus:outline-none resize-y font-mono text-xs leading-relaxed" />
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-5 rounded-full transition-colors relative ${form.is_published ? 'bg-white' : 'bg-white/10'}`}
              onClick={() => setForm({ ...form, is_published: !form.is_published })}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform ${form.is_published ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">발행</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={btnPrimary}>{editingId ? '수정 완료' : '발행하기'}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_POST); setPreview(false); }} className={btnSecondary}>취소</button>
            )}
          </div>
        </form>
      </div>

      {/* 글 목록 */}
      <div className="border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase">제목</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase hidden sm:table-cell">태그</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold tracking-widest text-white/20 uppercase">발행</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-widest text-white/20 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {posts.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-white/70">{p.title}</td>
                <td className="px-4 py-3 text-white/30 hidden sm:table-cell text-xs">{p.tags.join(', ')}</td>
                <td className="px-4 py-3 text-center text-white/40">{p.is_published ? '✓' : ''}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(p)}
                    className="text-xs text-white/30 hover:text-white transition-colors mr-4 uppercase tracking-widest">수정</button>
                  <button onClick={() => handleDelete(p.id)}
                    className="text-xs text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-widest">삭제</button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-white/20 text-xs uppercase tracking-widest">아직 글이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Certifications tab ───────────────────────────────────────────────────────

const EMPTY_CERT: Omit<Certification, 'id'> = {
  name: '', issuer: '', acquired_date: null, credential_url: '', order: 0,
};

function CertificationsTab() {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [form, setForm] = useState(EMPTY_CERT);
  const [editingId, setEditingId] = useState<number | null>(null);

  const refresh = () => certificationsApi.list().then(setCerts);
  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) await certificationsApi.update(editingId, form);
    else await certificationsApi.create(form);
    setForm(EMPTY_CERT); setEditingId(null); refresh();
  };

  const handleEdit = (c: Certification) => {
    setEditingId(c.id);
    setForm({ name: c.name, issuer: c.issuer, acquired_date: c.acquired_date,
      credential_url: c.credential_url, order: c.order });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await certificationsApi.delete(id); refresh();
  };

  return (
    <div className="space-y-6">
      <div className="border border-white/10 p-8">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-6">
          {editingId ? '자격증 수정' : '자격증 추가'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="자격증 이름 (예: 정보처리기사)" className={inputCls} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input value={form.issuer}
              onChange={e => setForm({ ...form, issuer: e.target.value })}
              placeholder="발급 기관 (예: 한국산업인력공단)" className={inputCls} />
            <input type="date" value={form.acquired_date ?? ''}
              onChange={e => setForm({ ...form, acquired_date: e.target.value || null })}
              className={inputCls} />
          </div>
          <input value={form.credential_url}
            onChange={e => setForm({ ...form, credential_url: e.target.value })}
            placeholder="자격증 링크 (선택)" className={inputCls} />
          <div className="flex gap-3 pt-2">
            <button type="submit" className={btnPrimary}>{editingId ? '수정 완료' : '추가하기'}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_CERT); }}
                className={btnSecondary}>취소</button>
            )}
          </div>
        </form>
      </div>

      <div className="border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase">자격증</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase hidden sm:table-cell">발급 기관</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase">취득일</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-widest text-white/20 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {certs.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-white/70">{c.name}</td>
                <td className="px-4 py-3 text-white/30 hidden sm:table-cell">{c.issuer}</td>
                <td className="px-4 py-3 text-white/30 text-xs">
                  {c.acquired_date ? new Date(c.acquired_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }) : '—'}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(c)}
                    className="text-xs text-white/30 hover:text-white transition-colors mr-4 uppercase tracking-widest">수정</button>
                  <button onClick={() => handleDelete(c.id)}
                    className="text-xs text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-widest">삭제</button>
                </td>
              </tr>
            ))}
            {certs.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-white/20 text-xs uppercase tracking-widest">등록된 자격증이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Awards tab ───────────────────────────────────────────────────────────────

const EMPTY_AWARD: Omit<Award, 'id'> = {
  title: '', competition: '', organizer: '', awarded_date: null, project_id: null,
  description: '', link_url: '', sort_order: null,
};

function AwardsTab() {
  const [awards, setAwards] = useState<Award[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState(EMPTY_AWARD);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const refresh = () => awardsApi.list().then(setAwards);
  useEffect(() => { refresh(); projectsApi.list().then(setProjects).catch(() => {}); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await awardsApi.update(editingId, form);
      else await awardsApi.create(form);
      setForm(EMPTY_AWARD); setEditingId(null); refresh();
    } catch (err) {
      setError(apiError(err, '저장에 실패했습니다. 링크는 https:// 로 시작해야 합니다.'));
    }
  };

  const handleEdit = (a: Award) => {
    setEditingId(a.id);
    setForm({ title: a.title, competition: a.competition, organizer: a.organizer || '', awarded_date: a.awarded_date,
      project_id: a.project_id, description: a.description || '', link_url: a.link_url || '', sort_order: a.sort_order });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await awardsApi.delete(id); refresh();
  };

  const projectTitle = (id: number | null) => projects.find(p => p.id === id)?.title;

  return (
    <div className="space-y-6">
      <div className="border border-white/10 p-8">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-6">
          {editingId ? '수상 수정' : '수상 추가'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4">
            <input required value={form.title} maxLength={200}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="상 이름 (예: 우수상)" className={inputCls} />
            <input required value={form.competition} maxLength={200}
              onChange={e => setForm({ ...form, competition: e.target.value })}
              placeholder="대회명 (예: 제11회 전국 고등학교 동아리 AI·SW경진대회)" className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input value={form.organizer ?? ''} maxLength={200}
              onChange={e => setForm({ ...form, organizer: e.target.value })}
              placeholder="주최 (예: KAIST 외)" className={inputCls} />
            <input type="date" value={form.awarded_date ?? ''}
              onChange={e => setForm({ ...form, awarded_date: e.target.value || null })}
              className={inputCls} />
            <select value={form.project_id ?? ''}
              onChange={e => setForm({ ...form, project_id: e.target.value ? Number(e.target.value) : null })}
              className={`${inputCls} [&>option]:bg-[#111]`}>
              <option value="">출품작 연결 안 함</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <textarea rows={2} value={form.description ?? ''}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="설명 (선택)" className={`${inputCls} resize-y`} />
          <input value={form.link_url ?? ''} maxLength={500}
            onChange={e => setForm({ ...form, link_url: e.target.value })}
            placeholder="기사·공지 링크 (https://...)" className={inputCls} />
          {error && <p className="text-red-400 text-xs" role="alert">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" className={btnPrimary}>{editingId ? '수정 완료' : '추가하기'}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_AWARD); }}
                className={btnSecondary}>취소</button>
            )}
          </div>
        </form>
      </div>

      <div className="border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase">날짜</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase">수상</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase hidden sm:table-cell">출품작</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-widest text-white/20 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {awards.map(a => (
              <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">{a.awarded_date ?? '—'}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-white/70">{a.title}</p>
                  <p className="text-xs text-white/30">{a.competition}</p>
                </td>
                <td className="px-4 py-3 text-white/30 text-xs hidden sm:table-cell">{projectTitle(a.project_id) ?? '—'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(a)}
                    className="text-xs text-white/30 hover:text-white transition-colors mr-4 uppercase tracking-widest">수정</button>
                  <button onClick={() => handleDelete(a.id)}
                    className="text-xs text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-widest">삭제</button>
                </td>
              </tr>
            ))}
            {awards.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-white/20 text-xs uppercase tracking-widest">등록된 수상이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Organizations tab ────────────────────────────────────────────────────────

const EMPTY_ORG: Omit<Organization, 'id'> = {
  name: '', institution: '', role: '', period: '', description: '', logo_url: '', link_url: '',
};

function OrganizationsTab() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [form, setForm] = useState(EMPTY_ORG);
  const [editingId, setEditingId] = useState<number | null>(null);

  const refresh = () => organizationsApi.list().then(setOrgs);
  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) await organizationsApi.update(editingId, form);
    else await organizationsApi.create(form);
    setForm(EMPTY_ORG); setEditingId(null); refresh();
  };

  const handleEdit = (o: Organization) => {
    setEditingId(o.id);
    setForm({ name: o.name, institution: o.institution, role: o.role, period: o.period,
      description: o.description, logo_url: o.logo_url, link_url: o.link_url });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await organizationsApi.delete(id); refresh();
  };

  return (
    <div className="space-y-6">
      <div className="border border-white/10 p-8">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-6">
          {editingId ? '활동 수정' : '새 활동 추가'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="동아리/조직 이름 (예: 멋쟁이사자처럼)" className={inputCls} />
          <input value={form.institution}
            onChange={e => setForm({ ...form, institution: e.target.value })}
            placeholder="소속 기관/학교 (예: 한국외국어대학교, SOFCON)" className={inputCls} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              placeholder="역할 (예: 회장, 부원, 운영진)" className={inputCls} />
            <input value={form.period}
              onChange={e => setForm({ ...form, period: e.target.value })}
              placeholder="활동 기간 (예: 2023.03 ~ 2024.02)" className={inputCls} />
          </div>
          <textarea rows={3} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="활동 내용 (간단히)" className={`${inputCls} resize-none`} />
          <input value={form.link_url}
            onChange={e => setForm({ ...form, link_url: e.target.value })}
            placeholder="링크 (GitHub 조직, 홈페이지 등)" className={inputCls} />
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-white/20 uppercase mb-3">로고 이미지</p>
            <ImageUpload value={form.logo_url} onChange={url => setForm({ ...form, logo_url: url })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className={btnPrimary}>{editingId ? '수정 완료' : '추가하기'}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_ORG); }}
                className={btnSecondary}>취소</button>
            )}
          </div>
        </form>
      </div>

      <div className="border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase w-12"></th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase">이름</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase hidden sm:table-cell">역할</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase hidden md:table-cell">기간</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-widest text-white/20 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {orgs.map(o => (
              <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  {o.logo_url
                    ? <img src={o.logo_url} alt="" className="w-10 h-10 object-cover opacity-60 rounded" />
                    : <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-white/20 text-lg">◎</div>}
                </td>
                <td className="px-4 py-3 font-medium text-white/70">{o.name}</td>
                <td className="px-4 py-3 text-white/30 hidden sm:table-cell">{o.role}</td>
                <td className="px-4 py-3 text-white/30 hidden md:table-cell text-xs">{o.period}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleEdit(o)}
                    className="text-xs text-white/30 hover:text-white transition-colors mr-4 uppercase tracking-widest">수정</button>
                  <button onClick={() => handleDelete(o.id)}
                    className="text-xs text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-widest">삭제</button>
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-white/20 text-xs uppercase tracking-widest">아직 활동 기록이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type Tab = 'projects' | 'messages' | 'profile' | 'blog' | 'organizations' | 'certifications' | 'velog' | 'awards';

function VisitorChart() {
  const [data, setData] = useState<{ date: string; count: number }[]>([]);
  const [range, setRange] = useState(30);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    statsApi.daily(range).then(setData).catch(() => {});
  }, [range]);

  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const pad = 4, barW = 20, H = 120;
  const W = data.length * (barW + pad) - pad;

  return (
    <div className="border border-white/10 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">일별 방문자</p>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setRange(d)}
              className={`text-[11px] font-semibold tracking-widest uppercase px-3 py-1 transition-colors ${
                range === d ? 'text-white border border-white/30' : 'text-white/20 hover:text-white/50'
              }`}>{d}일</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" style={{ overflow: 'visible' }}>
        {data.map((d, i) => {
          const bh = Math.max(2, (d.count / max) * H);
          const x = i * (barW + pad);
          const showLabel = data.length <= 14 || i % Math.ceil(data.length / 10) === 0;
          const isHovered = hovered === i;
          return (
            <g key={d.date} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              <rect x={x} y={0} width={barW} height={H} fill="transparent" />
              <rect x={x} y={H - bh} width={barW} height={bh}
                fill={isHovered ? 'rgba(255,255,255,0.85)' : d.count > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.06)'}
                style={{ transition: 'fill 0.15s' }} />
              {isHovered && (
                <g>
                  <rect x={x + barW / 2 - 28} y={H - bh - 32} width={56} height={24} rx={3} fill="rgba(255,255,255,0.1)" />
                  <text x={x + barW / 2} y={H - bh - 22} textAnchor="middle"
                    className="fill-white" style={{ fontSize: 9, fontWeight: 600 }}>{d.date.slice(5)}</text>
                  <text x={x + barW / 2} y={H - bh - 12} textAnchor="middle"
                    className="fill-white/70" style={{ fontSize: 9 }}>{d.count}명</text>
                </g>
              )}
              {!isHovered && d.count > 0 && (
                <text x={x + barW / 2} y={H - bh - 4} textAnchor="middle"
                  className="fill-white/40" style={{ fontSize: 9 }}>{d.count}</text>
              )}
              {showLabel && (
                <text x={x + barW / 2} y={H + 16} textAnchor="middle"
                  className="fill-white/20" style={{ fontSize: 9 }}>
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [tab, setTab] = useState<Tab>('profile');
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const onLogout = () => { setIsLoggedIn(false); setUser(null); };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    // 토큰이 만료됐으면 401 → 인터셉터가 auth:logout 발생
    authApi.me().then(setUser).catch(() => {});
    statsApi.get().then(setStats).catch(() => {});
  }, [isLoggedIn]);

  const handleLogout = () => { localStorage.removeItem('token'); setUser(null); setIsLoggedIn(false); };

  if (!isLoggedIn) return <LoginForm onLogin={() => setIsLoggedIn(true)} />;

  return (
    <main className="bg-[#0a0a0a] min-h-screen pt-16 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-8">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-1">대시보드</p>
            <h1 className="font-black text-3xl tracking-tighter">관리자</h1>
          </div>
          <div className="flex items-center gap-6 min-w-0">
            <DownloadMenu label="Portfolio" />
            <DownloadMenu label="Resume" doc="resume" />
            {user && (
              <div className="flex items-center gap-3 min-w-0">
                {user.picture
                  ? <img src={user.picture} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full ring-1 ring-white/10 shrink-0" />
                  : <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />}
                <div className="min-w-0 hidden sm:block">
                  <p className="text-sm text-white/70 truncate">{user.name || user.email}</p>
                  <p className="text-[11px] text-white/30 truncate">{user.email}</p>
                </div>
              </div>
            )}
            <button onClick={handleLogout}
              className="text-xs font-semibold uppercase tracking-widest text-white/20 hover:text-white transition-colors shrink-0">
              로그아웃 →
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-px bg-white/5 mb-2">
            <div className="bg-[#0a0a0a] p-6">
              <p className="font-black text-4xl">{stats.today}</p>
              <p className="text-[11px] font-semibold tracking-widest text-white/20 uppercase mt-1">오늘</p>
            </div>
            <div className="bg-[#0a0a0a] p-6">
              <p className="font-black text-4xl">{stats.total}</p>
              <p className="text-[11px] font-semibold tracking-widest text-white/20 uppercase mt-1">전체</p>
            </div>
          </div>
        )}
        <VisitorChart />

        <div className="flex justify-end mb-6">
          <button onClick={async () => {
            if (!confirm('방문자 수를 초기화하시겠습니까?')) return;
            await statsApi.reset();
            setStats({ today: 0, total: 0 });
          }} className="text-[11px] text-red-400/40 hover:text-red-400 uppercase tracking-widest transition-colors">
            방문자 초기화
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-8 border-b border-white/10 overflow-x-auto">
          {([['profile', '프로필'], ['projects', '프로젝트'], ['awards', '수상'], ['organizations', '활동'], ['certifications', '자격증'], ['blog', '블로그'], ['velog', 'Velog'], ['messages', '메시지']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t ? 'border-white text-white' : 'border-transparent text-white/20 hover:text-white/50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'profile' && <ProfileTab />}
        {tab === 'projects' && <ProjectsTab />}
        {tab === 'awards' && <AwardsTab />}
        {tab === 'organizations' && <OrganizationsTab />}
        {tab === 'certifications' && <CertificationsTab />}
        {tab === 'blog' && <BlogTab />}
        {tab === 'velog' && <VelogTab />}
        {tab === 'messages' && <MessagesTab />}
      </div>
    </main>
  );
}
