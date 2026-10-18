import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';

export default function PatientDetailModal({ patientId, onClose }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/patient-history/${patientId}`);
      return res.data;
    },
    enabled: Boolean(patientId)
  });

  if (!patientId) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-coral/10 text-coral border border-coral/30';
      case 'confirmed': return 'bg-teal/10 text-teal border border-teal/30';
      case 'pending': return 'bg-amber/20 text-amber-800 border border-amber/40';
      case 'no-show': return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'cancelled': return 'bg-gray-100 text-gray-500 line-through';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal bg-teal/10 px-3 py-1 rounded-full uppercase tracking-wider">
                Patient History &amp; Clinic File
              </span>
            </div>
            <h3 className="text-2xl font-display font-bold text-ink mt-2">
              {data?.patient?.name || 'Loading Patient...'}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {[
                data?.patient?.age ? `${data.patient.age} yrs` : null,
                data?.patient?.gender ? data.patient.gender : null,
                data?.patient?.address ? `📍 ${data.patient.address}` : null,
                data?.patient?.phone ? `📞 ${data.patient.phone}` : null
              ].filter(Boolean).join(' • ')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-ink font-bold text-xl p-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
              <div className="h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
            </div>
          ) : isError || !data ? (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl">
              Failed to load patient visit history. Please try again.
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-gray-100 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Completed Visits
                  </span>
                  <strong className="text-2xl font-black text-teal font-mono">
                    {data.summary.completedVisits}
                  </strong>
                </div>

                <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-gray-100 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Total Bookings
                  </span>
                  <strong className="text-2xl font-black text-ink font-mono">
                    {data.summary.totalAppointments}
                  </strong>
                </div>

                <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-gray-100 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Cancelled / Missed
                  </span>
                  <strong className="text-2xl font-black text-coral font-mono">
                    {data.summary.cancelledVisits + data.summary.noShowVisits}
                  </strong>
                </div>

                <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-gray-100 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Member Since
                  </span>
                  <strong className="text-xs font-bold text-gray-700 block mt-2">
                    {data.patient.registeredAt
                      ? new Date(data.patient.registeredAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </strong>
                </div>
              </div>

              {/* Services Breakdown */}
              {data.summary.servicesReceived && Object.keys(data.summary.servicesReceived).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Therapies &amp; Treatments Received
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.summary.servicesReceived).map(([svc, count]) => (
                      <span
                        key={svc}
                        className="bg-teal/5 border border-teal/20 text-teal text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-2"
                      >
                        <span>{svc}</span>
                        <span className="bg-teal text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                          {count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronological Visit Timeline */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Appointment History ({data.appointments.length})
                </h4>

                {data.appointments.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No appointments recorded for this patient.</p>
                ) : (
                  <div className="space-y-3">
                    {data.appointments.map(app => (
                      <div
                        key={app._id}
                        className="p-4 rounded-2xl border border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-200 transition-colors shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink text-sm">
                              {app.date} at {app.timeSlot}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadge(app.status)}`}>
                              {app.status}
                            </span>
                          </div>
                          <p className="text-xs text-teal font-medium">
                            {app.serviceId?.name || 'Physiotherapy Consultation'} • Dr. {app.doctorId?.name || 'Specialist'}
                          </p>
                          {app.notes && (
                            <p className="text-xs text-gray-500 italic mt-1 bg-gray-50 p-2 rounded-lg">
                              Note: {app.notes}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {app.serviceId?.price && (
                            <span className="text-xs font-mono font-bold text-ink block">
                              ₹{app.serviceId.price}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 uppercase font-medium">
                            {app.paymentStatus || 'unpaid'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-ink hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
