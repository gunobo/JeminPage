import { useEffect, useState } from 'react';
import { velogApi } from '../api';
import { useLang } from '../context/LanguageContext';
import type { VelogPost } from '../types';

const VELOG_BASE = 'https://velog.io/@startea0716';

export default function Blog() {
  const [posts, setPosts] = useState<VelogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    velogApi.list().then(setPosts).finally(() => setLoading(false));
  }, []);

  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen">
      <div className="px-6 md:px-12 pt-32 pb-16 max-w-5xl mx-auto">
        <div className="border-b border-white/10 pb-12 mb-16">
          <span className="text-xs font-semibold tracking-[0.3em] text-white/30 uppercase">TIL / Dev</span>
          <h1 className="font-black text-[10vw] tracking-tighter leading-none mt-2">{t('blogTitle')}</h1>
          <p className="text-white/30 mt-4 text-sm">{t('blogSubtitle')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-32 text-white/20 text-sm uppercase tracking-widest">{t('noPost')}</div>
        ) : (
          <div className="divide-y divide-white/5">
            {posts.map((post, i) => (
              <a
                key={post.id}
                href={`${VELOG_BASE}/${post.slug}`}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col md:flex-row md:items-center gap-6 py-10 hover:bg-white/[0.02] px-4 -mx-4 transition-colors"
              >
                <span className="font-black text-5xl text-white/10 group-hover:text-white/20 transition-colors shrink-0 w-16">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {post.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 border border-white/10 text-white/20 uppercase tracking-widest">{tag}</span>
                    ))}
                    {post.released_at && (
                      <span className="text-[11px] text-white/20">{new Date(post.released_at).toLocaleDateString('ko-KR')}</span>
                    )}
                  </div>
                  <h2 className="font-black text-2xl md:text-3xl tracking-tight group-hover:text-white/80 transition-colors">{post.title}</h2>
                  {post.short_description && (
                    <p className="text-white/30 text-sm mt-2 line-clamp-2">{post.short_description}</p>
                  )}
                </div>
                <span className="text-white/20 group-hover:text-white group-hover:translate-x-2 transition-all text-xl shrink-0">↗</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
