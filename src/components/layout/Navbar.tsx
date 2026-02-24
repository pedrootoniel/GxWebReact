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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-[#8b5c28]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#b8862f] to-[#8b5c28] flex items-center justify-center shadow-lg shadow-[#b8862f]/20 group-hover:shadow-[#b8862f]/40 transition-shadow">
              <Swords className="w-4 h-4 text-[#0a0a0f]" />
            </div>
            <span className="font-cinzel text-lg font-bold text-[#c9a44a] tracking-wider">PULSE</span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
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
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium tracking-wide transition-all duration-200 ${
                      isActive(link.path)
                        ? 'text-[#c9a44a]'
                        : 'text-[#8a7e6a] hover:text-[#d4af52]'
                    }`}
                  >
                    {link.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </Link>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-44 card-dark shadow-xl shadow-black/40 overflow-hidden animate-fade-in">
                      {link.dropdown.map((sub) => (
                        <Link
                          key={sub.label}
                          to={sub.path}
                          className="block px-4 py-2.5 text-sm text-[#8a7e6a] hover:text-[#c9a44a] hover:bg-[#3d2e1a]/20 transition-colors"
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
                  className={`px-3 py-2 text-sm font-medium tracking-wide transition-all duration-200 ${
                    isActive(link.path)
                      ? 'text-[#c9a44a]'
                      : 'text-[#8a7e6a] hover:text-[#d4af52]'
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
                className="btn-gold px-5 py-1.5 text-sm rounded-lg tracking-wide"
              >
                Account
              </Link>
            ) : (
              <button
                onClick={onLoginClick}
                className="btn-gold px-5 py-1.5 text-sm rounded-lg tracking-wide"
              >
                Login
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[#8a7e6a] hover:text-[#c9a44a] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0f] border-t border-[#8b5c28]/15 px-4 pb-4 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 text-sm font-medium tracking-wide transition-colors ${
                isActive(link.path)
                  ? 'text-[#c9a44a]'
                  : 'text-[#8a7e6a] hover:text-[#d4af52]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#8b5c28]/15 mt-3">
            {user ? (
              <Link
                to="/account"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center btn-gold px-4 py-2 text-sm rounded-lg"
              >
                Account
              </Link>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onLoginClick();
                }}
                className="block w-full text-center btn-gold px-4 py-2 text-sm rounded-lg"
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
