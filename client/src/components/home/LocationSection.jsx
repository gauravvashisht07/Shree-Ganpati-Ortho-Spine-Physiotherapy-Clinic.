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
                  <p className="text-gray-600 text-sm">Mon - Sat: 10:30 AM - 5:30 PM</p>
                  <p className="text-red-500 font-bold text-sm">Sunday: Closed</p>
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
