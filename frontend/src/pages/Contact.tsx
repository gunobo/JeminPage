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
    <main className="pt-16">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-[#e94560] uppercase mb-2">Contact</p>
          <h1 className="font-serif text-4xl font-bold text-[#1a1a2e]">연락하기</h1>
          <p className="text-gray-600 mt-4">
            궁금한 점이나 협업 제안이 있으시면 편하게 연락 주세요.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center py-12 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">메시지가 전송되었습니다. 감사합니다!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-2">이름</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e] transition-colors"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-2">이메일</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e] transition-colors"
                placeholder="hello@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-2">메시지</label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-[#1a1a2e] transition-colors resize-none"
                placeholder="메시지를 입력해주세요..."
              />
            </div>
            {status === 'error' && (
              <p className="text-red-500 text-sm">전송에 실패했습니다. 다시 시도해주세요.</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 bg-[#1a1a2e] text-white font-medium rounded hover:bg-[#0f3460] disabled:opacity-50 transition-colors"
            >
              {status === 'loading' ? '전송 중...' : '보내기'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
