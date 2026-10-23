import React from 'react';
import { Link } from 'react-router-dom';

export default function LocationSection() {
  const address = "Hospital road, shop no. 2, Court road, near sharma and Sanjeevni clinic, Nadaun, Himachal Pradesh 177033, India";
  const mapShareLink = "https://share.google/VQtNvUSwIJh91p4eO";
  const embedLink = "https://maps.google.com/maps?q=Shree+Ganpati+ortho+and+spine+physiotherapy+clinic+Nadaun+Hamirpur&t=&z=15&ie=UTF8&iwloc=&output=embed";

  return (
    <section id="location" className="py-20 px-6 lg:px-16 bg-[#FAF6F0]">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-black text-[#221B26] mb-4">
            Find <span className="text-[#1F8A82]">Us</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Visit our clinic for specialized orthopedic and spine physiotherapy care. We're conveniently located in Nadaun.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Info Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col h-full lg:col-span-1">
            <h3 className="text-2xl font-display font-bold text-[#221B26] mb-6">Clinic Info</h3>
            
            <div className="space-y-6 flex-grow">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-[#1F8A82]/10 p-2 rounded-full text-[#1F8A82] flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[#221B26] mb-1">Address</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">{address}</p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-[#FFC857]/20 p-2 rounded-full text-[#D99A1C] flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[#221B26] mb-1">Operating Hours</h4>
                  <p className="text-gray-700 text-sm font-semibold">Mon - Sat: 10:00 AM – 5:00 PM</p>
                  <p className="text-xs text-amber-700 font-bold bg-amber-50 inline-block px-2 py-0.5 rounded-md mt-0.5">
                    Lunch: 1:00 PM – 1:30 PM
                  </p>
                  <p className="text-red-500 font-bold text-sm mt-1">Sunday: Closed</p>
                </div>
              </div>

              {/* Contact */}
              <div className="flex items-start gap-4">
                <div className="mt-1 bg-[#FF6F4D]/10 p-2 rounded-full text-[#FF6F4D] flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[#221B26] mb-1">Direct Contact</h4>
                  <p className="text-gray-600 text-sm">Nadaun Clinic Desk &amp; Appointments</p>
                </div>
              </div>

              {/* Instagram Official Social Card (Top-Level Aesthetic) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 via-pink-50/40 to-purple-50/60 border border-pink-200/60 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#fd1d1d] via-[#833ab4] to-[#fcb045] p-1.5 text-white flex items-center justify-center shadow-xs">
                      <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#221B26] text-xs">Official Instagram</h4>
                      <p className="text-[11px] text-gray-500">Therapy reels &amp; live exercises</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase bg-[#E1306C]/10 text-[#E1306C] px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
                <a
                  href="https://www.instagram.com/physiotherapist_nadaun_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <span>Follow @physiotherapist_nadaun_</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <a 
                href={mapShareLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-[#FF6F4D] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#E55A39] transition-all hover:shadow-md hover:-translate-y-0.5 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
                Get Directions
              </a>
              <Link 
                to="/book" 
                className="flex items-center justify-center gap-2 bg-[#1F8A82] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#186f68] transition-all text-sm"
              >
                Book Visit
              </Link>
            </div>
          </div>

          {/* Map iframe */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 h-96 lg:h-full lg:col-span-2 relative group">
            {/* Map Loading State (optional) */}
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center -z-10">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>

            <iframe 
              src={embedLink} 
              width="100%" 
              height="100%" 
              style={{ border: 0, minHeight: '400px' }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Shree Ganpati Ortho & Spine Physiotherapy Clinic Location"
              className="w-full h-full object-cover transition-opacity duration-300"
            ></iframe>
          </div>

        </div>
      </div>
    </section>
  );
}
