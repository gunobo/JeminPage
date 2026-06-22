import { createContext, useContext, useState } from 'react';

type Lang = 'ko' | 'en';

const translations = {
  ko: {
    // Nav
    home: '홈', projects: 'Projects', blog: 'Blog', contact: '연락',
    // Hero
    about: '소개', whoIAm: '나는\n누구인가',
    selectedProjects: '주요 프로젝트', allProjects: '전체 보기 →',
    skills: '기술', expertise: '전문성',
    process: '프로세스', howIWork: '작업 방식',
    letsTalk: '함께 해봐요', getInTouch: '연락하기 →',
    visitors: '방문자', scroll: '스크롤', downloadCV: 'CV 다운로드',
    viewProject: '프로젝트 보기 →', github: 'GitHub', live: '라이브',
    back: '← 뒤로', techStack: '기술 스택', featured: '추천',
    // Process steps
    researchDesc: '문제를 정의하고 사용자 요구사항을 분석합니다.',
    designDesc: 'UI/UX 설계와 프로토타이핑을 통해 최적의 경험을 설계합니다.',
    developDesc: '최신 기술 스택으로 안정적이고 빠른 서비스를 구현합니다.',
    deployDesc: 'Docker와 클라우드 인프라로 안정적인 배포와 운영을 합니다.',
    // Blog
    blogTitle: 'Blog', blogSubtitle: '개발 경험과 배운 것들을 기록합니다.',
    readMore: '읽기 →', noPost: '아직 글이 없습니다.',
    // Contact
    contactSubtitle: '궁금한 점이나 협업 제안이 있으시면 편하게 연락 주세요.',
    namePlaceholder: '홍길동', messagePlaceholder: '메시지를 입력해주세요...',
    sending: '전송 중...', sendMessage: '보내기 →', sendAnother: '다시 보내기 →',
    messageSent: '메시지가 전송되었습니다.',
    emailConfirm: '추후 연락은 작성하신 이메일로 확인해주세요!',
    sendError: '전송 실패. 다시 시도해주세요.',
    // Project
    noProjects: '아직 프로젝트가 없습니다.',
    // Goals
    goals: '올해의 목표', goalsYear: '2026',
    goalDone: '완료 ✓', goalPending: '—',
  },
  en: {
    home: 'Home', projects: 'Projects', blog: 'Blog', contact: 'Contact',
    about: 'About', whoIAm: 'Who\nI Am',
    selectedProjects: 'Selected Projects', allProjects: 'All Projects →',
    skills: 'Skills', expertise: 'Expertise',
    process: 'Process', howIWork: 'How I Work',
    letsTalk: "Let's Talk", getInTouch: 'Get In Touch →',
    visitors: 'Visitors', scroll: 'Scroll', downloadCV: 'Download CV',
    viewProject: 'View Project →', github: 'GitHub', live: 'Live',
    back: '← Back', techStack: 'Tech Stack', featured: 'Featured',
    researchDesc: 'Define the problem and analyze user requirements.',
    designDesc: 'Design optimal experiences through UI/UX and prototyping.',
    developDesc: 'Build stable and fast services with modern tech stacks.',
    deployDesc: 'Deploy and operate reliably with Docker and cloud infrastructure.',
    blogTitle: 'Blog', blogSubtitle: 'Thoughts on development, design, and things I learn.',
    readMore: 'Read →', noPost: 'No posts yet.',
    contactSubtitle: 'Have a question or collaboration proposal? Feel free to reach out.',
    namePlaceholder: 'John Doe', messagePlaceholder: 'Write your message here...',
    sending: 'Sending...', sendMessage: 'Send Message →', sendAnother: 'Send Another →',
    messageSent: 'Message sent!',
    emailConfirm: "I'll get back to you via the email you provided.",
    sendError: 'Failed to send. Please try again.',
    noProjects: 'No projects yet.',
    goals: 'Goals', goalsYear: '2026',
    goalDone: 'Done ✓', goalPending: '—',
  },
};

type TranslationKey = keyof typeof translations.ko;

interface LangCtx {
  lang: Lang;
  toggle: () => void;
  t: (key: TranslationKey) => string;
}

const Ctx = createContext<LangCtx>({
  lang: 'ko', toggle: () => {}, t: (k) => translations.ko[k],
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
