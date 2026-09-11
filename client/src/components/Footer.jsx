import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();

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

        <div className="flex gap-6">
          <Link to="/services" className="text-gray-700 hover:text-[#FF6F4D] text-sm font-semibold transition-colors">Services</Link>
          <Link to="/blog" className="text-gray-700 hover:text-[#FF6F4D] text-sm font-semibold transition-colors">Blog</Link>
          <Link to="/book" className="text-gray-700 hover:text-[#FF6F4D] text-sm font-semibold transition-colors">Booking</Link>
          <Link to="/#location" onClick={handleLocationClick} className="text-gray-700 hover:text-[#FF6F4D] text-sm font-semibold transition-colors">Location</Link>
          <Link to="/admin" className="text-gray-700 hover:text-[#FF6F4D] text-sm font-semibold transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
