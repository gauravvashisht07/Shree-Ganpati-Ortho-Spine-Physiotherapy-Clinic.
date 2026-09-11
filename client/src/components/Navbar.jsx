import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/services', label: 'Services' },
    { to: '/blog', label: 'Blog & Videos' },
    { to: '/book', label: 'Booking' },
    { to: '/#location', label: 'Location' },
    { to: '/my-appointments', label: 'My Appointments' },
    { to: '/admin', label: 'Admin' },
  ];

  const handleLinkClick = (to) => {
    setMenuOpen(false);
    if (to === '/#location') {
      if (location.pathname === '/') {
        const el = document.getElementById('location');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FAF6F0]/95 backdrop-blur-sm border-b border-gray-100 px-3 sm:px-6 lg:px-16 py-3 sm:py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">

        {/* Logo — always links to homepage */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
          <img
            src="/LOGO.jpeg"
            alt="Shree Ganpati Ortho & Spine Physiotherapy Clinic Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-full border border-[#1F8A82] shadow-xs shrink-0"
          />
          <div className="flex flex-col text-left min-w-0">
            <span className="brand-title text-sm sm:text-base md:text-lg leading-tight text-[#221B26] font-black truncate">
              Shree Ganpati
            </span>
            <span className="brand-subtitle text-[10px] sm:text-xs tracking-wide text-[#1F8A82] font-bold truncate">
              Ortho &amp; Spine Clinic
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => handleLinkClick(to)}
              className={`text-sm font-medium transition-colors hover:text-[#FF6F4D] ${
                location.pathname === to ? 'text-[#FF6F4D] font-bold' : 'text-gray-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/book"
            className="bg-[#FF6F4D] text-white font-bold py-1.5 px-3 sm:py-2.5 sm:px-6 rounded-full hover:bg-[#E55A39] transition-colors text-xs sm:text-sm min-h-[38px] sm:min-h-[44px] flex items-center shadow-xs"
          >
            Book Now
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden min-h-[38px] min-w-[38px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center text-[#221B26] text-2xl p-1 rounded-lg hover:bg-gray-100/60 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#FAF6F0] border-t border-gray-100 px-4 sm:px-6 py-4 space-y-2 animate-in fade-in slide-in-from-top-2">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => handleLinkClick(to)}
              className="block text-[#221B26] font-bold py-2.5 px-2 min-h-[44px] flex items-center rounded-lg border-b border-gray-100/60 last:border-0 hover:bg-white/60 hover:text-[#FF6F4D] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
