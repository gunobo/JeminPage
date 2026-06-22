import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Splash from './components/ui/Splash';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import Admin from './pages/Admin';

export default function App() {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('splashed'));

  useEffect(() => {
    if (!showSplash) sessionStorage.setItem('splashed', '1');
  }, [showSplash]);

  return (
    <LanguageProvider>
      {showSplash && <Splash onDone={() => { sessionStorage.setItem('splashed', '1'); setShowSplash(false); }} />}
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}
