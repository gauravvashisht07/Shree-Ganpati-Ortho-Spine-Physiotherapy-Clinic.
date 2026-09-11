import React from 'react';
import { Link } from 'react-router-dom';

const services = [
  {
    id: 'sports', name: 'Sports Injury Rehab', featured: true,
    icon: '🏃',
    desc: 'Targeted recovery plans for athletes — from ACL tears to shin splints. We get you back on the field, faster.',
  },
  {
    id: 'manual', name: 'Manual Therapy', icon: '🙌',
    desc: 'Hands-on joint mobilisation and soft-tissue work.',
  },
  {
    id: 'postural', name: 'Postural Correction', icon: '🧍',
    desc: 'Desk warriors and screen-strained spines — we fix the root cause.',
  },
  {
    id: 'needling', name: 'Dry Needling', icon: '✦',
    desc: 'Trigger point release for chronic muscular tension.',
  },
  {
    id: 'postop', name: 'Post-Op Rehab', icon: '🔧',
    desc: 'Structured recovery after surgery, step by step.',
  },
];

export default function ServicesGrid() {
  return (
    <section className="bg-[#FAF6F0] py-20 px-6 lg:px-16">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-[#1F8A82] text-xs font-black uppercase tracking-widest mb-3">What We Treat</p>
            <h2 className="text-4xl lg:text-5xl font-display font-black text-[#221B26] leading-tight">
              Built around<br/>your body.
            </h2>
          </div>
          <Link 
            to="/services" 
            className="text-[#FF6F4D] font-bold hover:underline shrink-0 self-end sm:self-auto pb-1"
          >
            View all services →
          </Link>
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Large Featured Card */}
          <div className="md:row-span-2 bg-[#221B26] p-8 rounded-3xl flex flex-col justify-between min-h-[320px] group hover:shadow-xl transition-shadow">
            <div>
              <span className="text-3xl mb-4 block">{services[0].icon}</span>
              <span className="inline-block bg-[#FF6F4D] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4">
                Most popular
              </span>
              <h3 className="text-2xl font-display font-black text-white mb-3">{services[0].name}</h3>
              <p className="text-gray-400 font-body leading-relaxed text-sm">{services[0].desc}</p>
            </div>
            <Link 
              to="/book" 
              className="mt-8 inline-flex items-center bg-[#FF6F4D] text-white font-bold px-6 py-3 rounded-full hover:bg-[#E55A39] transition-colors w-max min-h-[44px]"
            >
              Book now →
            </Link>
          </div>

          {/* Small Cards */}
          {services.slice(1).map(svc => (
            <div key={svc.id} className="bg-white p-7 rounded-3xl border border-gray-100 hover:shadow-md hover:border-[#FF6F4D]/30 transition-all group flex flex-col justify-between">
              <div>
                <span className="text-2xl mb-4 block">{svc.icon}</span>
                <h3 className="text-lg font-display font-black text-[#221B26] mb-2">{svc.name}</h3>
                <p className="text-gray-500 font-body text-sm leading-relaxed">{svc.desc}</p>
              </div>
              <Link 
                to="/services" 
                className="mt-5 text-[#1F8A82] font-bold text-sm group-hover:underline inline-flex items-center gap-1"
              >
                Learn more →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
