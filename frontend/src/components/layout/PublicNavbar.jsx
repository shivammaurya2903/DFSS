import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Cloud, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PublicNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Security', path: '/security' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'FAQ', path: '/faq' },
  ];

  return (
    <nav className="bg-white border-b border-[#E7E9EF] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Cloud className="h-8 w-8 text-[#8178F2]" />
              <span className="text-xl font-bold text-[#17181C]">DFSS</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-[#8178F2]'
                    : 'text-[#6F737D] hover:text-[#17181C]'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-[#6F737D] hover:text-[#17181C]">
                  Dashboard
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 text-sm font-medium focus:outline-none">
                    <div className="w-8 h-8 rounded-full bg-[#f4f2ff] text-[#8178F2] flex items-center justify-center font-bold text-sm border border-purple-100">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E7E9EF] rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                     <Link to="/profile" className="block px-4 py-2 text-sm text-[#6F737D] hover:bg-[#F5F7FB]">Profile</Link>
                     <Link to="/settings" className="block px-4 py-2 text-sm text-[#6F737D] hover:bg-[#F5F7FB]">Settings</Link>
                     <div className="border-t border-[#E7E9EF] my-1"></div>
                     <button onClick={() => { logout(); navigate('/'); }} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#6F737D] hover:text-[#17181C]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#8178F2] hover:bg-[#6c63e6] rounded-md transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#6F737D] hover:text-[#17181C] p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-[#E7E9EF]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="block px-3 py-2 text-base font-medium text-[#6F737D] hover:text-[#17181C] hover:bg-[#F5F7FB] rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-[#E7E9EF] pt-4 pb-2 mt-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-base font-medium text-[#6F737D] hover:text-[#17181C] hover:bg-[#F5F7FB] rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-base font-medium text-[#6F737D] hover:text-[#17181C] hover:bg-[#F5F7FB] rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => { setIsOpen(false); logout(); navigate('/'); }}
                    className="w-full text-left block px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-base font-medium text-[#6F737D] hover:text-[#17181C] hover:bg-[#F5F7FB] rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 mt-2 text-base font-medium text-white bg-[#8178F2] hover:bg-[#6c63e6] rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default PublicNavbar;
