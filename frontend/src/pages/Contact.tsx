import { useState } from 'react';
import { contactApi } from '../api';
import { useLang } from '../context/LanguageContext';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { t } = useLang();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await contactApi.send(form);
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen">
      <div className="px-6 md:px-12 pt-32 pb-16 max-w-7xl mx-auto">
        <div className="border-b border-white/10 pb-12 mb-16">
          <span className="text-xs font-semibold tracking-[0.3em] text-white/30 uppercase">Get In Touch</span>
          <h1 className="font-black text-[10vw] tracking-tighter leading-none mt-2">{t('contact')}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <p className="text-white/40 text-lg leading-relaxed mb-12">{t('contactSubtitle')}</p>
            <div className="space-y-6">
              <div className="border-t border-white/10 pt-6">
                <span className="text-xs font-semibold tracking-widest text-white/20 uppercase block mb-2">Email</span>
                <a href="mailto:portfolio@imjemin.co.kr" className="text-white hover:text-white/60 transition-colors font-medium">
                  portfolio@imjemin.co.kr
                </a>
              </div>
              <div className="border-t border-white/10 pt-6">
                <span className="text-xs font-semibold tracking-widest text-white/20 uppercase block mb-2">GitHub</span>
                <a href="https://github.com/gunobo" target="_blank" rel="noreferrer"
                  className="text-white hover:text-white/60 transition-colors font-medium">
                  github.com/gunobo ↗
                </a>
              </div>
            </div>
          </div>

          <div>
            {status === 'success' ? (
              <div className="border border-white/10 p-12 flex flex-col items-center justify-center text-center gap-6 min-h-[360px]">
                {/* 체크 애니메이션 */}
                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ strokeDasharray: 30, strokeDashoffset: 0, animation: 'dash 0.5s ease forwards' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-black text-xl mb-2">{t('messageSent')}</p>
                  <p className="text-white/30 text-sm">{t('emailConfirm')}</p>
                </div>
                <button onClick={() => setStatus('idle')}
                  className="mt-4 text-xs font-semibold uppercase tracking-widest text-white/30 hover:text-white transition-colors border border-white/10 px-6 py-3 hover:border-white/30">
                  {t('sendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-0">
                {[
                  { label: 'Name', type: 'text', key: 'name' as const, placeholder: t('namePlaceholder') },
                  { label: 'Email', type: 'email', key: 'email' as const, placeholder: 'hello@example.com' },
                ].map(({ label, type, key, placeholder }) => (
                  <div key={key}
                    className="border border-white/10 border-b-0 p-6 focus-within:border-white/30 transition-colors">
                    <label className="block text-xs font-semibold tracking-widest text-white/30 uppercase mb-3">{label}</label>
                    <input type={type} required value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="w-full bg-transparent text-white placeholder-white/20 focus:outline-none text-lg font-medium"
                      placeholder={placeholder} />
                  </div>
                ))}
                <div className="border border-white/10 p-6 focus-within:border-white/30 transition-colors">
                  <label className="block text-xs font-semibold tracking-widest text-white/30 uppercase mb-3">Message</label>
                  <textarea required rows={6} value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-white/20 focus:outline-none text-lg font-medium resize-none"
                    placeholder={t('messagePlaceholder')} />
                </div>

                {status === 'error' && (
                  <p className="text-red-400 text-xs uppercase tracking-widest pt-4 flex items-center gap-2">
                    <span>✕</span> {t('sendError')}
                  </p>
                )}

                <button type="submit" disabled={status === 'loading'}
                  className="mt-6 w-full py-5 bg-white text-black text-sm font-black uppercase tracking-widest hover:bg-white/80 disabled:opacity-30 transition-all duration-300 relative overflow-hidden">
                  {status === 'loading' ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      {t('sending')}
                    </span>
                  ) : (
                    t('sendMessage')
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
