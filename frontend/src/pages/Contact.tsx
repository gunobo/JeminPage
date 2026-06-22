import { useState } from 'react';
import { contactApi } from '../api';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
          <h1 className="font-black text-[10vw] tracking-tighter leading-none mt-2">Contact</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <p className="text-white/40 text-lg leading-relaxed mb-12">
              궁금한 점이나 협업 제안이 있으시면<br />편하게 연락 주세요.
            </p>
            <div className="space-y-6">
              <div className="border-t border-white/10 pt-6">
                <span className="text-xs font-semibold tracking-widest text-white/20 uppercase block mb-2">Email</span>
                <a href="mailto:startea0716@gmail.com" className="text-white hover:text-white/60 transition-colors font-medium">
                  startea0716@gmail.com
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
              <div className="border border-white/10 p-12 text-center">
                <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Sent!</p>
                <p className="text-white font-semibold">메시지가 전송되었습니다.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-8 text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Send Another →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-0">
                <div className="border border-white/10 border-b-0 p-6">
                  <label className="block text-xs font-semibold tracking-widest text-white/30 uppercase mb-3">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-white/20 focus:outline-none text-lg font-medium"
                    placeholder="홍길동"
                  />
                </div>
                <div className="border border-white/10 border-b-0 p-6">
                  <label className="block text-xs font-semibold tracking-widest text-white/30 uppercase mb-3">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-white/20 focus:outline-none text-lg font-medium"
                    placeholder="hello@example.com"
                  />
                </div>
                <div className="border border-white/10 p-6">
                  <label className="block text-xs font-semibold tracking-widest text-white/30 uppercase mb-3">Message</label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-transparent text-white placeholder-white/20 focus:outline-none text-lg font-medium resize-none"
                    placeholder="메시지를 입력해주세요..."
                  />
                </div>
                {status === 'error' && (
                  <p className="text-red-400 text-xs uppercase tracking-widest pt-4">전송 실패. 다시 시도해주세요.</p>
                )}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="mt-6 w-full py-5 bg-white text-black text-sm font-black uppercase tracking-widest hover:bg-white/80 disabled:opacity-30 transition-colors"
                >
                  {status === 'loading' ? 'Sending...' : 'Send Message →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
