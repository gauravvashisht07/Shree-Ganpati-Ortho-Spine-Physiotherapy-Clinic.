import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['10:30 am', '11:30 am', '12:30 pm', '1:30 pm', '2:30 pm', '3:30 pm', '4:30 pm', '5:00 pm'];

export default function BookingPreview() {
  const [selectedDay, setSelectedDay] = useState(2); // Wed
  const [selectedTime, setSelectedTime] = useState('10:30 am');

  // Generate dates for this week
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const days = DAYS.map((d, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return { label: d, num: dt.getDate() };
  });

  return (
    <section className="bg-[#1F8A82] py-20 px-6 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:items-center">
          
          {/* Left Text */}
          <div className="lg:w-2/5">
            <p className="text-teal-200 text-xs font-black uppercase tracking-widest mb-4">Online Booking</p>
            <h2 className="text-4xl lg:text-5xl font-display font-black text-white leading-tight mb-5">
              Your recovery<br/>starts this week.
            </h2>
            <p className="text-teal-100 font-body mb-8">
              Sessions available Monday through Saturday (10:30 AM to 5:30 PM). Sunday is Closed.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-bold px-4 py-2 rounded-full">
                ⏰ Mon - Sat: 10:30 AM - 5:30 PM
              </span>
              <span className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-bold px-4 py-2 rounded-full">
                🚫 Sunday: Closed
              </span>
            </div>
          </div>

          {/* Right Picker */}
          <div className="lg:w-3/5">
            {/* Day Picker */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
              {days.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl min-w-[52px] font-bold transition-all ${
                    selectedDay === i
                      ? 'bg-white text-[#1F8A82] shadow-md'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-75 mb-0.5">{d.label}</span>
                  <span className="text-xl">{d.num}</span>
                </button>
              ))}
            </div>

            {/* Time Slots */}
            <div className="flex flex-wrap gap-2 mb-6">
              {TIMES.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all min-h-[44px] ${
                    selectedTime === t
                      ? 'bg-white text-[#1F8A82] shadow-md'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              to="/book"
              className="w-full flex items-center justify-center bg-[#FF6F4D] text-white font-bold text-lg py-4 px-8 rounded-full hover:bg-[#E55A39] transition-all shadow-lg hover:shadow-xl min-h-[56px]"
            >
              Confirm {selectedTime} session →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
