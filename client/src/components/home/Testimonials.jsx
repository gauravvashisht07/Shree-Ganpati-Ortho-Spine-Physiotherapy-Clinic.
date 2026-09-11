import React from 'react';

const testimonials = [
  {
    name: 'Mia Chen',
    role: 'Marathon runner',
    stars: 5,
    quote: '"Fixed my shoulder in 6 weeks. I\'d been putting up with the pain for 2 years. Wish I\'d come sooner."'
  },
  {
    name: 'Jordan Lake',
    role: 'Recreational footballer',
    stars: 5,
    quote: '"Post-op rehab after my ACL surgery. The structured program gave me total confidence getting back to the field."'
  },
  {
    name: 'Priya S.',
    role: 'Office worker',
    stars: 5,
    quote: '"Not a scary clinical vibe at all — it feels like a studio. I actually look forward to my sessions."'
  }
];

export default function Testimonials() {
  return (
    <section className="bg-[#FAF6F0] py-20 px-6 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-[#1F8A82] text-xs font-black uppercase tracking-widest text-center mb-12">What Clients Say</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white/70 rounded-3xl p-8 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex gap-0.5 mb-4">
                {Array(t.stars).fill(0).map((_, s) => (
                  <span key={s} className="text-[#FFC857] text-lg">★</span>
                ))}
              </div>
              <p className="text-[#221B26] font-body leading-relaxed mb-6 text-sm">{t.quote}</p>
              <div>
                <p className="font-bold text-[#221B26] font-display">{t.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
