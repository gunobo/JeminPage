import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Splash from './components/ui/Splash';
import ScrollProgress from './components/ui/ScrollProgress';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import Toaster from './components/ui/Toast';

// 관리자 화면(+ 배경 제거용 onnx 런타임)은 방문자 번들에서 분리
const Admin = lazy(() => import('./pages/Admin'));

function PageSpinner() {
  return (
    <main className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
    </main>
  );
}

function Layout() {
  const { pathname } = useLocation();
  const isAdmin = pathname === '/admin';

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      <ScrollProgress />
      {!isAdmin && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Suspense fallback={<PageSpinner />}><Admin /></Suspense>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      {!isAdmin && <Footer />}
      <Toaster />
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splashed'));

  useEffect(() => {
    if (!showSplash) sessionStorage.setItem('splashed', '1');
  }, [showSplash]);

  return (
    <LanguageProvider>
      {showSplash && <Splash onDone={() => { sessionStorage.setItem('splashed', '1'); setShowSplash(false); }} />}
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </LanguageProvider>
  );
}
