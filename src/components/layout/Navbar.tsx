import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Swords } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onLoginClick: () => void;
}

const navLinks = [
  { label: 'News', path: '/' },
  { label: 'Download', path: '/download' },
  {
    label: 'Rankings',
    path: '/rankings',
    dropdown: [
      { label: 'Players', path: '/rankings?tab=players' },
      { label: 'Guilds', path: '/rankings?tab=guilds' },
      { label: 'Kills', path: '/rankings?tab=kills' },
    ],
  },
  { label: 'Rules', path: '/rules' },
  { label: 'Guides', path: '/guides' },
  { label: 'Support', path: '/support' },
];

export default function Navbar({ onLoginClick }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-blue-400" />
            <span className="text-lg font-bold text-white tracking-wide">Pulse MuCMS</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) =>
              link.dropdown ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <Link
                    to={link.path}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(link.path)
                        ? 'text-white bg-slate-800'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {link.label}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Link>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                      {link.dropdown.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.path}
                          className="block px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(link.path)
                      ? 'text-white bg-slate-800'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden md:block">
            {user ? (
              <Link
                to="/account"
                className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors"
              >
                Account
              </Link>
            ) : (
              <button
                onClick={onLoginClick}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors"
              >
                Login
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-700/50 px-4 pb-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                isActive(link.path)
                  ? 'text-white bg-slate-800'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-700/50 mt-2">
            {user ? (
              <Link
                to="/account"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md"
              >
                Account
              </Link>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onLoginClick();
                }}
                className="block w-full text-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
