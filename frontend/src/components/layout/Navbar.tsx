import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { lang, toggle, t } = useLang();

  const links = [
    { to: '/', label: t('home') },
    { to: '/projects', label: t('projects') },
    { to: '/blog', label: t('blog') },
    { to: '/contact', label: t('contact') },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* 배경 — 메뉴 열리면 불투명하게 */}
      <div className={`absolute inset-x-0 top-0 transition-all duration-300 ${open ? 'bg-[#0a0a0a]' : 'bg-transparent'}`}
        style={{ height: open ? '100dvh' : '64px' }} />

      <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-black text-lg text-white tracking-tighter uppercase mix-blend-difference">
          imjemin
        </Link>

        {/* 데스크탑 메뉴 */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0 mix-blend-difference">
          {links.map(({ to, label }) => (
            <li key={to}>
              <Link to={to}
                className={`text-xs font-semibold tracking-widest uppercase transition-opacity ${
                  pathname === to ? 'text-white opacity-100' : 'text-white opacity-50 hover:opacity-100'
                }`}>
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button onClick={toggle}
              className="text-xs font-semibold tracking-widest uppercase text-white opacity-40 hover:opacity-100 transition-opacity">
              {lang === 'ko' ? 'EN' : 'KO'}
            </button>
          </li>
        </ul>

        {/* 햄버거 버튼 */}
        <button
          className="relative md:hidden w-8 h-8 flex flex-col justify-center items-center gap-0 z-10"
          onClick={() => setOpen(!open)}
          aria-label="메뉴"
        >
          <span className={`block w-6 h-[1.5px] bg-white transition-all duration-300 origin-center ${
            open ? 'rotate-45 translate-y-[0px]' : '-translate-y-[4px]'
          }`} />
          <span className={`block w-6 h-[1.5px] bg-white transition-all duration-300 ${
            open ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
          }`} />
          <span className={`block w-6 h-[1.5px] bg-white transition-all duration-300 origin-center ${
            open ? '-rotate-45 -translate-y-[0px]' : 'translate-y-[4px]'
          }`} />
        </button>
      </div>

      {/* 모바일 메뉴 */}
      <div className={`relative md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
        open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-8 pt-4 pb-12 flex flex-col gap-0">
          {links.map(({ to, label }, i) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`text-white font-black uppercase tracking-tight border-b border-white/10 py-5 transition-all duration-300 ${
                pathname === to ? 'text-4xl opacity-100' : 'text-3xl opacity-50 hover:opacity-100'
              }`}
              style={{ transitionDelay: open ? `${i * 50}ms` : '0ms' }}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={() => { toggle(); setOpen(false); }}
            className="text-white/30 text-sm font-semibold uppercase tracking-widest text-left pt-6 hover:text-white/60 transition-colors">
            {lang === 'ko' ? 'English' : '한국어'}
          </button>
        </div>
      </div>
    </nav>
  );
}
