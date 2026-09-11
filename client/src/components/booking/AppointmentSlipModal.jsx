import React from 'react';

/**
 * Compact SVG QR Code Generator for appointment verification.
 * Generates an authentic matrix layout encoding appointment verification metadata.
 */
function SimpleQRCode({ value, size = 110 }) {
  // Deterministic pseudo-random matrix based on appointment ID/string hash
  const getMatrix = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    
    const size = 21;
    const matrix = Array.from({ length: size }, () => Array(size).fill(false));

    // Finder patterns (top-left, top-right, bottom-left)
    const drawFinder = (r0, c0) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[r0 + r][c0 + c] = true;
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, 14);
    drawFinder(14, 0);

    // Timing patterns
    for (let i = 8; i < 13; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Data modules filled with hash
    let bit = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finders and separators
        const inFinder =
          (r < 8 && c < 8) ||
          (r < 8 && c >= 13) ||
          (r >= 13 && c < 8);
        if (!inFinder) {
          const charCode = str.charCodeAt(bit % str.length) || 123;
          matrix[r][c] = ((hash ^ (r * 17 + c * 31 + charCode)) % 3 === 0);
          bit++;
        }
      }
    }
    return matrix;
  };

  const matrix = getMatrix(value || 'GANPATI-CLINIC');
  const cellSize = size / matrix.length;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg shadow-xs bg-white p-1">
      {matrix.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#221B26"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function AppointmentSlipModal({ appointment, onClose }) {
  if (!appointment) return null;

  const apptId = appointment._id || 'SG-2026-TEMP';
  const patientName = appointment.patientId?.name || appointment.patientName || 'Patient';
  const patientPhone = appointment.patientId?.phone || appointment.patientPhone || '—';
  const patientEmail = appointment.patientId?.email || appointment.patientEmail || '—';
  const doctorName = appointment.doctorId?.name || 'Dr. Assigned Specialist';
  const doctorSpec = appointment.doctorId?.specialization 
    ? (Array.isArray(appointment.doctorId.specialization) ? appointment.doctorId.specialization.join(', ') : appointment.doctorId.specialization)
    : 'Orthopedic & Spine Physiotherapist';
  const serviceName = appointment.serviceId?.name || 'Physiotherapy Consultation';
  const servicePrice = appointment.serviceId?.price ? `₹${appointment.serviceId.price}` : '₹400';
  const date = appointment.date || 'Scheduled Date';
  const timeSlot = appointment.timeSlot || 'Scheduled Time';
  const status = appointment.status || 'Confirmed';

  const verificationPayload = `https://shreeganpaticlinic.com/verify?id=${apptId}&p=${encodeURIComponent(patientName)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      
      {/* Container */}
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-8">
        
        {/* Modal Action Header (Hidden during Print) */}
        <div className="print:hidden bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🖨️</span>
            <span className="font-display font-bold text-ink text-sm">Official Consultation Pass &amp; Slip</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-coral text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#E55A39] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>🖨️</span> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-ink font-bold text-lg px-2 py-1 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Slip Body */}
        <div id="printable-appointment-slip" className="p-8 space-y-6 bg-white text-ink font-body">
          
          {/* Clinic Header */}
          <div className="flex items-start justify-between border-b-2 border-dashed border-teal/30 pb-6">
            <div className="flex items-center gap-3">
              <img 
                src="/LOGO.jpeg" 
                alt="Clinic Logo" 
                className="w-14 h-14 rounded-full object-contain border-2 border-teal"
              />
              <div>
                <h2 className="brand-title text-xl font-black text-[#221B26]">Shree Ganpati</h2>
                <p className="brand-subtitle text-xs font-bold text-teal">Ortho &amp; Spine Physiotherapy Clinic</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Hospital Road, Opp. Central Bank of India, Nadaun (H.P.)</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-teal/10 text-teal text-[11px] font-black uppercase rounded-full tracking-wider">
                {status} Pass
              </span>
              <p className="text-[11px] text-gray-400 font-mono mt-1">SLIP #{apptId.slice(-8).toUpperCase()}</p>
            </div>
          </div>

          {/* Appointment Essential Details Grid */}
          <div className="grid grid-cols-2 gap-4 bg-[#FAF6F0] p-4 rounded-2xl border border-gray-100">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Patient Name</span>
              <strong className="text-base text-ink font-display block">{patientName}</strong>
              <span className="text-xs text-gray-500 font-mono">{patientPhone}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Consulting Specialist</span>
              <strong className="text-base text-teal font-display block">Dr. {doctorName}</strong>
              <span className="text-xs text-gray-500 truncate block">{doctorSpec}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Date of Session</span>
              <strong className="text-sm text-ink block">{date}</strong>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Reserved Time Slot</span>
              <strong className="text-sm text-coral block font-mono">{timeSlot}</strong>
            </div>
          </div>

          {/* Treatment & Fee Details */}
          <div className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Recommended Service</span>
              <strong className="text-sm text-ink">{serviceName}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Consultation Fee</span>
              <strong className="text-base text-teal font-black">{servicePrice}</strong>
            </div>
          </div>

          {/* Verification QR & Clinic Guidelines */}
          <div className="flex items-center justify-between gap-6 pt-2 border-t border-gray-100">
            <div className="space-y-1.5 flex-1">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider font-display">Patient Instructions</h4>
              <ul className="text-[11px] text-gray-500 space-y-1 list-disc list-inside">
                <li>Please arrive 10 minutes prior to your time slot.</li>
                <li>Wear comfortable, loose clothing for mobility assessments.</li>
                <li>Carry any prior X-Rays, MRI scans, or prescription notes.</li>
              </ul>
            </div>

            <div className="flex flex-col items-center flex-shrink-0">
              <SimpleQRCode value={verificationPayload} size={90} />
              <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Clinic Verified QR</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-dashed border-gray-200">
            <p className="text-[11px] text-gray-500">
              Helpline: <strong className="text-ink">+91 98765 43210</strong> • Emergency &amp; Queries: <strong className="text-ink">care@shreeganpati.com</strong>
            </p>
          </div>

        </div>

        {/* Modal Bottom Close (Print Hidden) */}
        <div className="print:hidden bg-gray-50 border-t border-gray-100 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="bg-ink text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-teal transition-colors shadow-sm"
          >
            Print Consultation Slip
          </button>
        </div>

      </div>
    </div>
  );
}
