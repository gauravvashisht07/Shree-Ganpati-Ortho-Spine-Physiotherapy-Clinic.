import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const regions = [
  { 
    id: 'neck', 
    name: 'Cervical & Neck', 
    shortName: 'Neck',
    tag: 'Postural & Whiplash',
    cx: 50, 
    cy: 16, 
    desc: 'Targeted relief for cervical spondylosis, neck stiffness, nerve compression, and tech-neck posture.',
    service: 'Postural Assessment',
    stats: '95% Mobility Restored'
  },
  { 
    id: 'shoulder', 
    name: 'Shoulder & Rotator Cuff', 
    shortName: 'Shoulder',
    tag: 'Joint Mobilization',
    cx: 26, 
    cy: 28, 
    desc: 'Comprehensive rehab for frozen shoulder, impingement syndrome, rotator cuff tears, and sports injuries.',
    service: 'Sports Rehab',
    stats: 'Fast Return to Activity'
  },
  { 
    id: 'back', 
    name: 'Lumbar Spine & Lower Back', 
    shortName: 'Lower Back',
    tag: 'Spine Specialization',
    cx: 50, 
    cy: 50, 
    desc: 'Advanced spinal decompression, sciatica management, herniated disc care, and core stabilization therapy.',
    service: 'Spinal Mobility Clinic',
    stats: 'Core & Disc Decompression'
  },
  { 
    id: 'knee', 
    name: 'Knee & ACL Recovery', 
    shortName: 'Knee Joint',
    tag: 'Orthopedic Rehab',
    cx: 37, 
    cy: 74, 
    desc: 'ACL/PCL post-op rehab, meniscus care, osteoarthritis management, and biomechanical gait training.',
    service: 'Joint & Movement Therapy',
    stats: 'Joint Strengthening'
  },
  { 
    id: 'ankle', 
    name: 'Ankle & Foot Mobility', 
    shortName: 'Ankle & Heel',
    tag: 'Ligament & Achilles',
    cx: 35, 
    cy: 94, 
    desc: 'Sprain recovery, plantar fasciitis treatment, Achilles tendonitis therapy, and proprioceptive balance training.',
    service: 'Lower Limb Recovery',
    stats: 'Balance & Stability'
  }
];

