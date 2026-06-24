import { useState, useRef } from 'react';
import { contactApi } from '../api';
import { useLang } from '../context/LanguageContext';

type Step = 'form' | 'otp' | 'done';

export default function Contact() {
  const { t } = useLang();
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifiedToken, setVerifiedToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(v => {
        if (v <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await contactApi.sendOtp(email);
      setStep('otp');
      startCooldown();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err?.response?.data?.detail || '이메일 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await contactApi.sendOtp(email);
      startCooldown();
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError('재발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('6자리 코드를 모두 입력해주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      const { verified_token } = await contactApi.verifyOtp(email, code);
      setVerifiedToken(verified_token);
      setStep('form');
    } catch (err: any) {
      setError(err?.response?.data?.detail || '인증 코드가 올바르지 않습니다.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedToken) { setError('먼저 이메일 인증을 완료해주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      await contactApi.send({ name, email, message, verified_token: verifiedToken });
      setStep('done');
    } catch (err: any) {
      setError(err?.response?.data?.detail || '전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('form'); setName(''); setEmail(''); setMessage('');
    setOtp(['', '', '', '', '', '']); setVerifiedToken(''); setError('');
  };

  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen">
      <div className="px-6 md:px-12 pt-32 pb-16 max-w-7xl mx-auto">
        <div className="border-b border-white/10 pb-12 mb-16">
          <span className="text-xs font-semibold tracking-[0.3em] text-white/30 uppercase">Get In Touch</span>
          <h1 className="font-black text-[10vw] tracking-tighter leading-none mt-2">{t('contact')}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* 좌측 정보 */}
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

          {/* 우측 폼 */}
          <div>
            {step === 'done' ? (
              <div className="border border-white/10 p-12 flex flex-col items-center justify-center text-center gap-6 min-h-[360px]">
                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-black text-xl mb-2">{t('messageSent')}</p>
                  <p className="text-white/30 text-sm">{t('emailConfirm')}</p>
                </div>
                <button onClick={reset}
                  className="mt-4 text-xs font-semibold uppercase tracking-widest text-white/30 hover:text-white transition-colors border border-white/10 px-6 py-3 hover:border-white/30">
                  {t('sendAnother')}
                </button>
              </div>

            ) : step === 'otp' ? (
              /* OTP 입력 단계 */
              <form onSubmit={handleVerifyOtp} className="space-y-0">
                <div className="border border-white/10 border-b-0 p-6">
                  <p className="text-xs font-semibold tracking-widest text-white/30 uppercase mb-1">인증 코드 입력</p>
                  <p className="text-white/40 text-sm mt-2">
                    <span className="text-white font-medium">{email}</span>로 발송된<br />6자리 코드를 입력해주세요.
                  </p>
                </div>
                <div className="border border-white/10 border-b-0 p-6">
                  <div className="flex gap-3 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className="w-12 h-14 text-center text-2xl font-black bg-transparent border border-white/10 text-white focus:outline-none focus:border-white/40 transition-colors"
                      />
                    ))}
                  </div>
                </div>
                <div className="border border-white/10 p-4 flex items-center justify-between">
                  <button type="button" onClick={() => { setStep('form'); setOtp(['','','','','','']); setError(''); }}
                    className="text-xs text-white/30 hover:text-white transition-colors uppercase tracking-widest">
                    ← 이메일 변경
                  </button>
                  <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                    className="text-xs text-white/30 hover:text-white disabled:opacity-30 transition-colors uppercase tracking-widest">
                    {resendCooldown > 0 ? `재발송 (${resendCooldown}s)` : '코드 재발송'}
                  </button>
                </div>
                {error && <p className="text-red-400 text-xs uppercase tracking-widest pt-4 flex items-center gap-2"><span>✕</span> {error}</p>}
                <button type="submit" disabled={loading || otp.join('').length < 6}
                  className="mt-6 w-full py-5 bg-white text-black text-sm font-black uppercase tracking-widest hover:bg-white/80 disabled:opacity-30 transition-all duration-300">
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      확인 중...
                    </span>
                  ) : '인증 확인'}
                </button>
              </form>

            ) : (
              /* 메인 폼 단계 */
              <form onSubmit={verifiedToken ? handleSubmit : handleSendOtp} className="space-y-0">
                {[
                  { label: 'Name', type: 'text', value: name, onChange: setName, placeholder: t('namePlaceholder') },
                  { label: 'Email', type: 'email', value: email, onChange: setEmail, placeholder: 'hello@example.com' },
                ].map(({ label, type, value, onChange, placeholder }) => (
                  <div key={label} className="border border-white/10 border-b-0 p-6 focus-within:border-white/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-semibold tracking-widest text-white/30 uppercase">{label}</label>
                      {label === 'Email' && verifiedToken && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-400/70 flex items-center gap-1">
                          ✓ 인증됨
                        </span>
                      )}
                    </div>
                    <input type={type} required value={value}
                      onChange={e => { onChange(e.target.value); if (label === 'Email') setVerifiedToken(''); }}
                      disabled={label === 'Email' && !!verifiedToken}
                      className="w-full bg-transparent text-white placeholder-white/20 focus:outline-none text-lg font-medium disabled:opacity-50"
                      placeholder={placeholder} />
                  </div>
                ))}
                <div className="border border-white/10 p-6 focus-within:border-white/30 transition-colors">
                  <label className="block text-xs font-semibold tracking-widest text-white/30 uppercase mb-3">Message</label>
                  <textarea required rows={6} value={message}
                    onChange={e => setMessage(e.target.value)}
                    className="w-full bg-transparent text-white placeholder-white/20 focus:outline-none text-lg font-medium resize-none"
                    placeholder={t('messagePlaceholder')} />
                </div>

                {error && <p className="text-red-400 text-xs uppercase tracking-widest pt-4 flex items-center gap-2"><span>✕</span> {error}</p>}

                <button type="submit" disabled={loading}
                  className="mt-6 w-full py-5 bg-white text-black text-sm font-black uppercase tracking-widest hover:bg-white/80 disabled:opacity-30 transition-all duration-300">
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      {verifiedToken ? t('sending') : '발송 중...'}
                    </span>
                  ) : verifiedToken ? t('sendMessage') : '이메일 인증 후 전송'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
