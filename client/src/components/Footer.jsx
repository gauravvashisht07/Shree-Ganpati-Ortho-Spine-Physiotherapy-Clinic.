import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const handleLocationClick = () => {
    if (location.pathname === '/') {
      const el = document.getElementById('location');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-[#FAF6F0] border-t border-gray-200 px-6 lg:px-16 py-12 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/LOGO.jpeg" 
            alt="Shree Ganpati Ortho & Spine Physiotherapy Clinic Logo" 
            className="w-10 h-10 object-contain rounded-full border border-[#1F8A82] shadow-xs" 
          />
          <div className="flex flex-col text-left">
            <span className="brand-title text-base leading-tight text-[#221B26] font-black">
              Shree Ganpati
            </span>
            <span className="brand-subtitle text-xs font-bold text-[#1F8A82]">
              Ortho &amp; Spine Physiotherapy Clinic
            </span>
          </div>
        </Link>

        <p className="text-gray-600 text-sm text-center md:text-left font-medium">
          © {new Date().getFullYear()} Shree Ganpati Ortho &amp; Spine Physiotherapy Clinic. All rights reserved.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a
            href="https://www.instagram.com/physiotherapist_nadaun?exln=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white text-xs font-bold shadow-xs hover:shadow-md hover:scale-105 transition-all"
            title="Follow @physiotherapist_nadaun on Instagram"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span>Follow @physiotherapist_nadaun</span>
            <span className="text-white/80">↗</span>
          </a>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link to="/services" className="text-gray-700 hover:text-[#FF6F4D] text-sm font-semibold transition-colors">Services</Link>
            <Link to="/blog" className="text-gray-700 hover:text-[#FF6F4D] text-sm font-semibold transition-colors">Blog</Link>
            <Link to="/book" className="text-gray-700 hover:text-[#FF6F4D] text-sm font-semibold transition-colors">Booking</Link>
            <Link to="/#location" onClick={handleLocationClick} className="text-gray-700 hover:text-[#FF6F4D] text-sm font-semibold transition-colors">Location</Link>
            <Link to={isAuthenticated ? '/admin' : '/admin/login'} className="text-gray-700 hover:text-[#FF6F4D] text-sm font-semibold transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
