import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl font-bold text-[#1a1a2e] tracking-tight">
          imjemin
        </Link>
        <ul className="flex items-center gap-8 list-none m-0 p-0">
          {links.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`text-sm font-medium transition-colors ${
                  pathname === to ? 'text-[#e94560]' : 'text-gray-600 hover:text-[#1a1a2e]'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/admin"
              className="text-sm font-medium px-4 py-1.5 border border-[#1a1a2e] text-[#1a1a2e] hover:bg-[#1a1a2e] hover:text-white transition-colors rounded"
            >
              Admin
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
