import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppointmentSlipModal from './AppointmentSlipModal';

export default function BookingConfirmation({ appointment }) {
  const [showSlip, setShowSlip] = useState(false);

  const patientName = appointment?.patientId?.name || appointment?.patientName || 'Valued Patient';
  const doctorName = appointment?.doctorId?.name || appointment?.doctorName || 'Specialist';
  const serviceName = appointment?.serviceId?.name || appointment?.serviceName || 'Physiotherapy Consultation';
  const date = appointment?.date;
  const timeSlot = appointment?.timeSlot;
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : null;

  return (
    <>
      <div className="max-w-2xl mx-auto p-8 sm:p-12 text-center bg-white rounded-3xl mt-8 shadow-sm border border-gray-100 animate-[fadeIn_0.5s_ease-out]">
        <div className="w-20 h-20 bg-teal text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl sm:text-4xl font-display font-black text-ink mb-3">
          You're booked, {patientName}!
        </h2>
        <p className="text-gray-600 font-body mb-8 text-base sm:text-lg">
          Your appointment has been confirmed and saved to the clinic calendar.
        </p>

        {/* Appointment Summary Box */}
        <div className="bg-[#FAF6F0] rounded-2xl p-6 mb-8 text-left border border-teal/20 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
            <span className="text-xs uppercase font-bold text-gray-500 font-display">Specialist</span>
            <span className="font-bold text-ink">Dr. {doctorName}</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
            <span className="text-xs uppercase font-bold text-gray-500 font-display">Treatment</span>
            <span className="font-bold text-teal">{serviceName}</span>
          </div>
          {formattedDate && (
            <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
              <span className="text-xs uppercase font-bold text-gray-500 font-display">Date &amp; Time</span>
              <span className="font-bold text-ink">{formattedDate} at {timeSlot}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs uppercase font-bold text-gray-500 font-display">Status</span>
            <span className="text-xs font-black uppercase px-3 py-1 bg-teal/10 text-teal rounded-full">
              Confirmed
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setShowSlip(true)}
            className="inline-flex items-center justify-center gap-2 bg-teal text-white font-bold py-3.5 px-8 rounded-full hover:bg-ink transition-all shadow-md"
          >
            <span>🖨️</span> Print / Save PDF Slip
          </button>
          <Link 
            to="/my-appointments" 
            className="inline-block bg-[#FF6F4D] text-white font-bold py-3.5 px-8 rounded-full hover:bg-[#E55A39] transition-all shadow-md"
          >
            View My Appointments
          </Link>
          <Link 
            to="/" 
            className="inline-block border-2 border-gray-200 text-gray-700 font-bold py-3.5 px-8 rounded-full hover:bg-gray-50 transition-colors"
          >
            Homepage
          </Link>
        </div>
      </div>

      {showSlip && (
        <AppointmentSlipModal
          appointment={appointment}
          onClose={() => setShowSlip(false)}
        />
      )}
    </>
  );
}

