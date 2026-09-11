import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AppointmentSlipModal from '../../components/booking/AppointmentSlipModal';

export default function MyAppointments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSlipAppt, setSelectedSlipAppt] = useState(null);

  const savedIdentifier = localStorage.getItem('patientEmail') || localStorage.getItem('patientPhone') || '';
  const [searchInput, setSearchInput] = useState(savedIdentifier);
  const [activeQuery, setActiveQuery] = useState(savedIdentifier);

  // Fetch appointments by phone or email without requiring a password
  const { data: appointments = [], isLoading, isFetching } = useQuery({
    queryKey: ['patient-appointments', activeQuery],
    queryFn: async () => {
      if (!activeQuery.trim()) return [];
      const { data } = await axiosInstance.get(`/appointments/lookup?search=${encodeURIComponent(activeQuery.trim())}`);
      return data;
    },
    enabled: !!activeQuery.trim(),
  });

  // Patient cancellation without password
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.put(`/appointments/${id}/patient-cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || err.message || 'Failed to cancel appointment');
    }
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setActiveQuery(searchInput.trim());
    if (searchInput.includes('@')) {
      localStorage.setItem('patientEmail', searchInput.trim().toLowerCase());
    } else {
      localStorage.setItem('patientPhone', searchInput.trim());
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-teal text-white';
      case 'pending': return 'bg-amber/20 text-amber-800';
      case 'completed': return 'border-2 border-coral text-coral bg-transparent';
      case 'cancelled': return 'bg-gray-100 text-gray-400 line-through';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const upcoming = appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const past = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  return (
    <div className="min-h-screen bg-base flex flex-col justify-between font-body text-ink">
      <Navbar />

      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-teal bg-teal/10 px-4 py-1.5 rounded-full inline-block">
              Patient Portal
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-black text-ink">
              My Appointments &amp; Treatment History
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto text-base">
              Enter your email or phone number to look up your scheduled therapy appointments, download slips, or make changes.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
              <input 
                type="text"
                placeholder="Enter email or mobile number..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 bg-transparent px-4 py-3 text-ink font-bold focus:outline-none placeholder:text-gray-400 placeholder:font-normal text-sm"
              />
              <button 
                type="submit" 
                className="bg-coral text-white font-bold px-7 py-3 rounded-xl hover:bg-[#E55A39] transition-all text-sm shadow-sm flex items-center justify-center gap-2"
              >
                {isFetching ? 'Searching...' : 'Find Sessions'}
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              🔒 No password needed. Instant lookup using the contact info from your booking.
            </p>
          </form>

          {/* Results Section */}
          <div className="pt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => <div key={i} className="h-48 bg-white/70 animate-pulse rounded-3xl border border-gray-100"></div>)}
              </div>
            ) : !activeQuery ? (
              /* Prompt to Search */
              <div className="bg-white rounded-[2.5rem] p-10 text-center shadow-sm max-w-xl mx-auto border border-gray-100">
                <div className="w-16 h-16 bg-teal/10 text-teal rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  📱
                </div>
                <h3 className="text-2xl font-display font-bold text-ink mb-2">Track your appointments</h3>
                <p className="text-gray-500 font-body mb-6 text-sm">
                  Enter your phone number or email in the box above to see your scheduled sessions, print passes, and check treatment history.
                </p>
                <button 
                  onClick={() => navigate('/book')}
                  className="bg-coral text-white font-bold px-7 py-3 rounded-full hover:bg-[#E55A39] transition-all text-sm shadow-md"
                >
                  Book a new session →
                </button>
              </div>
            ) : appointments.length === 0 ? (
              /* No Appointments Found */
              <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm max-w-xl mx-auto border border-gray-100">
                <div className="w-16 h-16 bg-amber/10 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  📅
                </div>
                <h3 className="text-2xl font-display font-bold text-ink mb-2">No appointments found</h3>
                <p className="text-gray-500 font-body mb-6 text-sm">
                  We couldn't find any appointments linked to <span className="font-bold text-ink">"{activeQuery}"</span>. Please double-check the phone or email used during booking.
                </p>
                <button 
                  onClick={() => navigate('/book')}
                  className="bg-coral text-white font-bold px-7 py-3.5 rounded-full hover:bg-[#E55A39] transition-all text-sm shadow-md"
                >
                  Book your first session →
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                
                {/* Upcoming Appointments */}
                {upcoming.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-display font-bold text-ink mb-6 flex items-center gap-2">
                      <span>Upcoming Sessions</span>
                      <span className="text-xs font-bold bg-teal/10 text-teal px-2.5 py-0.5 rounded-full">
                        {upcoming.length}
                      </span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {upcoming.map(appt => {
                        const docName = appt.doctorId?.name || 'Assigned Specialist';
                        const serviceName = appt.serviceId?.name || 'Consultation';

                        return (
                          <div 
                            key={appt._id} 
                            className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-teal/10 text-teal flex items-center justify-center font-bold text-lg">
                                  {docName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h3 className="font-bold text-ink text-base">Dr. {docName}</h3>
                                  <p className="text-teal font-medium text-xs">{serviceName}</p>
                                </div>
                              </div>

                              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${getStatusStyle(appt.status)}`}>
                                {appt.status}
                              </span>
                            </div>

                            <div className="bg-[#FAF6F0] rounded-2xl p-4 my-4 border border-teal/10 text-center">
                              <p className="text-xs uppercase font-bold text-gray-500 font-display">Appointment Time</p>
                              <p className="text-lg font-display font-bold text-ink mt-0.5">
                                {new Date(appt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-coral font-bold text-xl font-mono mt-0.5">{appt.timeSlot}</p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                              <button
                                onClick={() => setSelectedSlipAppt(appt)}
                                className="text-xs font-bold text-teal bg-teal/10 hover:bg-teal hover:text-white px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                              >
                                <span>🖨️</span> Print Slip
                              </button>

                              <div className="flex items-center gap-3 ml-auto">
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to cancel this appointment?')) {
                                      cancelMutation.mutate(appt._id);
                                    }
                                  }}
                                  disabled={cancelMutation.isPending}
                                  className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors underline"
                                >
                                  Cancel
                                </button>

                                <button
                                  onClick={() => navigate('/book')}
                                  className="text-xs font-bold border border-teal text-teal hover:bg-teal hover:text-white px-3.5 py-1.5 rounded-lg transition-colors"
                                >
                                  Reschedule
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Past / Cancelled Appointments */}
                {past.length > 0 && (
                  <section>
                    <h2 className="text-xl font-display font-bold text-gray-400 mb-4 border-b border-gray-200 pb-2">
                      Past &amp; Cancelled
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {past.map(appt => {
                        const docName = appt.doctorId?.name || 'Doctor';
                        const serviceName = appt.serviceId?.name || 'Consultation';

                        return (
                          <div key={appt._id} className="bg-white/60 p-5 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-gray-700">{serviceName}</h4>
                              <p className="text-xs text-gray-500">Dr. {docName} • {appt.date} at {appt.timeSlot}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedSlipAppt(appt)}
                                className="text-xs text-teal font-bold hover:underline"
                              >
                                Slip
                              </button>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${getStatusStyle(appt.status)}`}>
                                {appt.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

              </div>
            )}

          </div>
        </div>
      </div>

      {selectedSlipAppt && (
        <AppointmentSlipModal
          appointment={selectedSlipAppt}
          onClose={() => setSelectedSlipAppt(null)}
        />
      )}

      <Footer />
    </div>
  );
}
