import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AppointmentSlipModal from './AppointmentSlipModal';
import { buildGoogleCalendarUrl, downloadAppointmentIcs } from '../../utils/calendar';

export default function BookingConfirmation({ appointment }) {
  const [showSlip, setShowSlip] = useState(false);

  const patientName = appointment?.patientId?.name || appointment?.patientName || 'Valued Patient';
  const patientEmail = appointment?.patientId?.email || appointment?.patientEmail;
  const isRealEmail = patientEmail && !patientEmail.endsWith('@clinic.local');
  const doctorName = appointment?.doctorId?.name || appointment?.doctorName || 'Specialist';
  const serviceName = appointment?.serviceId?.name || appointment?.serviceName || 'Physiotherapy Consultation';
  const date = appointment?.date;
  const timeSlot = appointment?.timeSlot;
  const formattedDate = date ? (() => {
    if (typeof date === 'string' && date.includes('-')) {
      const [y, m, d] = date.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  })() : null;

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*Shree Ganpati Ortho & Spine Physiotherapy Clinic*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ *APPOINTMENT CONFIRMED*\n\n` +
      `👤 *Patient:* ${patientName}\n` +
      `🩺 *Doctor:* Dr. ${doctorName}\n` +
      `💆 *Treatment:* ${serviceName}\n` +
      `📅 *Date:* ${formattedDate || date}\n` +
      `⏰ *Time Slot:* ${timeSlot}\n` +
      `📍 *Location:* Hospital Road, shop no. 2, Nadaun (H.P.)\n` +
      `🗺️ *Directions:* https://share.google/VQtNvUSwIJh91p4eO\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Please arrive 10 minutes prior to your time slot.\n` +
      `Wishing you a speedy recovery!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <>
      <div className="max-w-2xl mx-auto p-6 sm:p-12 text-center bg-white rounded-3xl mt-8 shadow-sm border border-gray-100 animate-[fadeIn_0.5s_ease-out]">
        <div className="w-20 h-20 bg-teal text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl sm:text-4xl font-display font-black text-ink mb-3">
          You're booked, {patientName}!
        </h2>
        <p className="text-gray-600 font-body mb-6 text-base sm:text-lg">
          Your appointment has been confirmed and registered with our clinic.
        </p>

        {/* Email Notification Notice Banner */}
        {isRealEmail ? (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-3 text-left">
            <span className="text-xl">📧</span>
            <div className="text-xs sm:text-sm text-emerald-900 leading-snug">
              <strong>Email Confirmation Dispatched!</strong> A copy with complete instructions was sent to <span className="font-semibold underline">{patientEmail}</span>.
            </div>
          </div>
        ) : (
          <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-3 text-left">
            <span className="text-xl">📱</span>
            <div className="text-xs sm:text-sm text-amber-900 leading-snug">
              <strong>Save your booking info!</strong> You can save a PDF slip or forward the confirmation to your WhatsApp below.
            </div>
          </div>
        )}

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

        {/* Action Buttons: WhatsApp + Print + Links */}
        <div className="space-y-3">
          {/* Calendar Sync Options */}
          <div className="bg-[#FAF6F0] border border-teal/15 rounded-2xl p-4 text-left">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🗓️</span>
                <span className="text-xs font-bold text-ink uppercase tracking-wider font-display">Sync to Calendar</span>
              </div>
              <span className="text-[10px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-full">
                Phone reminder set
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={buildGoogleCalendarUrl(appointment) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-ink font-bold text-xs transition-all shadow-2xs hover:shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.67 3 3 3.67 3 4.5v15c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-15c0-.83-.67-1.5-1.5-1.5zm0 16.5h-15V8.5h15v11z"/>
                </svg>
                <span>Add to Google Calendar</span>
              </a>

              <button
                onClick={() => downloadAppointmentIcs(appointment)}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-ink font-bold text-xs transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <span>📲</span>
                <span>Apple / Outlook (.ics)</span>
              </button>
            </div>
          </div>

          {/* Primary WhatsApp Share Button */}
          <button
            onClick={handleShareWhatsApp}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg text-base cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.109.005.253-.041.396.303.148.358.508 1.238.552 1.328.044.09.073.195.014.312-.058.117-.088.19-.174.29-.087.101-.183.226-.261.303-.09.09-.184.187-.079.367.105.18.468.771 1.003 1.248.69.614 1.272.804 1.452.894.18.09.285.076.39-.044.105-.12.448-.521.568-.699.12-.178.239-.149.404-.088.165.061 1.05.495 1.231.585.181.09.301.135.346.21.045.076.045.438-.099.843z" />
            </svg>
            <span>Open / Share in WhatsApp</span>
          </button>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => setShowSlip(true)}
              className="inline-flex items-center justify-center gap-2 bg-teal text-white font-bold py-3 px-6 rounded-xl hover:bg-ink transition-all shadow-sm"
            >
              <span>🖨️</span> Print / Save PDF Slip
            </button>
            <Link 
              to="/my-appointments" 
              className="inline-flex items-center justify-center bg-[#FF6F4D] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#E55A39] transition-all shadow-sm"
            >
              View My Appointments
            </Link>
            <Link 
              to="/" 
              className="inline-flex items-center justify-center border-2 border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Homepage
            </Link>
          </div>
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