export default function BodyMapHero() {
  const [activeRegion, setActiveRegion] = useState('back');
  const activeData = regions.find(r => r.id === activeRegion) || regions[2];

  return (
    <section className="bg-[#FAF6F0] px-6 lg:px-16 pt-8 pb-20 overflow-hidden relative">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#1F8A82]/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#FF6F4D]/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* LEFT — Hero Content */}
        <div className="flex-1 max-w-xl">
          
          {/* Authentic Clinic Badge */}
          <div className="inline-flex items-center gap-2.5 bg-white border border-[#1F8A82]/20 text-[#221B26] text-xs font-bold px-4 py-2 rounded-full mb-6 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#1F8A82] animate-pulse"></span>
            <span className="tracking-wide uppercase text-gray-700">Expert Orthopedic &amp; Spine Rehabilitation</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-[#221B26] leading-[1.12] mb-6">
            Restoring your <br/>
            <span className="text-[#FF6F4D] italic relative inline-block">
              natural movement
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 9C50 2 150 2 198 9" stroke="#FF6F4D" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </span> with precision care.
          </h1>

          <p className="text-base sm:text-lg text-gray-600 font-body mb-8 leading-relaxed">
            Personalized, evidence-based physiotherapy tailored to your exact condition. Select a problem area on our interactive anatomy guide to explore your recovery pathway.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 mb-10">
            <Link 
              to="/book" 
              className="inline-flex items-center gap-2 bg-[#FF6F4D] text-white font-bold px-8 py-4 rounded-full hover:bg-[#E55A39] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 min-h-[48px]"
            >
              <span>Book your consultation</span>
              <span className="text-lg">→</span>
            </Link>
            <Link 
              to="/services" 
              className="inline-flex items-center gap-2 bg-white border-2 border-[#1F8A82] text-[#1F8A82] font-bold px-7 py-4 rounded-full hover:bg-[#1F8A82] hover:text-white transition-all min-h-[48px] shadow-xs"
            >
              Explore Treatments
            </Link>
          </div>

          {/* Enhanced Trust & Experience Badges */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-200/80">
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
              <p className="text-2xl font-display font-black text-[#221B26]">500+</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5 leading-tight">Patients Recovered</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="flex items-center gap-1">
                <p className="text-2xl font-display font-black text-[#221B26]">4.9</p>
                <span className="text-[#FFC857] text-lg">★</span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5 leading-tight">Patient Rating</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
              <p className="text-2xl font-display font-black text-[#221B26]">10+ Yrs</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5 leading-tight">Clinical Expertise</p>
            </div>
          </div>
        </div>

        {/* RIGHT — Interactive Anatomy Studio */}
        <div className="flex-1 w-full max-w-lg">
          
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-gray-100/80 relative">
            
            {/* Header / Instructions */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <div>
                <span className="text-[11px] uppercase font-black tracking-widest text-[#1F8A82]">Interactive Body Guide</span>
                <h3 className="text-lg font-display font-bold text-[#221B26]">Select Your Pain Region</h3>
              </div>
              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                Tap to explore
              </span>
            </div>

            {/* Region Selector Pills */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {regions.map((region) => {
                const isActive = activeRegion === region.id;
                return (
                  <button
                    key={`pill-${region.id}`}
                    onClick={() => setActiveRegion(region.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#FF6F4D] text-white shadow-xs scale-102'
                        : 'bg-gray-100/80 text-gray-600 hover:bg-gray-200/70'
                    }`}
                  >
                    {region.shortName}
                  </button>
                );
              })}
            </div>

            {/* Anatomy Visual & Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              
              {/* Silhouette Vector Visual (Left col) */}
              <div className="sm:col-span-5 flex justify-center py-2 relative">
                <div className="relative w-44 sm:w-48 bg-[#FAF6F0] rounded-3xl p-4 border border-gray-100 flex items-center justify-center">
                  
                  <svg 
                    viewBox="0 0 100 120" 
                    className="w-full h-auto drop-shadow-xs"
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Sleek Anatomical Human Silhouette */}
                    <g fill="#E4DDD3" stroke="#D1C7BA" strokeWidth="0.8">
                      {/* Head */}
                      <path d="M50 4 C44 4, 40 8, 40 14 C40 19, 44 23, 50 23 C56 23, 60 19, 60 14 C60 8, 56 4, 50 4 Z" />
                      {/* Neck & Trapezius */}
                      <path d="M46 22 L44 27 L33 30 C30 31, 28 34, 27 38 L22 55 C21 58, 23 60, 26 59 L30 46 L34 46 L31 70 L34 70 L37 53 L37 72 L44 72 L44 65 L46 65 L46 72 L54 72 L54 65 L56 65 L56 72 L63 72 L63 53 L66 70 L69 70 L66 46 L70 46 L74 59 C77 60, 79 58, 78 55 L73 38 C72 34, 70 31, 67 30 L56 27 L54 22 Z" />
                      {/* Spine / Core Axis line */}
                      <line x1="50" y1="24" x2="50" y2="64" stroke="#1F8A82" strokeWidth="1.5" strokeDasharray="1.5 1.5" opacity="0.6"/>
                      {/* Legs & Pelvis */}
                      <path d="M38 72 L36 94 L33 114 C33 116, 36 117, 38 116 L43 116 L44 96 L47 74 Z" />
                      <path d="M62 72 L64 94 L67 114 C67 116, 64 117, 62 116 L57 116 L56 96 L53 74 Z" />
                    </g>

                    {/* Interactive Target Pins */}
                    {regions.map((region) => {
                      const isActive = activeRegion === region.id;
                      return (
                        <g 
                          key={`target-${region.id}`}
                          className="cursor-pointer transition-transform duration-200"
                          onClick={() => setActiveRegion(region.id)}
                        >
                          {/* Pulse wave when active */}
                          {isActive && (
                            <circle 
                              cx={region.cx} 
                              cy={region.cy} 
                              r="12" 
                              fill="#FF6F4D" 
                              opacity="0.25"
                              className="animate-ping"
                            />
                          )}

                          {/* Outer halo */}
                          <circle 
                            cx={region.cx} 
                            cy={region.cy} 
                            r={isActive ? "9" : "6.5"} 
                            fill={isActive ? "#FF6F4D" : "white"}
                            stroke={isActive ? "#FF6F4D" : "#1F8A82"} 
                            strokeWidth="2"
                            className="shadow-sm"
                          />

                          {/* Center core point */}
                          <circle 
                            cx={region.cx} 
                            cy={region.cy} 
                            r={isActive ? "3.5" : "2.5"} 
                            fill={isActive ? "white" : "#1F8A82"}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Dynamic Assessment Details Card (Right col) */}
              <div className="sm:col-span-7 flex flex-col justify-between h-full bg-[#FAF6F0]/80 rounded-2xl p-5 border border-gray-100">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black tracking-wider uppercase text-[#1F8A82] bg-[#1F8A82]/10 px-2.5 py-1 rounded-md">
                      {activeData.tag}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500">
                      {activeData.stats}
                    </span>
                  </div>

                  <h4 className="text-xl font-display font-black text-[#221B26] mb-2 leading-snug">
                    {activeData.name}
                  </h4>

                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-5">
                    {activeData.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200/60 flex items-center justify-between gap-3">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Recommended Service</span>
                    <span className="text-xs font-bold text-[#1F8A82] truncate block max-w-[140px] sm:max-w-[160px]">
                      {activeData.service}
                    </span>
                  </div>

                  <Link 
                    to={`/book?service=${encodeURIComponent(activeData.service)}`}
                    className="inline-flex items-center gap-1.5 bg-[#FF6F4D] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#E55A39] transition-all shadow-xs hover:shadow-sm"
                  >
                    <span>Book Slot</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
