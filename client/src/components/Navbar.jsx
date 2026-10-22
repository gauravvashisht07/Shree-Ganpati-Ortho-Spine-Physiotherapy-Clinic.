import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const links = [
    { to: '/services', label: 'Services' },
    { to: '/blog', label: 'Blog & Videos' },
    { to: '/book', label: 'Booking' },
    { to: '/#location', label: 'Location' },
    { to: '/my-appointments', label: 'My Appointments' },
    { to: isAuthenticated ? '/admin' : '/admin/login', label: 'Admin' },
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
    <header className="sticky top-0 z-50 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-gray-100">
      {/* Top Clinic Hours & Social Utility Strip */}
      <div className="bg-[#1F8A82] text-white text-[11px] sm:text-xs py-1.5 px-3 sm:px-6 lg:px-16 border-b border-[#186f68]/40 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-2">
          {/* Clinic Timings */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap font-medium">
            <span className="inline-flex items-center gap-1.5 font-bold text-white tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Mon - Sat: 10:00 AM – 5:00 PM
            </span>
            <span className="text-teal-200/70 hidden sm:inline">•</span>
            <span className="bg-white/15 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold text-teal-50">
              Lunch: 1:00 PM – 1:30 PM
            </span>
            <span className="text-teal-200/70 hidden md:inline">•</span>
            <span className="text-amber-200 font-bold hidden md:inline">Sunday: Closed</span>
          </div>

          {/* Social Quick-Access */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/physiotherapist_nadaun?exln=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white/95 hover:text-white font-semibold transition-all group text-[11px]"
              title="Official Instagram Channel"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#fd1d1d] via-[#833ab4] to-[#fcb045] p-0.5 flex items-center justify-center shrink-0">
                <svg className="w-full h-full fill-white" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </span>
              <span>@physiotherapist_nadaun</span>
              <span className="text-teal-200 group-hover:translate-x-0.5 transition-transform text-[10px]">↗</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="px-3 sm:px-6 lg:px-16 py-3 sm:py-3.5">
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
                Ortho &amp; Spine Clinic Physiotherapy Clinic
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
            {/* Top-Level Instagram Pill Button */}
            <a
              href="https://www.instagram.com/physiotherapist_nadaun?exln=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full bg-white hover:bg-gradient-to-r hover:from-[#fd1d1d] hover:via-[#833ab4] hover:to-[#fcb045] border border-gray-200/90 hover:border-transparent text-[#221B26] hover:text-white transition-all duration-300 shadow-2xs hover:shadow-md hover:-translate-y-0.5"
              title="Follow @physiotherapist_nadaun on Instagram"
              aria-label="Instagram Profile"
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#fd1d1d] via-[#833ab4] to-[#fcb045] text-white p-1 shadow-xs group-hover:scale-110 group-hover:bg-none transition-transform">
                <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </span>
              <span className="hidden sm:inline font-bold text-xs tracking-tight">
                @physiotherapist_nadaun
              </span>
              <span className="sm:hidden font-bold text-xs">
                IG
              </span>
            </a>

            <Link
              to="/book"
              className="bg-[#FF6F4D] text-white font-bold py-1.5 px-3.5 sm:py-2.5 sm:px-6 rounded-full hover:bg-[#E55A39] transition-all text-xs sm:text-sm min-h-[38px] sm:min-h-[42px] flex items-center shadow-xs hover:shadow-md hover:-translate-y-0.5"
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
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-[#FAF6F0] border-t border-gray-100 px-4 sm:px-6 py-4 space-y-2.5 animate-in fade-in slide-in-from-top-2 shadow-lg">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => handleLinkClick(to)}
              className="block text-[#221B26] font-bold py-2.5 px-3 min-h-[44px] flex items-center rounded-xl border-b border-gray-100/60 last:border-0 hover:bg-white hover:text-[#FF6F4D] transition-colors"
            >
              {label}
            </Link>
          ))}
          
          {/* Featured Mobile Instagram Showcase Card */}
          <a
            href="https://www.instagram.com/physiotherapist_nadaun?exln=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            className="group block p-3.5 rounded-2xl bg-gradient-to-br from-white via-pink-50/50 to-amber-50/50 border border-pink-200/70 hover:border-pink-300 transition-all shadow-xs"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#fd1d1d] via-[#833ab4] to-[#fcb045] text-white flex items-center justify-center p-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-[#221B26] group-hover:text-[#E1306C] transition-colors truncate">
                    @physiotherapist_nadaun
                  </span>
                  <span className="text-[10px] bg-gradient-to-r from-red-500 to-pink-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase">
                    IG
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  Watch recovery exercises &amp; therapy reels ↗
                </p>
              </div>
            </div>
          </a>
        </div>
      )}
    </header>
  );
}
