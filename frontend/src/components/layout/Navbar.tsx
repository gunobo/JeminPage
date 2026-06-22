import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-black text-lg text-white tracking-tighter uppercase">
          imjemin
        </Link>
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {links.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`text-xs font-semibold tracking-widest uppercase transition-opacity ${
                  pathname === to ? 'text-white opacity-100' : 'text-white opacity-50 hover:opacity-100'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/admin"
              className="text-xs font-semibold tracking-widest uppercase text-white opacity-50 hover:opacity-100 transition-opacity"
            >
              Admin
            </Link>
          </li>
        </ul>
        <button
          className="md:hidden text-white opacity-70 hover:opacity-100"
          onClick={() => setOpen(!open)}
        >
          <div className="flex flex-col gap-1.5">
            <span className={`block w-6 h-0.5 bg-white transition-transform ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-transform ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-black/95 backdrop-blur px-6 py-8 flex flex-col gap-6">
          {links.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}
              className="text-white text-2xl font-black uppercase tracking-tight">
              {label}
            </Link>
          ))}
          <Link to="/admin" onClick={() => setOpen(false)}
            className="text-white/40 text-sm font-semibold uppercase tracking-widest">
            Admin
          </Link>
        </div>
      )}
    </nav>
  );
}
