import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogApi } from '../api';
import { useLang } from '../context/LanguageContext';
import type { BlogPost } from '../types';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    if (!slug) return;
    blogApi.get(slug).then(setPost).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <main className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
    </main>
  );

  if (notFound || !post) return (
    <main className="bg-[#0a0a0a] min-h-screen flex flex-col items-center justify-center text-white gap-6">
      <p className="text-white/20 text-xs uppercase tracking-widest">404 — Not Found</p>
      <Link to="/blog" className="text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors">{t('back')}</Link>
    </main>
  );

  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen">
      {post.thumbnail_url && (
        <div className="w-full h-[40vh] overflow-hidden">
          <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover opacity-40" />
        </div>
      )}

      <div className="px-6 md:px-16 max-w-3xl mx-auto py-16">
        <Link to="/blog"
          className="text-[11px] font-semibold uppercase tracking-widest text-white/20 hover:text-white transition-colors mb-12 inline-block">
          {t('back')}
        </Link>

        <div className="border-b border-white/10 pb-10 mb-12">
          <div className="flex flex-wrap gap-3 mb-6">
            {post.tags.map(tag => (
              <span key={tag} className="text-[11px] px-2 py-0.5 border border-white/10 text-white/20 uppercase tracking-widest">{tag}</span>
            ))}
          </div>
          <h1 className="font-black text-4xl md:text-6xl tracking-tighter leading-tight">{post.title}</h1>
          <p className="text-white/20 text-xs mt-4 uppercase tracking-widest">
            {new Date(post.created_at).toLocaleDateString('ko-KR')}
            {post.updated_at !== post.created_at && ` · Updated ${new Date(post.updated_at).toLocaleDateString('ko-KR')}`}
          </p>
        </div>

        {/* Content rendered as markdown-like plain text */}
        <div className="prose-dark">
          {post.content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h2 key={i} className="font-black text-3xl tracking-tight mt-12 mb-4">{line.slice(2)}</h2>;
            if (line.startsWith('## ')) return <h3 key={i} className="font-black text-2xl tracking-tight mt-10 mb-3">{line.slice(3)}</h3>;
            if (line.startsWith('### ')) return <h4 key={i} className="font-bold text-xl mt-8 mb-3 text-white/80">{line.slice(4)}</h4>;
            if (line.startsWith('- ')) return <li key={i} className="text-white/50 leading-relaxed ml-4 list-disc mb-1">{line.slice(2)}</li>;
            if (line.startsWith('```')) return <div key={i} className="bg-white/5 border border-white/10 text-xs font-mono text-white/60 px-4 py-2 my-2" />;
            if (line.trim() === '') return <div key={i} className="h-4" />;
            return <p key={i} className="text-white/50 leading-relaxed mb-2">{line}</p>;
          })}
        </div>
      </div>
    </main>
  );
}
