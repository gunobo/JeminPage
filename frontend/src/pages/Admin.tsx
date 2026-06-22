import { useEffect, useState } from 'react';
import { projectsApi, authApi, statsApi, contactApi, profileApi, blogApi } from '../api';
import ImageUpload from '../components/ui/ImageUpload';
import FileUpload from '../components/ui/FileUpload';
import type { Project, ContactMessage, VisitorStats, Profile, SkillGroup, BlogPost } from '../types';

const inputCls = 'w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-4 py-3 focus:outline-none focus:border-white/30 transition-colors text-sm';
const btnPrimary = 'px-6 py-3 bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-white/80 transition-colors';
const btnSecondary = 'px-6 py-3 border border-white/10 text-white/50 text-xs font-semibold uppercase tracking-widest hover:border-white/30 hover:text-white transition-colors';

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
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-4">Admin</p>
        <h1 className="font-black text-4xl tracking-tighter mb-10">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-0">
          <input
            type="password" required value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputCls}
            placeholder="Password"
          />
          {error && <p className="text-red-400 text-xs uppercase tracking-widest pt-3">{error}</p>}
          <button type="submit" className={`${btnPrimary} w-full mt-4 py-4`}>
            Enter →
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
    if (editingId) await projectsApi.update(editingId, form);
    else await projectsApi.create(form);
    setForm(EMPTY_FORM); setEditingId(null); refresh();
  };

  const handleEdit = (p: Project) => {
    setEditingId(p.id);
    setForm({ title: p.title, description: p.description, tech_stack: p.tech_stack,
      github_url: p.github_url || '', demo_url: p.demo_url || '',
      thumbnail_url: p.thumbnail_url || '', is_featured: p.is_featured });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          {editingId ? 'Edit Project' : 'New Project'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Project Title" className={inputCls} />
          <textarea required rows={3} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Description" className={`${inputCls} resize-none`} />

          <div className="flex gap-2">
            <input value={techInput}
              onChange={e => setTechInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())}
              placeholder="Tech stack (Enter to add)" className={`${inputCls} flex-1`} />
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
            <p className="text-[11px] font-semibold tracking-widest text-white/20 uppercase mb-3">Thumbnail</p>
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

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-5 rounded-full transition-colors relative ${form.is_featured ? 'bg-white' : 'bg-white/10'}`}
              onClick={() => setForm({ ...form, is_featured: !form.is_featured })}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform ${form.is_featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">Featured on main page</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={btnPrimary}>{editingId ? 'Update' : 'Add Project'}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}
                className={btnSecondary}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase w-12"></th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase hidden sm:table-cell">Stack</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold tracking-widest text-white/20 uppercase">★</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-widest text-white/20 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {projects.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
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
              <tr><td colSpan={5} className="px-6 py-12 text-center text-white/20 text-xs uppercase tracking-widest">No projects yet.</td></tr>
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
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">Messages</p>
        {unreadCount > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-black">{unreadCount}</span>
        )}
      </div>
      {messages.length === 0 ? (
        <div className="py-16 text-center text-white/20 text-xs uppercase tracking-widest">No messages.</div>
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
                    Reply to {msg.email} →
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
  portfolio_url: '', avatar_url: '', cv_url: '', og_image_url: '', skill_groups: [],
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
    if (!g.skills.includes(val)) updateGroup(gi, { skills: [...g.skills, val] });
    setSkillInput({ ...skillInput, [gi]: '' });
  };
  const removeSkill = (gi: number, si: number) =>
    updateGroup(gi, { skills: form.skill_groups[gi].skills.filter((_, i) => i !== si) });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic */}
      <div className="border border-white/10 p-8">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-6">Basic Info</p>
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
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-6">Profile Photo</p>
        <div className="max-w-xs">
          <ImageUpload value={form.avatar_url} onChange={url => setForm({ ...form, avatar_url: url })} />
        </div>
      </div>

      {/* CV & OG */}
      <div className="border border-white/10 p-8 space-y-8">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-2">CV / Resume</p>
          <p className="text-xs text-white/20 mb-4">PDF 파일 — 홈 화면 "CV ↓" 버튼에 연결됩니다.</p>
          <FileUpload
            value={form.cv_url}
            accept="application/pdf"
            label="PDF 업로드"
            onChange={url => setForm({ ...form, cv_url: url })}
          />
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-2">OG Image</p>
          <p className="text-xs text-white/20 mb-4">SNS 공유 미리보기 이미지 — 권장 사이즈 1200×630px</p>
          <ImageUpload value={form.og_image_url} onChange={url => setForm({ ...form, og_image_url: url })} />
        </div>
      </div>

      {/* Skills */}
      <div className="border border-white/10 p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">Skills</p>
          <button type="button" onClick={addSkillGroup} className={btnSecondary}>+ Category</button>
        </div>
        {form.skill_groups.length === 0 && (
          <p className="text-xs text-white/20 text-center py-6 uppercase tracking-widest">No categories yet.</p>
        )}
        <div className="space-y-4">
          {form.skill_groups.map((group, gi) => (
            <div key={gi} className="border border-white/10 p-4">
              <div className="flex gap-2 mb-3">
                <input value={group.category}
                  onChange={e => updateGroup(gi, { category: e.target.value })}
                  placeholder="Category (e.g. Backend)" className={`${inputCls} flex-1`} />
                <button type="button" onClick={() => removeGroup(gi)}
                  className="px-3 text-red-400/40 hover:text-red-400 transition-colors text-sm">×</button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {group.skills.map((s, si) => (
                  <span key={si} className="text-xs px-3 py-1 border border-white/10 text-white/40 flex items-center gap-2">
                    {s}
                    <button type="button" onClick={() => removeSkill(gi, si)}
                      className="text-white/20 hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={skillInput[gi] || ''}
                  onChange={e => setSkillInput({ ...skillInput, [gi]: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(gi))}
                  placeholder="Add skill (Enter)" className={`${inputCls} flex-1`} />
                <button type="button" onClick={() => addSkill(gi)}
                  className="border border-white/10 text-white/40 px-4 hover:border-white/30 hover:text-white transition-colors">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className={`${btnPrimary} w-full py-4`}>
        {saved ? '✓ Saved' : 'Save Changes →'}
      </button>
    </form>
  );
}

// ─── Blog tab ─────────────────────────────────────────────────────────────────

const EMPTY_POST = { title: '', slug: '', content: '', excerpt: '', tags: [] as string[], thumbnail_url: '', is_published: false };

function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState(EMPTY_POST);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState('');

  const refresh = () => blogApi.listAll().then(setPosts);
  useEffect(() => { refresh(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) await blogApi.update(editingId, form);
    else await blogApi.create(form);
    setForm(EMPTY_POST); setEditingId(null); refresh();
  };

  const handleEdit = (p: BlogPost) => {
    setEditingId(p.id);
    setForm({ title: p.title, slug: p.slug, content: p.content, excerpt: p.excerpt || '',
      tags: p.tags, thumbnail_url: p.thumbnail_url || '', is_published: p.is_published });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return;
    await blogApi.delete(id); refresh();
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm({ ...form, tags: [...form.tags, t] });
    setTagInput('');
  };

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  return (
    <div className="space-y-6">
      <div className="border border-white/10 p-8">
        <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-6">
          {editingId ? 'Edit Post' : 'New Post'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value, slug: editingId ? form.slug : autoSlug(e.target.value) })}
            placeholder="Title" className={inputCls} />
          <input required value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })}
            placeholder="Slug (URL)" className={inputCls} />
          <input value={form.excerpt}
            onChange={e => setForm({ ...form, excerpt: e.target.value })}
            placeholder="Excerpt (optional)" className={inputCls} />

          <div className="flex gap-2">
            <input value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Tags (Enter to add)" className={`${inputCls} flex-1`} />
            <button type="button" onClick={addTag}
              className="border border-white/10 text-white/40 px-4 hover:border-white/30 hover:text-white transition-colors">+</button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((t, i) => (
                <span key={i} className="text-xs px-3 py-1 border border-white/10 text-white/40 flex items-center gap-2">
                  {t}
                  <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((_, j) => j !== i) })}
                    className="text-white/20 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          )}

          <textarea required rows={16} value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder={'# 제목\n\n## 소제목\n\n내용을 입력하세요...\n\n- 항목 1\n- 항목 2'}
            className={`${inputCls} resize-y font-mono text-xs leading-relaxed`} />

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-5 rounded-full transition-colors relative ${form.is_published ? 'bg-white' : 'bg-white/10'}`}
              onClick={() => setForm({ ...form, is_published: !form.is_published })}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform ${form.is_published ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">Published</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={btnPrimary}>{editingId ? 'Update' : 'Publish'}</button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_POST); }} className={btnSecondary}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div className="border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-widest text-white/20 uppercase hidden sm:table-cell">Tags</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold tracking-widest text-white/20 uppercase">Pub</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-widest text-white/20 uppercase">Actions</th>
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
                    className="text-xs text-white/30 hover:text-white transition-colors mr-4 uppercase tracking-widest">Edit</button>
                  <button onClick={() => handleDelete(p.id)}
                    className="text-xs text-red-400/50 hover:text-red-400 transition-colors uppercase tracking-widest">Del</button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-white/20 text-xs uppercase tracking-widest">No posts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

type Tab = 'projects' | 'messages' | 'profile' | 'blog';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [tab, setTab] = useState<Tab>('profile');
  const [stats, setStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    if (isLoggedIn) statsApi.get().then(setStats).catch(() => {});
  }, [isLoggedIn]);

  const handleLogout = () => { localStorage.removeItem('token'); setIsLoggedIn(false); };

  if (!isLoggedIn) return <LoginForm onLogin={() => setIsLoggedIn(true)} />;

  return (
    <main className="bg-[#0a0a0a] min-h-screen pt-16 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-8">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-1">Dashboard</p>
            <h1 className="font-black text-3xl tracking-tighter">Admin</h1>
          </div>
          <button onClick={handleLogout}
            className="text-xs font-semibold uppercase tracking-widest text-white/20 hover:text-white transition-colors">
            Logout →
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-px bg-white/5 mb-8">
            <div className="bg-[#0a0a0a] p-6">
              <p className="font-black text-4xl">{stats.today}</p>
              <p className="text-[11px] font-semibold tracking-widest text-white/20 uppercase mt-1">Today</p>
            </div>
            <div className="bg-[#0a0a0a] p-6">
              <p className="font-black text-4xl">{stats.total}</p>
              <p className="text-[11px] font-semibold tracking-widest text-white/20 uppercase mt-1">Total</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 mb-8 border-b border-white/10">
          {([['profile', 'Profile'], ['projects', 'Projects'], ['blog', 'Blog'], ['messages', 'Messages']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-white text-white' : 'border-transparent text-white/20 hover:text-white/50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'profile' && <ProfileTab />}
        {tab === 'projects' && <ProjectsTab />}
        {tab === 'blog' && <BlogTab />}
        {tab === 'messages' && <MessagesTab />}
      </div>
    </main>
  );
}
