import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';

export default function PatientDetailModal({ patientId, onClose }) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/patient-history/${patientId}`);
      return res.data;
    },
    enabled: Boolean(patientId)
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosInstance.patch(`/appointments/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-history', patientId] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-rush-hours'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-demographics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-services'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-retention'] });
    }
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, paymentStatus }) => {
      const res = await axiosInstance.put(`/appointments/${id}`, { paymentStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-history', patientId] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-services'] });
    }
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
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-7 border border-gray-100 my-auto max-h-[94dvh] sm:max-h-[90vh] flex flex-col">
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Appointment History ({data.appointments.length})
                  </h4>
                  {data.summary.completedVisits === 0 && data.summary.totalAppointments > 0 && (
                    <span className="text-[11px] text-coral font-bold bg-coral/10 px-2.5 py-1 rounded-lg">
                      💡 Click "✓ Mark as Completed" below to count completed therapies
                    </span>
                  )}
                </div>

                {data.appointments.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No appointments recorded for this patient.</p>
                ) : (
                  <div className="space-y-3">
                    {data.appointments.map(app => (
                      <div
                        key={app._id}
                        className="p-4 rounded-2xl border border-gray-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-200 transition-colors shadow-2xs"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-ink text-sm">
                              {app.date} at {app.timeSlot}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadge(app.status)}`}>
                              {app.status}
                            </span>
                            {app.paymentStatus && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                app.paymentStatus === 'paid' ? 'bg-teal/10 text-teal' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {app.paymentStatus}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-teal font-medium">
                            {app.serviceId?.name || 'Physiotherapy Consultation'} • Dr. {app.doctorId?.name || 'Specialist'}
                          </p>
                          {app.notes && (
                            <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded-lg">
                              Note: {app.notes}
                            </p>
                          )}
                        </div>

                        {/* Interactive Status & Payment Management */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-50">
                          {/* Quick Mark Completed Button */}
                          {app.status !== 'completed' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ id: app._id, status: 'completed' })}
                              disabled={updateStatusMutation.isPending}
                              className="text-xs font-bold text-white bg-teal hover:bg-[#186f68] px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Mark this session as attended and completed"
                            >
                              <span>✓</span>
                              <span>Mark Completed</span>
                            </button>
                          )}

                          {/* Full Status Selector */}
                          <div className="flex flex-col text-left">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
                            <select
                              value={app.status}
                              onChange={(e) => updateStatusMutation.mutate({ id: app._id, status: e.target.value })}
                              className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 text-ink focus:outline-none focus:border-teal cursor-pointer"
                            >
                              <option value="completed">Completed</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="pending">Pending</option>
                              <option value="no-show">No-Show</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>

                          {/* Payment Status Selector */}
                          <div className="flex flex-col text-left">
                            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                              Payment {app.serviceId?.price ? `(₹${app.serviceId.price})` : ''}
                            </label>
                            <select
                              value={app.paymentStatus || 'pending'}
                              onChange={(e) => updatePaymentStatusMutation.mutate({ id: app._id, paymentStatus: e.target.value })}
                              className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 text-ink focus:outline-none focus:border-teal cursor-pointer uppercase"
                            >
                              <option value="paid">Paid</option>
                              <option value="pending">Pending</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          </div>
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
        <div className="pt-4 border-t border-gray-100 flex justify-end shrink-0 mt-auto">
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
