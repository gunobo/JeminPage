import { createContext, useContext, useState } from 'react';

type Lang = 'ko' | 'en';

const translations = {
  ko: {
    home: '홈',
    projects: 'Projects',
    blog: 'Blog',
    contact: '연락',
    about: 'About',
    whoIAm: '나는\n누구인가',
    selectedProjects: '주요 프로젝트',
    allProjects: '전체 보기 →',
    skills: '기술',
    expertise: '전문성',
    process: '프로세스',
    howIWork: '작업 방식',
    letsTalk: '함께 해봐요',
    getInTouch: '연락하기 →',
    visitors: '방문자',
    scroll: '스크롤',
    downloadCV: 'CV 다운로드',
    viewProject: '프로젝트 보기 →',
    github: 'GitHub',
    live: '라이브',
    back: '← 뒤로',
    techStack: '기술 스택',
    blogTitle: 'Blog',
    blogSubtitle: '개발 경험과 배운 것들을 기록합니다.',
    readMore: '읽기 →',
    noPost: '아직 글이 없습니다.',
    featured: '추천',
    messageSent: '메시지가 전송되었습니다.',
    emailConfirm: '추후 연락은 작성하신 이메일로 확인해주세요!',
  },
  en: {
    home: 'Home',
    projects: 'Projects',
    blog: 'Blog',
    contact: 'Contact',
    about: 'About',
    whoIAm: 'Who\nI Am',
    selectedProjects: 'Selected Projects',
    allProjects: 'All Projects →',
    skills: 'Skills',
    expertise: 'Expertise',
    process: 'Process',
    howIWork: 'How I Work',
    letsTalk: "Let's Talk",
    getInTouch: 'Get In Touch →',
    visitors: 'Visitors',
    scroll: 'Scroll',
    downloadCV: 'Download CV',
    viewProject: 'View Project →',
    github: 'GitHub',
    live: 'Live',
    back: '← Back',
    techStack: 'Tech Stack',
    blogTitle: 'Blog',
    blogSubtitle: 'Thoughts on development, design, and things I learn.',
    readMore: 'Read →',
    noPost: 'No posts yet.',
    featured: 'Featured',
    messageSent: 'Message sent!',
    emailConfirm: 'I\'ll get back to you via the email you provided.',
  },
};

type TranslationKey = keyof typeof translations.ko;

interface LangCtx {
  lang: Lang;
  toggle: () => void;
  t: (key: TranslationKey) => string;
}

const Ctx = createContext<LangCtx>({
  lang: 'ko',
  toggle: () => {},
  t: (k) => translations.ko[k],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() =>
    (localStorage.getItem('lang') as Lang) || 'ko'
  );

  const toggle = () => {
    const next = lang === 'ko' ? 'en' : 'ko';
    setLang(next);
    localStorage.setItem('lang', next);
  };

  const t = (key: TranslationKey) => translations[lang][key];

  return <Ctx.Provider value={{ lang, toggle, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
