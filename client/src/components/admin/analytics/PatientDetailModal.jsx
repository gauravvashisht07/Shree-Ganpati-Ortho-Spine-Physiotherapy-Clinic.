import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';
import { useDoctors } from '../../../hooks/useDoctors';
import { useServices } from '../../../hooks/useServices';

export default function PatientDetailModal({ patientId, onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('visits'); // 'visits' | 'appointments' | 'editProfile'
  const [showAddVisitForm, setShowAddVisitForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState(null);
  const [deletingVisitId, setDeletingVisitId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState({ text: '', type: '' });

  const { data: doctors = [] } = useDoctors().getDoctors;
  const { data: services = [] } = useServices().getServices;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/patient-history/${patientId}`);
      return res.data;
    },
    enabled: Boolean(patientId)
  });

  const patient = data?.patient;
  const summary = data?.summary;
  const visits = data?.visits || [];
  const appointments = data?.appointments || [];

  // Edit Patient Profile State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    age: '',
    gender: 'male',
    email: ''
  });

  // New Visit Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [newVisitForm, setNewVisitForm] = useState({
    visitDate: todayStr,
    timeSlot: '10:00 AM',
    doctorId: '',
    serviceId: '',
    fee: '',
    paymentStatus: 'paid',
    notes: '',
    visitType: 'consultation'
  });

  // Edit Visit Form State
  const [editVisitForm, setEditVisitForm] = useState({
    visitDate: '',
    timeSlot: '10:00 AM',
    doctorId: '',
    serviceId: '',
    fee: '',
    paymentStatus: 'paid',
    notes: '',
    status: 'completed'
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['patient-history', patientId] });
    queryClient.invalidateQueries({ queryKey: ['admin-patients'] });
    queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-trends'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-rush-hours'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-demographics'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-services'] });
    queryClient.invalidateQueries({ queryKey: ['analytics-retention'] });
  };

  const showToast = (text, type = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage({ text: '', type: '' }), 4000);
  };

  // Add Clinical Visit Mutation
  const addVisitMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post('/visits', {
        ...payload,
        patientId
      });
      return res.data;
    },
    onSuccess: () => {
      invalidateAll();
      setShowAddVisitForm(false);
      setNewVisitForm({
        visitDate: todayStr,
        timeSlot: '10:00 AM',
        doctorId: doctors[0]?._id || '',
        serviceId: services[0]?._id || '',
        fee: '',
        paymentStatus: 'paid',
        notes: '',
        visitType: 'consultation'
      });
      showToast('✓ Clinical visit recorded successfully and statistics updated.');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to record visit', 'error');
    }
  });

  // Update Clinical Visit Mutation
  const updateVisitMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosInstance.put(`/visits/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      invalidateAll();
      setEditingVisit(null);
      showToast('✓ Visit record updated and dates synchronized.');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update visit', 'error');
    }
  });

  // Delete Clinical Visit Mutation
  const deleteVisitMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axiosInstance.delete(`/visits/${id}`);
      return res.data;
    },
    onSuccess: () => {
      invalidateAll();
      setDeletingVisitId(null);
      showToast('✓ Visit removed. Patient profile and visit counts safely recalculated.');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to remove visit', 'error');
    }
  });

  // Update Patient Profile Mutation
  const updatePatientMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.put(`/patients/${patientId}`, payload);
      return res.data;
    },
    onSuccess: () => {
      invalidateAll();
      setActiveTab('visits');
      showToast('✓ Patient profile details updated.');
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update patient profile', 'error');
    }
  });

  // Quick Appointment Status Update
  const updateApptStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosInstance.patch(`/appointments/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      invalidateAll();
      showToast('✓ Appointment status updated and synced to visits.');
    }
  });

  const handleStartAddVisit = () => {
    setNewVisitForm({
      visitDate: todayStr,
      timeSlot: '10:00 AM',
      doctorId: doctors[0]?._id || '',
      serviceId: services[0]?._id || '',
      fee: services[0]?.price || '',
      paymentStatus: 'paid',
      notes: '',
      visitType: 'consultation'
    });
    setShowAddVisitForm(true);
  };

  const handleStartEditVisit = (v) => {
    setEditingVisit(v._id);
    setEditVisitForm({
      visitDate: v.visitDate || todayStr,
      timeSlot: v.timeSlot || '10:00 AM',
      doctorId: v.doctorId?._id || v.doctorId || doctors[0]?._id || '',
      serviceId: v.serviceId?._id || v.serviceId || services[0]?._id || '',
      fee: v.fee !== undefined ? v.fee : (v.serviceId?.price || 0),
      paymentStatus: v.paymentStatus || 'paid',
      notes: v.notes || '',
      status: v.status || 'completed'
    });
  };

  const handleStartEditProfile = () => {
    if (patient) {
      setProfileForm({
        name: patient.name || '',
        phone: patient.phone || '',
        address: patient.address || '',
        age: patient.age !== undefined && patient.age !== null ? patient.age : '',
        gender: patient.gender || 'male',
        email: patient.email || ''
      });
      setActiveTab('editProfile');
    }
  };

  const handleServiceChangeNew = (svcId) => {
    const svc = services.find(s => s._id === svcId);
    setNewVisitForm(prev => ({
      ...prev,
      serviceId: svcId,
      fee: svc ? svc.price : prev.fee
    }));
  };

  const handleServiceChangeEdit = (svcId) => {
    const svc = services.find(s => s._id === svcId);
    setEditVisitForm(prev => ({
      ...prev,
      serviceId: svcId,
      fee: svc ? svc.price : prev.fee
    }));
  };

  if (!patientId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-7 border border-gray-100 my-auto max-h-[95dvh] sm:max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-teal bg-teal/10 px-2.5 py-0.5 rounded-md border border-teal/20">
                {patient?.patientId || 'SGP-PATIENT'}
              </span>
              <span className="text-[11px] font-bold text-coral bg-coral/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Permanent Patient Record
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-black text-ink mt-1.5 flex items-center gap-2 flex-wrap">
              <span>{patient?.name || (isLoading ? 'Loading patient...' : 'Patient')}</span>
              {patient?.age && (
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                  {patient.age} yrs
                </span>
              )}
              {patient?.gender && (
                <span className="text-[11px] font-bold text-teal bg-teal/5 px-2.5 py-0.5 rounded-full capitalize">
                  {patient.gender}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
              {patient?.phone && <span className="font-mono">📞 {patient.phone}</span>}
              {patient?.address && <span>📍 {patient.address}</span>}
              {patient?.email && !patient.email.endsWith('@clinic.local') && <span>✉️ {patient.email}</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
            <button
              onClick={handleStartEditProfile}
              className="text-xs font-bold text-teal hover:text-ink bg-teal/5 hover:bg-teal/10 px-3 py-1.5 rounded-xl transition-colors"
            >
              ✏️ Edit Profile
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-ink font-bold text-xl p-2 rounded-xl hover:bg-gray-100 transition-colors"
              title="Close Profile"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMessage.text && (
          <div className={`p-3 my-3 text-xs font-bold rounded-xl border shrink-0 flex items-center justify-between ${
            feedbackMessage.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <span>{feedbackMessage.text}</span>
            <button onClick={() => setFeedbackMessage({ text: '', type: '' })} className="text-gray-500 hover:text-ink">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 border-b border-gray-100 shrink-0 text-sm">
          <button
            onClick={() => setActiveTab('visits')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'visits'
                ? 'border-teal text-teal'
                : 'border-transparent text-gray-500 hover:text-ink'
            }`}
          >
            <span>🩺 Clinical Visits</span>
            <span className="bg-teal/10 text-teal text-xs px-2 py-0.5 rounded-full font-mono">
              {visits.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-2.5 px-3 font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'appointments'
                ? 'border-teal text-teal'
                : 'border-transparent text-gray-500 hover:text-ink'
            }`}
          >
            <span>📅 Scheduled Appointments</span>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-mono">
              {appointments.length}
            </span>
          </button>

          {activeTab === 'editProfile' && (
            <span className="pb-2.5 px-3 font-bold border-b-2 border-coral text-coral flex items-center gap-1">
              <span>✏️ Edit Profile Info</span>
            </span>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
              <div className="h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
            </div>
          ) : isError || !data ? (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl">
              Failed to load patient visit records. Please try again.
            </div>
          ) : activeTab === 'editProfile' ? (
            /* Edit Patient Profile Form */
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <h4 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">
                Update Patient Demographic Information
              </h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updatePatientMutation.mutate({
                    name: profileForm.name.trim(),
                    phone: profileForm.phone.trim(),
                    address: profileForm.address.trim(),
                    age: profileForm.age ? Number(profileForm.age) : undefined,
                    gender: profileForm.gender,
                    email: profileForm.email.trim()
                  });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-sm font-bold text-ink focus:border-teal focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-sm font-bold text-ink focus:border-teal focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={profileForm.age}
                      onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                      className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-sm font-bold text-ink focus:border-teal focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Gender</label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-sm font-bold text-ink focus:border-teal focus:outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Address / Village / Town</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-sm text-ink focus:border-teal focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('visits')}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatePatientMutation.isPending}
                    className="bg-teal text-white font-bold text-xs px-5 py-2 rounded-xl hover:bg-[#186f68] transition-colors"
                  >
                    {updatePatientMutation.isPending ? 'Saving...' : '✓ Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FAF6F0] p-3.5 rounded-2xl border border-gray-100 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Completed Visits
                  </span>
                  <strong className="text-2xl font-black text-teal font-mono">
                    {patient?.totalVisits !== undefined ? patient.totalVisits : summary?.completedVisits || 0}
                  </strong>
                </div>

                <div className="bg-[#FAF6F0] p-3.5 rounded-2xl border border-gray-100 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    First Visit Date
                  </span>
                  <strong className="text-xs font-bold text-ink block mt-2 font-mono">
                    {patient?.firstVisitDate || 'No visits yet'}
                  </strong>
                </div>

                <div className="bg-[#FAF6F0] p-3.5 rounded-2xl border border-gray-100 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Last Visit Date
                  </span>
                  <strong className="text-xs font-bold text-coral block mt-2 font-mono">
                    {patient?.lastVisitDate || 'No visits yet'}
                  </strong>
                </div>

                <div className="bg-[#FAF6F0] p-3.5 rounded-2xl border border-gray-100 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Registered On
                  </span>
                  <strong className="text-xs font-bold text-gray-600 block mt-2 font-mono">
                    {patient?.registeredAt ? String(patient.registeredAt).substring(0, 10) : 'N/A'}
                  </strong>
                </div>
              </div>

              {/* Delete Visit Confirmation Dialog */}
              {deletingVisitId && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                  <div>
                    <h5 className="font-bold text-sm text-red-800">Confirm Visit Deletion</h5>
                    <p className="text-xs text-red-600 mt-0.5">
                      Are you sure you want to delete this clinical visit? The patient profile will NOT be deleted, and visit counts &amp; first/last dates will be automatically recalculated.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setDeletingVisitId(null)}
                      className="px-3 py-1.5 text-xs font-bold bg-white text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => deleteVisitMutation.mutate(deletingVisitId)}
                      disabled={deleteVisitMutation.isPending}
                      className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      {deleteVisitMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                  </div>
                </div>
              )}

              {/* Clinical Visits Tab Content */}
              {activeTab === 'visits' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Complete Clinical Visit History ({visits.length})
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        Historical records reflect the actual date the patient was treated.
                      </p>
                    </div>

                    <button
                      onClick={handleStartAddVisit}
                      className="bg-coral text-white font-bold px-4 py-2 rounded-xl hover:bg-[#E55A39] transition-all text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <span>+</span>
                      <span>Record Clinical Visit</span>
                    </button>
                  </div>

                  {/* Add New Visit Inline Panel */}
                  {showAddVisitForm && (
                    <div className="bg-[#FAF6F0] p-4 sm:p-5 rounded-2xl border border-coral/30 shadow-xs animate-fadeIn space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <h5 className="text-sm font-bold text-ink flex items-center gap-1.5">
                          <span>🩺</span>
                          <span>Record Clinical Visit for {patient?.name}</span>
                        </h5>
                        <button
                          onClick={() => setShowAddVisitForm(false)}
                          className="text-xs font-bold text-gray-400 hover:text-ink"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <div className="p-2.5 bg-blue-50 text-blue-800 text-xs rounded-xl border border-blue-200">
                        💡 <strong>Historical Entry:</strong> You can select any past date for the actual visit date. The system will record today's timestamp for audit while placing the visit on its true historical date.
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          addVisitMutation.mutate(newVisitForm);
                        }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">
                              Actual Visit Date *
                            </label>
                            <input
                              type="date"
                              required
                              value={newVisitForm.visitDate}
                              onChange={(e) => setNewVisitForm({ ...newVisitForm, visitDate: e.target.value })}
                              className="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">
                              Time Slot
                            </label>
                            <input
                              type="text"
                              value={newVisitForm.timeSlot}
                              onChange={(e) => setNewVisitForm({ ...newVisitForm, timeSlot: e.target.value })}
                              className="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-coral focus:border-teal focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">
                              Doctor / Specialist *
                            </label>
                            <select
                              value={newVisitForm.doctorId}
                              onChange={(e) => setNewVisitForm({ ...newVisitForm, doctorId: e.target.value })}
                              className="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
                            >
                              {doctors.map(d => (
                                <option key={d._id} value={d._id}>Dr. {d.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">
                              Therapy / Service *
                            </label>
                            <select
                              value={newVisitForm.serviceId}
                              onChange={(e) => handleServiceChangeNew(e.target.value)}
                              className="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
                            >
                              {services.map(s => (
                                <option key={s._id} value={s._id}>{s.name} (₹{s.price})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">
                              Fee Charged (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={newVisitForm.fee}
                              onChange={(e) => setNewVisitForm({ ...newVisitForm, fee: e.target.value })}
                              className="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">
                              Payment Status
                            </label>
                            <select
                              value={newVisitForm.paymentStatus}
                              onChange={(e) => setNewVisitForm({ ...newVisitForm, paymentStatus: e.target.value })}
                              className="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
                            >
                              <option value="paid">Paid</option>
                              <option value="unpaid">Unpaid / Pending</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1">
                            Clinical Notes / Treatment Provided
                          </label>
                          <textarea
                            rows="2"
                            placeholder="e.g. Lumbar spine mobilization, ultrasound therapy 15 mins, home exercise prescribed"
                            value={newVisitForm.notes}
                            onChange={(e) => setNewVisitForm({ ...newVisitForm, notes: e.target.value })}
                            className="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs text-ink focus:border-teal focus:outline-none"
                          ></textarea>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAddVisitForm(false)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={addVisitMutation.isPending}
                            className="bg-teal text-white font-bold text-xs px-5 py-1.5 rounded-lg hover:bg-[#186f68] transition-colors"
                          >
                            {addVisitMutation.isPending ? 'Saving Visit...' : '✓ Save Clinical Visit'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Visit Records List */}
                  {visits.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-3xl mb-2">🩺</p>
                      <h5 className="font-bold text-ink text-sm">No clinical visits recorded yet</h5>
                      <p className="text-xs text-gray-400 mt-1">
                        Use the "+ Record Clinical Visit" button above to add historical or current therapy sessions.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {visits.map(v => (
                        <div
                          key={v._id}
                          className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 transition-all shadow-2xs"
                        >
                          {editingVisit === v._id ? (
                            /* Inline Edit Form for this visit */
                            <div className="space-y-3">
                              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                <span className="text-xs font-bold text-coral">
                                  Correcting Visit Record (ID: {v._id.slice(-6)})
                                </span>
                                <button
                                  onClick={() => setEditingVisit(null)}
                                  className="text-xs text-gray-400 hover:text-ink"
                                >
                                  ✕ Cancel
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                    Correct Visit Date *
                                  </label>
                                  <input
                                    type="date"
                                    required
                                    value={editVisitForm.visitDate}
                                    onChange={(e) => setEditVisitForm({ ...editVisitForm, visitDate: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                    Time Slot
                                  </label>
                                  <input
                                    type="text"
                                    value={editVisitForm.timeSlot}
                                    onChange={(e) => setEditVisitForm({ ...editVisitForm, timeSlot: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-bold text-coral focus:border-teal focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                    Fee (₹)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editVisitForm.fee}
                                    onChange={(e) => setEditVisitForm({ ...editVisitForm, fee: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                    Doctor
                                  </label>
                                  <select
                                    value={editVisitForm.doctorId}
                                    onChange={(e) => setEditVisitForm({ ...editVisitForm, doctorId: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
                                  >
                                    {doctors.map(d => (
                                      <option key={d._id} value={d._id}>Dr. {d.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                    Therapy Service
                                  </label>
                                  <select
                                    value={editVisitForm.serviceId}
                                    onChange={(e) => handleServiceChangeEdit(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
                                  >
                                    {services.map(s => (
                                      <option key={s._id} value={s._id}>{s.name} (₹{s.price})</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                    Payment Status
                                  </label>
                                  <select
                                    value={editVisitForm.paymentStatus}
                                    onChange={(e) => setEditVisitForm({ ...editVisitForm, paymentStatus: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
                                  >
                                    <option value="paid">Paid</option>
                                    <option value="unpaid">Unpaid</option>
                                    <option value="refunded">Refunded</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">
                                  Notes
                                </label>
                                <textarea
                                  rows="2"
                                  value={editVisitForm.notes}
                                  onChange={(e) => setEditVisitForm({ ...editVisitForm, notes: e.target.value })}
                                  className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-xs text-ink focus:border-teal focus:outline-none"
                                ></textarea>
                              </div>

                              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => setEditingVisit(null)}
                                  className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateVisitMutation.mutate({ id: v._id, payload: editVisitForm })}
                                  disabled={updateVisitMutation.isPending}
                                  className="bg-teal text-white font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-[#186f68]"
                                >
                                  {updateVisitMutation.isPending ? 'Updating...' : '✓ Save Visit Date & Details'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Normal Visit Card View */
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-ink text-sm font-mono bg-teal/10 text-teal px-2.5 py-0.5 rounded-lg border border-teal/20">
                                    📅 {v.visitDate}
                                  </span>
                                  <span className="text-xs font-mono text-gray-500">
                                    {v.timeSlot}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {v.status}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                    v.paymentStatus === 'paid' ? 'bg-teal/10 text-teal' : 'bg-amber/20 text-amber-800'
                                  }`}>
                                    {v.paymentStatus} (₹{v.fee || 0})
                                  </span>
                                </div>

                                <p className="text-xs text-ink font-medium">
                                  {v.serviceId?.name || 'Physiotherapy Consultation'} • Dr. {v.doctorId?.name || 'Clinic Physiotherapist'}
                                </p>

                                {v.notes && (
                                  <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded-xl">
                                    Note: {v.notes}
                                  </p>
                                )}

                                <p className="text-[10px] text-gray-400">
                                  🕒 Record Added On: {v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : '—'}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 self-end sm:self-center">
                                <button
                                  onClick={() => handleStartEditVisit(v)}
                                  className="text-xs font-bold text-teal bg-teal/5 hover:bg-teal/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                  title="Edit visit date or details"
                                >
                                  <span>✏️</span>
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => setDeletingVisitId(v._id)}
                                  className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                  title="Delete this visit record"
                                >
                                  <span>🗑️</span>
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Scheduled Appointments Tab Content */}
              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Planned Bookings &amp; Schedules ({appointments.length})
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        Marking an appointment as completed automatically creates a permanent clinical visit record.
                      </p>
                    </div>
                  </div>

                  {appointments.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-3xl mb-2">📅</p>
                      <h5 className="font-bold text-ink text-sm">No scheduled appointments</h5>
                      <p className="text-xs text-gray-400 mt-1">This patient has no pending or past appointment bookings.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointments.map(app => (
                        <div
                          key={app._id}
                          className="p-4 rounded-2xl border border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-gray-200 transition-colors shadow-2xs"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-ink text-sm font-mono">
                                {app.date} at {app.timeSlot}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                app.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : app.status === 'confirmed'
                                  ? 'bg-teal/10 text-teal'
                                  : app.status === 'cancelled'
                                  ? 'bg-gray-100 text-gray-400 line-through'
                                  : 'bg-amber/20 text-amber-800'
                              }`}>
                                {app.status}
                              </span>
                            </div>

                            <p className="text-xs text-teal font-medium">
                              {app.serviceId?.name || 'Physiotherapy Session'} • Dr. {app.doctorId?.name || 'Doctor'}
                            </p>
                            {app.notes && (
                              <p className="text-xs text-gray-500 italic bg-gray-50 p-1.5 rounded-lg">
                                {app.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {app.status !== 'completed' && app.status !== 'cancelled' && (
                              <button
                                onClick={() => updateApptStatusMutation.mutate({ id: app._id, status: 'completed' })}
                                disabled={updateApptStatusMutation.isPending}
                                className="text-xs font-bold text-white bg-teal hover:bg-[#186f68] px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1"
                                title="Mark patient attended and completed"
                              >
                                <span>✓</span>
                                <span>Mark Completed</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-gray-100 flex justify-end shrink-0 mt-auto">
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
