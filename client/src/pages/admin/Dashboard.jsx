import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import { useDoctors } from '../../hooks/useDoctors';
import { useServices } from '../../hooks/useServices';
import { useAuth } from '../../context/AuthContext';
import PatientAnalytics from '../../components/admin/analytics/PatientAnalytics';
import PatientDetailModal from '../../components/admin/analytics/PatientDetailModal';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('appointments');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };
  
  const navItems = [
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'analytics', label: 'Patient Analytics', icon: '📊' },
    { id: 'doctors', label: 'Doctors', icon: '🩺' },
    { id: 'services', label: 'Services', icon: '⚙️' },
    { id: 'patients', label: 'Patients', icon: '👥' },
    { id: 'reviews', label: 'Reviews', icon: '⭐' },
    { id: 'blogs', label: 'Blogs & Videos', icon: '📝' },
  ];

  return (
    <div className="min-h-screen bg-base flex flex-col md:flex-row font-body">
      {/* Mobile Header for Sidebar Toggle */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center shadow-sm z-20">
        <h1 className="text-xl font-display font-bold text-ink">Clinic Admin</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLogout}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center">
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen bg-white shadow-md z-10 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 w-64 lg:w-72'}
        flex flex-col py-8 border-r border-gray-100
      `}>
        <Link to="/" className="hidden md:flex items-center gap-3 px-8 mb-8">
          <img src="/LOGO.jpeg" alt="Shree Ganpati Ortho & Spine Physiotherapy Clinic Logo" className="w-10 h-10 rounded-full object-contain border border-[#1F8A82]" />
          <div className="flex flex-col text-left">
            <span className="brand-title text-base leading-tight text-[#221B26] font-black">
              Shree Ganpati
            </span>
            <span className="brand-subtitle text-xs font-bold text-[#1F8A82]">
              Ortho &amp; Spine Clinic
            </span>
          </div>
        </Link>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-colors ${
                activeTab === item.id 
                  ? 'bg-coral/10 text-coral' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-ink'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="md:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer: Admin User & Logout */}
        <div className="px-4 pt-4 mt-auto border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ink truncate">{user?.email || 'shreeganpatiorthospinephysio@gmail.com'}</p>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal">Active Admin</span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <span>🔒</span>
            <span>Secure Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'appointments' && <AppointmentsTab />}
          {activeTab === 'analytics' && <PatientAnalytics />}
          {activeTab === 'doctors' && <DoctorsTab />}
          {activeTab === 'services' && <ServicesTab />}
          {activeTab === 'patients' && <PatientsTab />}
          {activeTab === 'reviews' && <ReviewsTab />}
          {activeTab === 'blogs' && <BlogsTab />}
        </div>
      </main>
    </div>
  );
}

function PatientsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['admin-appointments', 'All'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/appointments');
      return data;
    }
  });

  // Aggregate unique patients from appointments
  const patientsMap = new Map();

  appointments.forEach(appt => {
    const name = appt.patientId?.name || appt.patientName || 'Anonymous';
    const email = (appt.patientId?.email || appt.patientEmail || '').toLowerCase();
    const phone = appt.patientId?.phone || appt.patientPhone || '';
    const address = appt.patientAddress || appt.patientId?.address || '';
    const age = appt.patientAge || appt.patientId?.age || '';
    const gender = appt.patientGender || appt.patientId?.gender || '';
    const recordId = appt.patientId?._id || appt.patientId || null;
    const key = email || phone || name;

    if (!patientsMap.has(key)) {
      patientsMap.set(key, {
        id: key,
        patientRecordId: recordId,
        name: name,
        email: email,
        phone: phone,
        address: address,
        age: age,
        gender: gender,
        totalAppointments: 1,
        lastAppointmentDate: appt.date,
        lastDoctor: appt.doctorId?.name || 'Doctor',
        lastService: appt.serviceId?.name || 'Consultation',
        lastStatus: appt.status || 'confirmed'
      });
    } else {
      const existing = patientsMap.get(key);
      existing.totalAppointments += 1;
      if (!existing.patientRecordId && recordId) {
        existing.patientRecordId = recordId;
      }
      if (!existing.address && address) {
        existing.address = address;
      }
      if (!existing.age && age) {
        existing.age = age;
      }
      if (!existing.gender && gender) {
        existing.gender = gender;
      }
      if (new Date(appt.date) > new Date(existing.lastAppointmentDate)) {
        existing.lastAppointmentDate = appt.date;
        existing.lastDoctor = appt.doctorId?.name || existing.lastDoctor;
        existing.lastService = appt.serviceId?.name || existing.lastService;
        existing.lastStatus = appt.status || existing.lastStatus;
        if (address) existing.address = address;
        if (age) existing.age = age;
        if (gender) existing.gender = gender;
      }
    }
  });

  const patients = Array.from(patientsMap.values()).filter(p => {
    const match = `${p.name} ${p.email} ${p.phone} ${p.address} ${p.gender || ''} ${p.age ? p.age + ' yrs' : ''}`.toLowerCase();
    return match.includes(searchTerm.toLowerCase());
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    patientAddress: '',
    patientAge: '',
    patientGender: 'male',
    doctorId: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '09:30 AM',
    status: 'completed',
    paymentStatus: 'paid'
  });
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();

  const { data: doctors = [] } = useDoctors().getDoctors;
  const { data: services = [] } = useServices().getServices;

  const createPatientApptMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosInstance.post('/appointments', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-rush-hours'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-demographics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-services'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-retention'] });
      setShowAddModal(false);
      setFormData({
        patientName: '',
        patientEmail: '',
        patientPhone: '',
        patientAddress: '',
        patientAge: '',
        patientGender: 'male',
        doctorId: doctors[0]?._id || '',
        serviceId: services[0]?._id || '',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '09:30 AM',
        status: 'completed',
        paymentStatus: 'paid'
      });
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create patient record');
    }
  });

  const handleStartAdd = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setFormData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      patientAddress: '',
      patientAge: '',
      patientGender: 'male',
      doctorId: doctors[0]?._id || '',
      serviceId: services[0]?._id || '',
      date: todayStr,
      timeSlot: '09:30 AM',
      status: 'completed',
      paymentStatus: 'paid'
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.patientName.trim()) {
      setFormError('Patient Name is required');
      return;
    }

    const payload = {
      patientName: formData.patientName.trim(),
      patientEmail: formData.patientEmail.trim(),
      patientPhone: formData.patientPhone.trim(),
      patientAddress: formData.patientAddress.trim(),
      patientAge: formData.patientAge ? Number(formData.patientAge) : undefined,
      patientGender: formData.patientGender || 'prefer-not-to-say',
      doctorId: formData.doctorId || doctors[0]?._id,
      serviceId: formData.serviceId || services[0]?._id,
      date: formData.date,
      timeSlot: formData.timeSlot,
      status: formData.status || 'completed',
      paymentStatus: formData.paymentStatus || 'paid'
    };

    createPatientApptMutation.mutate(payload);
  };

  const timeOptions = [
    '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-ink">Patients Directory</h2>
          <p className="text-sm text-gray-500 font-body mt-1">
            {patients.length} registered patient{patients.length === 1 ? '' : 's'} across clinic records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleStartAdd}
            className="bg-coral text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#E55A39] transition-all shadow-sm flex items-center gap-1.5 text-sm"
          >
            <span>+</span>
            <span>Add Patient &amp; Session</span>
          </button>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name, email, phone, address, age..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-body text-sm text-ink focus:outline-none focus:border-teal"
            />
          </div>
        </div>
      </div>

      {/* Manual Patient Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-7 border border-gray-100 my-auto max-h-[94dvh] sm:max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-ink">Register Patient &amp; Book Session</h3>
                <p className="text-xs text-gray-500">Record a patient entry and assign an appointment date &amp; time slot.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-ink font-bold text-xl p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 my-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 shrink-0">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Thakur"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Age */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 29"
                    value={formData.patientAge}
                    onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Gender */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.patientGender}
                    onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm capitalize"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                {/* Patient Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98160 12345 (optional)"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. amit.thakur@example.com (optional)"
                    value={formData.patientEmail}
                    onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Patient Address / City / Village
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ward No. 3, Nadaun, Hamirpur"
                    value={formData.patientAddress}
                    onChange={(e) => setFormData({ ...formData, patientAddress: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Assign Doctor */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Select Doctor *
                  </label>
                  <select
                    required
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    {doctors.map(doc => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Treatment / Therapy *
                  </label>
                  <select
                    required
                    value={formData.serviceId}
                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    {services.map(svc => (
                      <option key={svc._id} value={svc._id}>
                        {svc.name} (₹{svc.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Time Slot Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Time Slot *
                  </label>
                  <select
                    required
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-coral focus:border-teal focus:outline-none text-sm font-mono"
                  >
                    {timeOptions.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Visit Status Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Session Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    <option value="completed">Completed (Attended &amp; Treated)</option>
                    <option value="confirmed">Confirmed (Upcoming)</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Payment Status *
                  </label>
                  <select
                    required
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    <option value="paid">Paid (Payment Received)</option>
                    <option value="pending">Pending / Unpaid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 shrink-0 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPatientApptMutation.isPending}
                  className="bg-teal text-white font-bold px-7 py-2.5 rounded-xl hover:bg-[#186f68] transition-all shadow-md text-sm disabled:opacity-50"
                >
                  {createPatientApptMutation.isPending ? 'Saving Entry...' : '✓ Add Patient to Directory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-4xl mb-3">👥</p>
          <h3 className="text-xl font-bold text-ink font-display mb-1">No patient records found</h3>
          <p className="text-gray-500 text-sm">
            {searchTerm ? 'No patients matching your search criteria.' : 'Patients who book consultations will automatically populate here.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Patient Name</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Contact &amp; Location</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Total Visits</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Recent Visit</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Recent Service</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(patient => (
                  <tr key={patient.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-6 font-bold text-ink whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-coral/10 text-coral flex items-center justify-center font-bold text-sm">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>{patient.name}</span>
                            {patient.age && (
                              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {patient.age} yrs
                              </span>
                            )}
                            {patient.gender && patient.gender !== 'prefer-not-to-say' && (
                              <span className="text-[11px] font-medium text-teal bg-teal/5 px-2 py-0.5 rounded-full capitalize">
                                {patient.gender}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-teal font-bold uppercase tracking-wider">Verified Patient</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-sm text-gray-600">
                      <div>{(!patient.email || patient.email.endsWith('@clinic.local')) ? '—' : patient.email}</div>
                      {patient.phone && <div className="text-xs text-gray-400 font-mono mt-0.5">{patient.phone}</div>}
                      {patient.address && (
                        <div className="text-xs text-teal font-medium mt-1 flex items-center gap-1">
                          <span>📍</span>
                          <span>{patient.address}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal/10 text-teal">
                        {patient.totalAppointments} visit{patient.totalAppointments > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="p-6 text-sm font-bold text-ink whitespace-nowrap">
                      {patient.lastAppointmentDate}
                      <span className="block text-xs font-normal text-gray-400">Dr. {patient.lastDoctor}</span>
                    </td>
                    <td className="p-6 text-sm text-gray-600">
                      {patient.lastService}
                    </td>
                    <td className="p-6 text-right whitespace-nowrap">
                      {patient.patientRecordId && (
                        <button
                          onClick={() => setSelectedPatientId(patient.patientRecordId)}
                          className="text-xs font-bold text-teal hover:text-ink bg-teal/5 hover:bg-teal/10 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 ml-auto"
                        >
                          <span>📜</span>
                          <span>Clinical History</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="lg:hidden space-y-4">
            {patients.map(patient => (
              <div key={patient.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-coral/10 text-coral flex items-center justify-center font-bold text-sm">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-ink text-base">{patient.name}</h3>
                        {patient.age && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {patient.age} yrs
                          </span>
                        )}
                        {patient.gender && patient.gender !== 'prefer-not-to-say' && (
                          <span className="text-[11px] font-medium text-teal bg-teal/5 px-2 py-0.5 rounded-full capitalize">
                            {patient.gender}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{(!patient.email || patient.email.endsWith('@clinic.local')) ? 'No email' : patient.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-teal/10 text-teal px-2.5 py-1 rounded-full">
                    {patient.totalAppointments} visit{patient.totalAppointments > 1 ? 's' : ''}
                  </span>
                </div>
                {patient.phone && (
                  <p className="text-xs text-gray-600 font-mono bg-gray-50 px-3 py-1.5 rounded-lg">
                    📞 {patient.phone}
                  </p>
                )}
                {patient.address && (
                  <p className="text-xs text-teal font-medium bg-teal/5 px-3 py-1.5 rounded-lg">
                    📍 {patient.address}
                  </p>
                )}
                <div className="border-t border-gray-50 pt-3 text-xs text-gray-500 flex justify-between">
                  <span>Last Visit: <strong className="text-ink">{patient.lastAppointmentDate}</strong></span>
                  <span>{patient.lastService}</span>
                </div>
                {patient.patientRecordId && (
                  <button
                    onClick={() => setSelectedPatientId(patient.patientRecordId)}
                    className="w-full text-xs font-bold text-teal bg-teal/5 hover:bg-teal/10 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 mt-1"
                  >
                    <span>📜</span>
                    <span>View Full Clinical Timeline</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Patient Detail History Modal */}
      {selectedPatientId && (
        <PatientDetailModal
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        />
      )}
    </div>
  );
}

function AppointmentsTab() {
  const [viewMode, setViewMode] = useState('schedule'); // 'schedule' | 'table'
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('All');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('All');
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [deletingAppointment, setDeletingAppointment] = useState(null);

  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    patientAddress: '',
    patientAge: '',
    patientGender: 'male',
    doctorId: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '09:30 AM',
    status: 'confirmed',
    duration: 30,
    notes: ''
  });
  const [formError, setFormError] = useState('');

  const [editFormData, setEditFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    patientAddress: '',
    patientAge: '',
    patientGender: 'male',
    doctorId: '',
    serviceId: '',
    date: '',
    timeSlot: '',
    status: 'confirmed',
    paymentStatus: 'pending',
    duration: 30,
    notes: ''
  });
  const [editFormError, setEditFormError] = useState('');

  const queryClient = useQueryClient();
  const { data: doctors = [] } = useDoctors().getDoctors;
  const { data: services = [] } = useServices().getServices;

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['admin-appointments', filterStatus, selectedDoctorFilter, selectedServiceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'All') params.append('status', filterStatus);
      if (selectedDoctorFilter !== 'All') params.append('doctorId', selectedDoctorFilter);
      if (selectedServiceFilter !== 'All') params.append('serviceId', selectedServiceFilter);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const { data } = await axiosInstance.get(`/appointments${queryStr}`);
      return data;
    }
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosInstance.post('/appointments', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-rush-hours'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-demographics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-services'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-retention'] });
      setShowAddModal(false);
      setFormData({
        patientName: '',
        patientEmail: '',
        patientPhone: '',
        patientAddress: '',
        patientAge: '',
        patientGender: 'male',
        doctorId: doctors[0]?._id || '',
        serviceId: services[0]?._id || '',
        date: selectedScheduleDate || new Date().toISOString().split('T')[0],
        timeSlot: '09:30 AM',
        status: 'confirmed',
        paymentStatus: 'paid',
        duration: 30,
        notes: ''
      });
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create appointment');
    }
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await axiosInstance.put(`/appointments/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-rush-hours'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-demographics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-services'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-retention'] });
      setShowEditModal(false);
      setEditingAppointment(null);
      setEditFormError('');
    },
    onError: (err) => {
      setEditFormError(err.response?.data?.message || 'Failed to update appointment');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await axiosInstance.patch(`/appointments/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-rush-hours'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-demographics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-services'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-retention'] });
    }
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.delete(`/appointments/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient-history'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-rush-hours'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-demographics'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-services'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-retention'] });
    }
  });

  const timeOptions = [
    '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  const handleStartAdd = (prefillSlot = null) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const initialDate = selectedScheduleDate || todayStr;
    const isPast = initialDate < todayStr;
    setFormData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      patientAddress: '',
      patientAge: '',
      patientGender: 'male',
      doctorId: (selectedDoctorFilter !== 'All' ? selectedDoctorFilter : (doctors[0]?._id || '')),
      serviceId: (selectedServiceFilter !== 'All' ? selectedServiceFilter : (services[0]?._id || '')),
      date: initialDate,
      timeSlot: prefillSlot || '09:30 AM',
      status: isPast ? 'completed' : 'confirmed',
      paymentStatus: 'paid',
      duration: 30,
      notes: ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleStartEdit = (appt) => {
    setEditingAppointment(appt);
    setEditFormData({
      patientName: appt.patientId?.name || appt.patientName || '',
      patientEmail: (appt.patientId?.email || appt.patientEmail || '').endsWith('@clinic.local') ? '' : (appt.patientId?.email || appt.patientEmail || ''),
      patientPhone: appt.patientId?.phone || appt.patientPhone || '',
      patientAddress: appt.patientAddress || appt.patientId?.address || '',
      patientAge: appt.patientAge || appt.patientId?.age || '',
      patientGender: appt.patientGender || appt.patientId?.gender || 'prefer-not-to-say',
      doctorId: appt.doctorId?._id || appt.doctorId || doctors[0]?._id || '',
      serviceId: appt.serviceId?._id || appt.serviceId || services[0]?._id || '',
      date: appt.date || '',
      timeSlot: appt.timeSlot || '09:30 AM',
      status: appt.status || 'confirmed',
      paymentStatus: appt.paymentStatus || 'pending',
      duration: appt.duration || 30,
      notes: appt.notes || ''
    });
    setEditFormError('');
    setShowEditModal(true);
  };

  const handleDelete = (appt) => {
    setDeletingAppointment(appt);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.patientName.trim()) {
      setFormError('Patient Name is required');
      return;
    }

    const payload = {
      patientName: formData.patientName.trim(),
      patientEmail: formData.patientEmail.trim(),
      patientPhone: formData.patientPhone.trim(),
      patientAddress: formData.patientAddress.trim(),
      patientAge: formData.patientAge ? Number(formData.patientAge) : undefined,
      patientGender: formData.patientGender || 'prefer-not-to-say',
      doctorId: formData.doctorId || doctors[0]?._id,
      serviceId: formData.serviceId || services[0]?._id,
      date: formData.date,
      timeSlot: formData.timeSlot,
      status: formData.status || 'confirmed',
      paymentStatus: formData.paymentStatus || 'paid',
      duration: Number(formData.duration) || 30,
      notes: formData.notes?.trim() || ''
    };

    createAppointmentMutation.mutate(payload);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditFormError('');
    if (!editFormData.patientName.trim()) {
      setEditFormError('Patient Name is required');
      return;
    }

    const payload = {
      patientName: editFormData.patientName.trim(),
      patientEmail: editFormData.patientEmail.trim(),
      patientPhone: editFormData.patientPhone.trim(),
      patientAddress: editFormData.patientAddress.trim(),
      patientAge: editFormData.patientAge ? Number(editFormData.patientAge) : undefined,
      patientGender: editFormData.patientGender || 'prefer-not-to-say',
      doctorId: editFormData.doctorId,
      serviceId: editFormData.serviceId,
      date: editFormData.date,
      timeSlot: editFormData.timeSlot,
      status: editFormData.status,
      paymentStatus: editFormData.paymentStatus,
      duration: Number(editFormData.duration) || 30,
      notes: editFormData.notes?.trim() || ''
    };

    updateAppointmentMutation.mutate({ id: editingAppointment._id, payload });
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'confirmed': return 'bg-teal text-white shadow-xs';
      case 'cancelled': return 'bg-gray-100 text-gray-500 line-through border border-gray-200';
      case 'completed': return 'border-2 border-coral text-coral bg-coral/5 font-black';
      case 'no-show': return 'bg-purple-100 text-purple-700 border border-purple-200 font-bold';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Change date for schedule view
  const adjustScheduleDate = (offsetDays) => {
    const current = new Date(selectedScheduleDate || new Date());
    current.setDate(current.getDate() + offsetDays);
    setSelectedScheduleDate(current.toISOString().split('T')[0]);
  };

  // Occupancy for Add modal
  const addSlotOccupancy = appointments.filter(
    a => a.date === formData.date && a.timeSlot === formData.timeSlot && a.status !== 'cancelled'
  );

  // Occupancy for Edit modal
  const editSlotOccupancy = appointments.filter(
    a => a.date === editFormData.date && a.timeSlot === editFormData.timeSlot && a.status !== 'cancelled' && a._id !== editingAppointment?._id
  );

  // Filtered appointments for table view
  const filteredAppointments = appointments.filter(appt => {
    if (searchTerm) {
      const pName = appt.patientId?.name || appt.patientName || '';
      const pPhone = appt.patientId?.phone || appt.patientPhone || '';
      const pEmail = appt.patientId?.email || appt.patientEmail || '';
      const pAddr = appt.patientAddress || appt.patientId?.address || '';
      const match = `${pName} ${pPhone} ${pEmail} ${pAddr}`.toLowerCase();
      if (!match.includes(searchTerm.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-display font-bold text-ink">Appointments Management</h2>
            <span className="text-xs bg-teal/10 text-teal font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              Multi-Slot Enabled
            </span>
          </div>
          <p className="text-sm text-gray-500 font-body mt-1">
            Manage multi-patient scheduling, walk-ins, daily timeline, and appointment statuses.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button
              onClick={() => setViewMode('schedule')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'schedule'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-gray-500 hover:text-ink'
              }`}
            >
              <span>📅</span>
              <span>Daily Schedule Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-gray-500 hover:text-ink'
              }`}
            >
              <span>📋</span>
              <span>All Appointments List</span>
            </button>
          </div>

          <button
            onClick={() => handleStartAdd()}
            className="bg-coral text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#E55A39] transition-all shadow-sm flex items-center gap-1.5 text-sm"
          >
            <span className="text-lg leading-none">+</span>
            <span>Manual Patient Entry</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Status Filter */}
          <select 
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-ink font-bold focus:outline-none focus:border-teal text-xs"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="confirmed">✓ Confirmed</option>
            <option value="completed">★ Completed</option>
            <option value="cancelled">✕ Cancelled</option>
            <option value="no-show">⚠️ No-Show</option>
          </select>

          {/* Doctor Filter */}
          <select 
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-ink font-bold focus:outline-none focus:border-teal text-xs"
            value={selectedDoctorFilter}
            onChange={e => setSelectedDoctorFilter(e.target.value)}
          >
            <option value="All">All Doctors</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>Dr. {d.name}</option>
            ))}
          </select>

          {/* Service Filter */}
          <select 
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-ink font-bold focus:outline-none focus:border-teal text-xs"
            value={selectedServiceFilter}
            onChange={e => setSelectedServiceFilter(e.target.value)}
          >
            <option value="All">All Services</option>
            {services.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          {/* Search Bar for Table View */}
          {viewMode === 'table' && (
            <input
              type="text"
              placeholder="Search patient, phone, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-body text-ink focus:outline-none focus:border-teal min-w-[200px]"
            />
          )}
        </div>

        {/* Schedule View Date Controls */}
        {viewMode === 'schedule' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjustScheduleDate(-1)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              title="Previous Day"
            >
              ◀
            </button>
            <button
              onClick={() => setSelectedScheduleDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1.5 rounded-lg bg-teal/10 text-teal text-xs font-bold hover:bg-teal/20"
            >
              Today
            </button>
            <input
              type="date"
              value={selectedScheduleDate}
              onChange={(e) => setSelectedScheduleDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-ink focus:outline-none focus:border-teal"
            />
            <button
              onClick={() => adjustScheduleDate(1)}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              title="Next Day"
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: DAILY SCHEDULE GRID (Grouped by Time Slot) */}
      {viewMode === 'schedule' && (
        <div className="space-y-4">
          <div className="bg-teal/5 border border-teal/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">📅</span>
              <span className="font-bold text-ink">
                Daily Timeline for <span className="text-teal font-black">{new Date(selectedScheduleDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </span>
            </div>
            <span className="text-gray-500">
              Slots accommodate <strong>unlimited admin-created appointments</strong> for parallel sessions.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {timeOptions.map((slot) => {
              const slotAppts = appointments.filter(a => {
                const matchDate = a.date === selectedScheduleDate;
                const matchSlot = a.timeSlot === slot;
                const matchDoc = selectedDoctorFilter === 'All' || (a.doctorId?._id || a.doctorId) === selectedDoctorFilter;
                const matchSvc = selectedServiceFilter === 'All' || (a.serviceId?._id || a.serviceId) === selectedServiceFilter;
                const matchStatus = filterStatus === 'All' || a.status === filterStatus;
                return matchDate && matchSlot && matchDoc && matchSvc && matchStatus;
              });

              const activeCount = slotAppts.filter(a => a.status !== 'cancelled').length;

              return (
                <div 
                  key={slot}
                  className={`bg-white rounded-2xl border transition-all ${
                    activeCount > 1 
                      ? 'border-coral/40 shadow-sm' 
                      : activeCount === 1 
                        ? 'border-teal/30 shadow-xs' 
                        : 'border-gray-100 opacity-90'
                  } p-4 sm:p-5`}
                >
                  {/* Slot Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-base sm:text-lg font-black text-ink bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                        ⏰ {slot}
                      </div>
                      
                      {activeCount === 0 ? (
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                          Open Slot • 0 Booked
                        </span>
                      ) : activeCount === 1 ? (
                        <span className="text-xs font-bold text-teal bg-teal/10 px-3 py-1 rounded-full">
                          1 Patient Booked
                        </span>
                      ) : (
                        <span className="text-xs font-black text-coral bg-coral/10 px-3 py-1 rounded-full border border-coral/20 flex items-center gap-1">
                          <span>🔥</span>
                          <span>{activeCount} Patients (Multi-Booked Slot)</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleStartAdd(slot)}
                      className="text-xs font-bold text-teal hover:text-ink bg-teal/5 hover:bg-teal/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>+</span>
                      <span>Schedule Patient to {slot}</span>
                    </button>
                  </div>

                  {/* Slot Patients Content */}
                  {slotAppts.length === 0 ? (
                    <div className="py-4 text-center text-xs text-gray-400 italic">
                      No patients scheduled for this time slot yet. Click "+ Schedule Patient" to assign a walk-in or booking.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                      {slotAppts.map((appt) => {
                        const pName = appt.patientId?.name || appt.patientName || 'Anonymous';
                        const pPhone = appt.patientId?.phone || appt.patientPhone || '';
                        const pAddress = appt.patientAddress || appt.patientId?.address || '';
                        const pAge = appt.patientAge || appt.patientId?.age || '';
                        const pGender = appt.patientGender || appt.patientId?.gender || '';
                        const docName = appt.doctorId?.name || 'Dr. Amit Thakur';
                        const svcName = appt.serviceId?.name || 'Consultation';

                        return (
                          <div 
                            key={appt._id}
                            className="bg-gray-50/70 border border-gray-100 hover:border-gray-200 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-colors"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-bold text-ink text-sm">{pName}</h4>
                                    {pAge && (
                                      <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded-full border border-gray-100">
                                        {pAge}y
                                      </span>
                                    )}
                                    {pGender && pGender !== 'prefer-not-to-say' && (
                                      <span className="text-[10px] text-teal bg-teal/10 px-1.5 py-0.5 rounded-full capitalize">
                                        {pGender}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-teal font-semibold mt-0.5">{svcName}</p>
                                </div>

                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap ${getStatusStyle(appt.status)}`}>
                                  {appt.status}
                                </span>
                              </div>

                              <div className="text-[11px] text-gray-500 space-y-0.5 mt-2">
                                <p>🩺 Dr. {docName} • {appt.duration || 30} mins</p>
                                {pPhone && <p>📞 {pPhone}</p>}
                                {pAddress && <p className="truncate">📍 {pAddress}</p>}
                                {appt.notes && (
                                  <p className="text-[11px] text-gray-600 bg-white p-1.5 rounded-lg border border-gray-100 mt-1 italic">
                                    "{appt.notes}"
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between gap-2">
                              <select
                                value={appt.status}
                                onChange={(e) => updateStatusMutation.mutate({ id: appt._id, status: e.target.value })}
                                className="text-[11px] font-bold border border-gray-200 rounded-lg px-2 py-1 bg-white text-ink focus:outline-none focus:border-teal"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="no-show">No-Show</option>
                              </select>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleStartEdit(appt)}
                                  className="text-xs text-teal hover:text-ink font-bold px-2 py-1 rounded hover:bg-white transition-colors"
                                  title="Edit / Reschedule"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(appt)}
                                  className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-white transition-colors"
                                  title="Delete Appointment"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === 'table' && (
        <>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>)}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
              <p className="text-4xl mb-3">📅</p>
              <h3 className="text-xl font-bold text-ink font-display mb-1">No appointments found</h3>
              <p className="text-gray-500 text-sm">No appointments matching current status, doctor, or search criteria.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="p-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Date / Slot</th>
                      <th className="p-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Patient &amp; Location</th>
                      <th className="p-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Doctor</th>
                      <th className="p-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Service</th>
                      <th className="p-5 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                      <th className="p-5 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map(appt => {
                      const patientName = appt.patientId?.name || appt.patientName || 'Anonymous';
                      const patientPhone = appt.patientId?.phone || appt.patientPhone || '';
                      const rawEmail = appt.patientId?.email || appt.patientEmail || '';
                      const patientEmail = rawEmail.endsWith('@clinic.local') ? '' : rawEmail;
                      const patientAddress = appt.patientAddress || appt.patientId?.address || '';
                      const patientAge = appt.patientAge || appt.patientId?.age || '';
                      const patientGender = appt.patientGender || appt.patientId?.gender || '';
                      const docName = appt.doctorId?.name || 'Assigned Doctor';
                      const serviceName = appt.serviceId?.name || 'General Consultation';

                      return (
                        <tr key={appt._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="p-5 font-bold text-ink whitespace-nowrap">
                            {appt.date} 
                            <span className="text-coral ml-2 font-mono font-bold">{appt.timeSlot}</span>
                            {appt.duration && appt.duration !== 30 && (
                              <span className="block text-[10px] text-gray-400 font-normal">{appt.duration} mins</span>
                            )}
                          </td>
                          <td className="p-5 font-bold">
                            <div className="flex items-center gap-2">
                              <span>{patientName}</span>
                              {patientAge && (
                                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {patientAge} yrs
                                </span>
                              )}
                              {patientGender && patientGender !== 'prefer-not-to-say' && (
                                <span className="text-xs font-normal text-teal bg-teal/10 px-2 py-0.5 rounded-full capitalize">
                                  {patientGender}
                                </span>
                              )}
                            </div>
                            {(patientPhone || patientEmail) && (
                              <div className="text-xs text-gray-400 font-normal">{patientPhone || patientEmail}</div>
                            )}
                            {patientAddress && (
                              <div className="text-xs text-teal font-medium mt-1 flex items-center gap-1">
                                <span>📍</span>
                                <span>{patientAddress}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-5 text-gray-600">Dr. {docName}</td>
                          <td className="p-5 text-teal font-medium">
                            {serviceName}
                            {appt.notes && (
                              <div className="text-[11px] text-gray-400 font-normal truncate max-w-[180px]">
                                📝 {appt.notes}
                              </div>
                            )}
                          </td>
                          <td className="p-5">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${getStatusStyle(appt.status)}`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="p-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <select
                                value={appt.status}
                                onChange={(e) => updateStatusMutation.mutate({ id: appt._id, status: e.target.value })}
                                className="text-xs font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-ink focus:outline-none focus:border-teal cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="no-show">No-Show</option>
                              </select>
                              <button
                                onClick={() => handleStartEdit(appt)}
                                className="text-xs text-teal hover:text-ink font-bold px-2 py-1 rounded bg-teal/5 hover:bg-teal/10"
                                title="Edit / Reschedule"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(appt)}
                                className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded bg-red-50 hover:bg-red-100"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Stacked Cards */}
              <div className="lg:hidden space-y-4">
                {filteredAppointments.map(appt => {
                  const patientName = appt.patientId?.name || appt.patientName || 'Anonymous';
                  const patientAddress = appt.patientAddress || appt.patientId?.address || '';
                  const patientAge = appt.patientAge || appt.patientId?.age || '';
                  const patientGender = appt.patientGender || appt.patientId?.gender || '';
                  const docName = appt.doctorId?.name || 'Assigned Doctor';
                  const serviceName = appt.serviceId?.name || 'General Consultation';

                  return (
                    <div key={appt._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-ink text-base">{patientName}</h3>
                            {patientAge && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {patientAge} yrs
                              </span>
                            )}
                            {patientGender && patientGender !== 'prefer-not-to-say' && (
                              <span className="text-xs text-teal bg-teal/10 px-2 py-0.5 rounded-full capitalize">
                                {patientGender}
                              </span>
                            )}
                          </div>
                          <p className="text-teal text-xs font-semibold">{serviceName}</p>
                          {patientAddress && (
                            <p className="text-xs text-teal font-medium mt-0.5">📍 {patientAddress}</p>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusStyle(appt.status)}`}>
                          {appt.status}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-xl text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-ink">{appt.date} at {appt.timeSlot}</p>
                          <p className="text-gray-500">Dr. {docName}</p>
                        </div>
                        <span className="text-gray-400 font-mono">{appt.duration || 30}m</span>
                      </div>

                      <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                        <select
                          value={appt.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: appt._id, status: e.target.value })}
                          className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1 bg-white text-ink focus:outline-none focus:border-teal"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no-show">No-Show</option>
                        </select>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEdit(appt)}
                            className="text-xs font-bold text-teal bg-teal/5 px-2.5 py-1 rounded-lg"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(appt)}
                            className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* MODAL 1: MANUAL PATIENT & MULTI-SLOT ENTRY (ADD) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-7 border border-gray-100 my-auto max-h-[94dvh] sm:max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-ink">Schedule Patient Appointment</h3>
                <p className="text-xs text-gray-500">Assign walk-in patient or offline booking with multi-appointment capacity.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-ink font-bold text-xl p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-4">
                {/* Unlimited Capacity Admin Notice */}
                <div className="p-3 bg-teal/10 border border-teal/20 rounded-xl text-xs text-teal flex items-center justify-between">
                  <div>
                    <span className="font-black">⚡ Multi-Slot Booking Active:</span> Admins can schedule multiple patients in the same time slot (e.g. 5 patients at 10:00 AM).
                  </div>
                  <span className="font-bold bg-white px-2 py-0.5 rounded-md text-ink shadow-xs">
                    {addSlotOccupancy.length} booked currently
                  </span>
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohit Verma"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Age */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 34"
                    value={formData.patientAge}
                    onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Gender */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.patientGender}
                    onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm capitalize"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                {/* Patient Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98055 87654"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. patient@example.com"
                    value={formData.patientEmail}
                    onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Address / Village / Town
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Main Bazar, Nadaun, Hamirpur"
                    value={formData.patientAddress}
                    onChange={(e) => setFormData({ ...formData, patientAddress: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Assign Doctor */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Assign Therapist / Doctor *
                  </label>
                  <select
                    required
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    {doctors.map(doc => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Physiotherapy Service *
                  </label>
                  <select
                    required
                    value={formData.serviceId}
                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    {services.map(svc => (
                      <option key={svc._id} value={svc._id}>
                        {svc.name} (₹{svc.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Time Slot Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Time Slot *
                  </label>
                  <select
                    required
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-coral focus:border-teal focus:outline-none text-sm font-mono"
                  >
                    {timeOptions.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="no-show">No-Show</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Session Duration (Mins)
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes (Standard)</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes (Comprehensive)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Clinical Remarks / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Patient complaining of cervical radiculopathy for 2 weeks..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 shrink-0 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAppointmentMutation.isPending}
                  className="bg-teal text-white font-bold px-7 py-2.5 rounded-xl hover:bg-[#186f68] transition-all shadow-md text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {createAppointmentMutation.isPending ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Scheduling Appointment...</span>
                    </>
                  ) : (
                    <span>✓ Confirm &amp; Save Appointment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT / RESCHEDULE APPOINTMENT */}
      {showEditModal && editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-7 border border-gray-100 my-auto max-h-[94dvh] sm:max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-ink">Edit &amp; Reschedule Appointment</h3>
                <p className="text-xs text-gray-500">
                  Update appointment date, time slot, duration, status, or patient clinical notes.
                </p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-ink font-bold text-xl p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-4">
                {/* Occupancy Indicator for target slot */}
                <div className="p-3 bg-teal/10 border border-teal/20 rounded-xl text-xs text-teal flex items-center justify-between">
                  <div>
                    Target Slot: <strong>{editFormData.date}</strong> at <strong>{editFormData.timeSlot}</strong>
                  </div>
                  <span className="font-bold bg-white px-2 py-0.5 rounded-md text-ink shadow-xs">
                    {editSlotOccupancy.length} other patient(s) in this slot
                  </span>
                </div>

                {editFormError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                    {editFormError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.patientName}
                    onChange={(e) => setEditFormData({ ...editFormData, patientName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Age */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={editFormData.patientAge}
                    onChange={(e) => setEditFormData({ ...editFormData, patientAge: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Gender */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={editFormData.patientGender}
                    onChange={(e) => setEditFormData({ ...editFormData, patientGender: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm capitalize"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                {/* Patient Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editFormData.patientPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, patientPhone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Address / Village / Town
                  </label>
                  <input
                    type="text"
                    value={editFormData.patientAddress}
                    onChange={(e) => setEditFormData({ ...editFormData, patientAddress: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Doctor */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Assigned Doctor *
                  </label>
                  <select
                    required
                    value={editFormData.doctorId}
                    onChange={(e) => setEditFormData({ ...editFormData, doctorId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    {doctors.map(doc => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Therapy / Service *
                  </label>
                  <select
                    required
                    value={editFormData.serviceId}
                    onChange={(e) => setEditFormData({ ...editFormData, serviceId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    {services.map(svc => (
                      <option key={svc._id} value={svc._id}>
                        {svc.name} (₹{svc.price})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reschedule Date */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Reschedule Time Slot */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Time Slot *
                  </label>
                  <select
                    required
                    value={editFormData.timeSlot}
                    onChange={(e) => setEditFormData({ ...editFormData, timeSlot: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-coral focus:border-teal focus:outline-none text-sm font-mono"
                  >
                    {timeOptions.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Appointment Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No-Show</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Payment Status
                  </label>
                  <select
                    value={editFormData.paymentStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Duration (Mins)
                  </label>
                  <select
                    value={editFormData.duration}
                    onChange={(e) => setEditFormData({ ...editFormData, duration: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Clinical Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Update clinical observations or reschedule reasons..."
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 shrink-0 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateAppointmentMutation.isPending}
                  className="bg-coral text-white font-bold px-7 py-2.5 rounded-xl hover:bg-[#E55A39] transition-all shadow-md text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {updateAppointmentMutation.isPending ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>✓ Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE APPOINTMENT CONFIRMATION */}
      {deletingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-xl font-bold">
              🗑️
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-ink">Delete Appointment</h3>
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to delete the appointment for{' '}
                <strong className="text-ink">
                  {deletingAppointment.patientId?.name || deletingAppointment.patientName || 'this patient'}
                </strong>{' '}
                on <strong>{deletingAppointment.date}</strong> at <strong>{deletingAppointment.timeSlot}</strong>?
              </p>
              <p className="text-xs text-red-500 font-semibold mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingAppointment(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAppointmentMutation.mutate(deletingAppointment._id);
                  setDeletingAppointment(null);
                }}
                disabled={deleteAppointmentMutation.isPending}
                className="bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors shadow-sm text-sm disabled:opacity-50"
              >
                {deleteAppointmentMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DoctorsTab() {
  const { getDoctors, createDoctor, updateDoctor, deleteDoctor } = useDoctors();
  const [formData, setFormData] = useState({ name: '', email: '', specialization: '', slotDuration: 30, slotCapacity: 1 });
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingDoctorId, setDeletingDoctorId] = useState(null);

  const handleStartAdd = () => {
    setEditingDoctorId(null);
    setFormData({ name: '', email: '', specialization: '', slotDuration: 30, slotCapacity: 1 });
    setShowAdd(true);
    setErrorMsg('');
  };

  const handleStartEdit = (doc) => {
    setEditingDoctorId(doc._id);
    setFormData({
      name: doc.name || '',
      email: doc.email || '',
      specialization: Array.isArray(doc.specialization) ? doc.specialization.join(', ') : (doc.specialization || ''),
      slotDuration: doc.slotDuration || 30,
      slotCapacity: doc.slotCapacity || 1,
    });
    setShowAdd(true);
    setErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowAdd(false);
    setEditingDoctorId(null);
    setFormData({ name: '', email: '', specialization: '', slotDuration: 30, slotCapacity: 1 });
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const payload = {
      ...formData,
      slotCapacity: Math.max(1, Number(formData.slotCapacity) || 1),
      specialization: formData.specialization
        ? formData.specialization.split(',').map(s => s.trim()).filter(Boolean)
        : []
    };

    if (editingDoctorId) {
      updateDoctor.mutate({ id: editingDoctorId, updatedData: payload }, {
        onSuccess: () => {
          handleCancelForm();
        },
        onError: (err) => {
          setErrorMsg(err.response?.data?.message || err.message || 'Failed to update doctor');
        }
      });
    } else {
      createDoctor.mutate(payload, {
        onSuccess: () => {
          handleCancelForm();
        },
        onError: (err) => {
          setErrorMsg(err.response?.data?.message || err.message || 'Failed to save doctor');
        }
      });
    }
  };

  const isSaving = createDoctor.isPending || updateDoctor.isPending;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-ink">Manage Doctors &amp; Therapists</h2>
          <p className="text-sm text-gray-500 font-body mt-1">Configure doctor profiles, session durations, and public booking capacity.</p>
        </div>
        <button 
          onClick={showAdd ? handleCancelForm : handleStartAdd}
          className="bg-coral text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#E55A39] transition-colors shadow-sm"
        >
          {showAdd ? 'Cancel' : '+ Add new'}
        </button>
      </div>
      
      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm mb-8 space-y-6 border border-coral/20">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-display font-bold text-ink">
              {editingDoctorId ? 'Edit Doctor Details' : 'New Doctor Details'}
            </h3>
            {editingDoctorId && (
              <span className="text-xs bg-teal/10 text-teal font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Editing Mode
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Doctor Name</label>
              <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-coral focus:outline-none font-bold text-ink" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-coral focus:outline-none text-ink" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Specializations (comma separated)</label>
              <input type="text" placeholder="e.g. Spine Rehab, Orthopedics, Sports Rehab" value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-coral focus:outline-none text-ink" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Slot Duration (minutes)</label>
              <input type="number" placeholder="Slot Duration (min)" value={formData.slotDuration} onChange={(e) => setFormData({...formData, slotDuration: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-coral focus:outline-none font-bold text-ink" required />
            </div>
            <div className="md:col-span-2 bg-teal/5 p-4 rounded-2xl border border-teal/20">
              <label className="block text-xs font-bold text-teal uppercase tracking-wider mb-1">
                Public Self-Booking Slot Capacity
              </label>
              <input 
                type="number" 
                min="1" 
                max="50" 
                placeholder="1" 
                value={formData.slotCapacity || 1} 
                onChange={(e) => setFormData({...formData, slotCapacity: Math.max(1, Number(e.target.value))})} 
                className="w-full max-w-xs bg-white border border-gray-200 p-3 rounded-xl focus:border-teal focus:outline-none font-bold text-ink text-sm" 
                required 
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Maximum number of concurrent bookings public visitors can make on the website for the same time slot (Default: 1). <em>Note: Clinic Administrators can always schedule unlimited appointments in any slot regardless of this setting.</em>
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-center pt-2">
            <button type="submit" className="bg-ink text-white font-bold py-3 px-8 rounded-full hover:bg-teal transition-colors shadow-sm" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingDoctorId ? 'Update Doctor' : 'Save Doctor'}
            </button>
            <button type="button" onClick={handleCancelForm} className="text-gray-500 font-bold hover:text-ink px-4 py-3">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Name</th>
              <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Email</th>
              <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Specializations &amp; Capacity</th>
              <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getDoctors.data?.map(doc => (
              <tr key={doc._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-ink whitespace-nowrap">Dr. {doc.name}</td>
                <td className="p-6 text-gray-600">{doc.email}</td>
                <td className="p-6 text-gray-600">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {doc.specialization?.map(spec => (
                      <span key={spec} className="text-xs bg-gray-100 px-2.5 py-1 rounded-md text-gray-600 font-medium">{spec}</span>
                    ))}
                  </div>
                  <div className="text-xs text-teal font-semibold">
                    Public Capacity: {doc.slotCapacity || 1} booking{doc.slotCapacity > 1 ? 's' : ''}/slot
                  </div>
                </td>
                <td className="p-6 text-right space-x-3 whitespace-nowrap">
                  <button 
                    onClick={() => handleStartEdit(doc)} 
                    className="text-teal hover:text-ink font-bold transition-colors px-2 py-1 rounded hover:bg-teal/10"
                  >
                    Edit
                  </button>
                  {deletingDoctorId === doc._id ? (
                    <span className="inline-flex items-center gap-1.5 animate-fadeIn">
                      <button
                        onClick={() => {
                          deleteDoctor.mutate(doc._id);
                          setDeletingDoctorId(null);
                        }}
                        disabled={deleteDoctor.isPending}
                        className="text-xs font-bold bg-red-600 text-white px-2.5 py-1 rounded-lg hover:bg-red-700 transition-colors shadow-xs"
                      >
                        {deleteDoctor.isPending ? '...' : 'Confirm?'}
                      </button>
                      <button
                        onClick={() => setDeletingDoctorId(null)}
                        className="text-xs font-bold text-gray-500 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button 
                      onClick={() => setDeletingDoctorId(doc._id)} 
                      className="text-red-500 hover:text-red-700 font-bold transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="lg:hidden space-y-4">
         {getDoctors.data?.map(doc => (
          <div key={doc._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-ink text-lg mb-1">Dr. {doc.name}</h3>
            <p className="text-gray-500 text-sm mb-2">{doc.email}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {doc.specialization?.map(spec => (
                <span key={spec} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{spec}</span>
              ))}
            </div>
            <div className="text-xs text-teal font-semibold mb-3">
              Public Capacity: {doc.slotCapacity || 1} booking{doc.slotCapacity > 1 ? 's' : ''}/slot
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-50 pt-4">
              <button 
                onClick={() => handleStartEdit(doc)} 
                className="min-h-[44px] px-4 text-teal hover:bg-teal/10 rounded-lg font-bold text-sm"
              >
                Edit
              </button>
              {deletingDoctorId === doc._id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      deleteDoctor.mutate(doc._id);
                      setDeletingDoctorId(null);
                    }}
                    disabled={deleteDoctor.isPending}
                    className="min-h-[44px] px-3 bg-red-600 text-white hover:bg-red-700 rounded-lg font-bold text-xs"
                  >
                    {deleteDoctor.isPending ? '...' : 'Confirm?'}
                  </button>
                  <button
                    onClick={() => setDeletingDoctorId(null)}
                    className="min-h-[44px] px-3 text-gray-500 hover:bg-gray-100 rounded-lg font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setDeletingDoctorId(doc._id)} 
                  className="min-h-[44px] px-4 text-red-500 hover:bg-red-50 rounded-lg font-bold text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesTab() {
  const { getServices, createService, updateService, deleteService } = useServices();
  const [formData, setFormData] = useState({ name: '', description: '', duration: 30, price: 0 });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deletingServiceId, setDeletingServiceId] = useState(null);

  const handleStartAdd = () => {
    setEditingServiceId(null);
    setFormData({ name: '', description: '', duration: 30, price: 0 });
    setShowAdd(true);
    setErrorMsg('');
  };

  const handleStartEdit = (svc) => {
    setEditingServiceId(svc._id);
    setFormData({
      name: svc.name || '',
      description: svc.description || '',
      duration: svc.duration || 30,
      price: svc.price || 0,
    });
    setShowAdd(true);
    setErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowAdd(false);
    setEditingServiceId(null);
    setFormData({ name: '', description: '', duration: 30, price: 0 });
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (editingServiceId) {
      updateService.mutate({ id: editingServiceId, updatedData: formData }, {
        onSuccess: () => {
          handleCancelForm();
        },
        onError: (err) => {
          setErrorMsg(err.response?.data?.message || err.message || 'Failed to update service');
        }
      });
    } else {
      createService.mutate(formData, {
        onSuccess: () => {
          handleCancelForm();
        },
        onError: (err) => {
          setErrorMsg(err.response?.data?.message || err.message || 'Failed to save service');
        }
      });
    }
  };

  const isSaving = createService.isPending || updateService.isPending;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-ink">Manage Services</h2>
        <button 
          onClick={showAdd ? handleCancelForm : handleStartAdd}
          className="bg-coral text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#E55A39] transition-colors shadow-sm"
        >
          {showAdd ? 'Cancel' : '+ Add new'}
        </button>
      </div>
      
      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm mb-8 space-y-6 border border-coral/20">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-display font-bold text-ink">
              {editingServiceId ? 'Edit Service Details' : 'New Service Details'}
            </h3>
            {editingServiceId && (
              <span className="text-xs bg-teal/10 text-teal font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Editing Mode
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Service Name</label>
              <input type="text" placeholder="Service Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-coral focus:outline-none font-bold text-ink" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price (₹ INR)</label>
              <input type="number" placeholder="Price (₹)" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-coral focus:outline-none font-bold text-ink" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Duration (min)</label>
              <input type="number" placeholder="Duration (min)" value={formData.duration} onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-coral focus:outline-none font-bold text-ink" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
              <input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:border-coral focus:outline-none text-ink" />
            </div>
          </div>
          <div className="flex gap-4 items-center pt-2">
            <button type="submit" className="bg-ink text-white font-bold py-3 px-8 rounded-full hover:bg-teal transition-colors shadow-sm" disabled={isSaving}>
              {isSaving ? 'Saving...' : editingServiceId ? 'Update Service' : 'Save Service'}
            </button>
            <button type="button" onClick={handleCancelForm} className="text-gray-500 font-bold hover:text-ink px-4 py-3">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Name</th>
              <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Duration</th>
              <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Price</th>
              <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getServices.data?.map(svc => (
              <tr key={svc._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-ink whitespace-nowrap">{svc.name}</td>
                <td className="p-6 text-gray-600 font-bold">{svc.duration} <span className="text-xs font-normal">min</span></td>
                <td className="p-6 text-teal font-bold">₹{svc.price}</td>
                <td className="p-6 text-right space-x-3 whitespace-nowrap">
                  <button 
                    onClick={() => handleStartEdit(svc)} 
                    className="text-teal hover:text-ink font-bold transition-colors px-2 py-1 rounded hover:bg-teal/10"
                  >
                    Edit
                  </button>
                  {deletingServiceId === svc._id ? (
                    <span className="inline-flex items-center gap-1.5 animate-fadeIn">
                      <button
                        onClick={() => {
                          deleteService.mutate(svc._id);
                          setDeletingServiceId(null);
                        }}
                        disabled={deleteService.isPending}
                        className="text-xs font-bold bg-red-600 text-white px-2.5 py-1 rounded-lg hover:bg-red-700 transition-colors shadow-xs"
                      >
                        {deleteService.isPending ? '...' : 'Confirm?'}
                      </button>
                      <button
                        onClick={() => setDeletingServiceId(null)}
                        className="text-xs font-bold text-gray-500 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button 
                      onClick={() => setDeletingServiceId(svc._id)} 
                      className="text-red-500 hover:text-red-700 font-bold transition-colors px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="lg:hidden space-y-4">
         {getServices.data?.map(svc => (
          <div key={svc._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-2">
               <h3 className="font-bold text-ink text-lg">{svc.name}</h3>
               <span className="text-teal font-bold bg-teal/10 px-2 py-1 rounded text-sm">₹{svc.price}</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">{svc.duration} mins</p>
            <div className="flex justify-end gap-3 mt-auto border-t border-gray-50 pt-4">
              <button 
                onClick={() => handleStartEdit(svc)} 
                className="min-h-[44px] px-4 text-teal hover:bg-teal/10 rounded-lg font-bold text-sm"
              >
                Edit
              </button>
              {deletingServiceId === svc._id ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      deleteService.mutate(svc._id);
                      setDeletingServiceId(null);
                    }}
                    disabled={deleteService.isPending}
                    className="min-h-[44px] px-3 bg-red-600 text-white hover:bg-red-700 rounded-lg font-bold text-xs"
                  >
                    {deleteService.isPending ? '...' : 'Confirm?'}
                  </button>
                  <button
                    onClick={() => setDeletingServiceId(null)}
                    className="min-h-[44px] px-3 text-gray-500 hover:bg-gray-100 rounded-lg font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setDeletingServiceId(svc._id)} 
                  className="min-h-[44px] px-4 text-red-500 hover:bg-red-50 rounded-lg font-bold text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/reviews/admin');
      return data;
    }
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ id, isApproved }) => {
      const { data } = await axiosInstance.patch(`/reviews/${id}/status`, { isApproved });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['public-reviews'] });
    }
  });

  const deleteReview = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.delete(`/reviews/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['public-reviews'] });
    }
  });

  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return !r.isApproved;
    if (filter === 'approved') return r.isApproved;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.isApproved).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-ink">Patient Reviews Moderation</h2>
          <p className="text-sm text-gray-500 font-body mt-1">
            Review patient feedback and approve recovery stories to feature on the homepage.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${
              filter === 'all' ? 'bg-ink text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            All ({reviews.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 ${
              filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-white text-amber-600 border border-gray-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${
              filter === 'approved' ? 'bg-teal text-white' : 'bg-white text-teal border border-gray-200'
            }`}
          >
            Approved ({reviews.length - pendingCount})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-4xl mb-3">⭐</p>
          <h3 className="text-xl font-bold text-ink font-display mb-1">No reviews found</h3>
          <p className="text-gray-500 text-sm">
            {filter === 'pending' 
              ? 'All patient reviews are currently moderated and approved.' 
              : 'New testimonials submitted by patients will show up here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map(rev => (
            <div 
              key={rev._id}
              className={`bg-white p-6 rounded-3xl shadow-sm border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                rev.isApproved ? 'border-gray-100' : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-bold text-ink text-base">{rev.patientName}</span>
                  <span className="text-xs text-gray-400 font-medium">📍 {rev.location || 'Himachal Pradesh'}</span>
                  <span className="text-xs bg-teal/10 text-teal font-bold px-2.5 py-0.5 rounded-full">
                    {rev.condition || 'General Therapy'}
                  </span>
                  <span className="text-xs font-bold text-[#FFC857] flex items-center">
                    {'★'.repeat(rev.rating)} <span className="text-gray-400 ml-1">({rev.rating}/5)</span>
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    rev.isApproved ? 'bg-teal/10 text-teal' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {rev.isApproved ? 'Live on Website' : 'Awaiting Approval'}
                  </span>
                </div>

                <p className="text-gray-700 text-sm leading-relaxed font-body italic">
                  "{rev.comment}"
                </p>

                <span className="text-[11px] text-gray-400 block font-mono">
                  Submitted on {new Date(rev.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                <button
                  onClick={() => toggleApproval.mutate({ id: rev._id, isApproved: !rev.isApproved })}
                  disabled={toggleApproval.isPending}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors shadow-xs ${
                    rev.isApproved
                      ? 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                      : 'bg-teal text-white hover:bg-[#186f68]'
                  }`}
                >
                  {rev.isApproved ? 'Unpublish' : '✓ Approve & Publish'}
                </button>

                {deletingReviewId === rev._id ? (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <button
                      onClick={() => {
                        deleteReview.mutate(rev._id);
                        setDeletingReviewId(null);
                      }}
                      disabled={deleteReview.isPending}
                      className="px-3 py-2 rounded-xl font-bold text-xs bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs"
                    >
                      {deleteReview.isPending ? '...' : 'Confirm?'}
                    </button>
                    <button
                      onClick={() => setDeletingReviewId(null)}
                      className="px-2.5 py-2 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingReviewId(rev._id)}
                    disabled={deleteReview.isPending}
                    className="px-4 py-2 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BlogsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [formError, setFormError] = useState('');
  const [deletingBlogId, setDeletingBlogId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Spine & Posture Care',
    author: 'Dr. Gaurav Sharma (BPT, MPT Ortho)',
    coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    videoUrl: '',
    readTime: '4 min read',
    isFeatured: false,
    tags: 'Physiotherapy, Spine Care, Exercise'
  });

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/blogs');
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingPostId) {
        const { data } = await axiosInstance.put(`/blogs/${editingPostId}`, payload);
        return data;
      } else {
        const { data } = await axiosInstance.post('/blogs', payload);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      handleCancelForm();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to save blog post');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosInstance.delete(`/blogs/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    }
  });

  const handleStartAdd = () => {
    setEditingPostId(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: 'Spine & Posture Care',
      author: 'Dr. Gaurav Sharma (BPT, MPT Ortho)',
      coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
      videoUrl: '',
      readTime: '4 min read',
      isFeatured: false,
      tags: 'Physiotherapy, Spine Care, Exercise'
    });
    setFormError('');
    setShowForm(true);
  };

  const handleStartEdit = (blog) => {
    setEditingPostId(blog._id);
    setFormData({
      title: blog.title || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      category: blog.category || 'Spine & Posture Care',
      author: blog.author || 'Dr. Gaurav Sharma (BPT, MPT Ortho)',
      coverImage: blog.coverImage || '',
      videoUrl: blog.videoUrl || '',
      readTime: blog.readTime || '4 min read',
      isFeatured: !!blog.isFeatured,
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || '')
    });
    setFormError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPostId(null);
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim()) {
      setFormError('Title, summary excerpt, and content are required.');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-ink">Blog, Videos &amp; Case Photos</h2>
          <p className="text-sm text-gray-500 font-body mt-1">
            Publish exercise demonstration videos, medical articles, and clinic treatment updates.
          </p>
        </div>
        <button
          onClick={showForm ? handleCancelForm : handleStartAdd}
          className="bg-coral text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#E55A39] transition-colors shadow-sm text-sm"
        >
          {showForm ? 'Cancel' : '+ New Blog Post'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm mb-8 space-y-6 border border-coral/20">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h3 className="text-xl font-display font-bold text-ink">
              {editingPostId ? 'Edit Blog & Video Guide' : 'Publish New Article / Video Guide'}
            </h3>
            {editingPostId && (
              <span className="text-xs bg-teal/10 text-teal font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Editing Mode
              </span>
            )}
          </div>

          {formError && (
            <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-200">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Article Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. 5 Exercises for Cervical Spondylosis Relief"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                >
                  <option value="Spine & Posture Care">Spine &amp; Posture Care</option>
                  <option value="Cervical & Neck Relief">Cervical &amp; Neck Relief</option>
                  <option value="Knee & Joint Rehab">Knee &amp; Joint Rehab</option>
                  <option value="Sports Injury Recovery">Sports Injury Recovery</option>
                  <option value="Ergonomics & Wellness">Ergonomics &amp; Wellness</option>
                </select>
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Author Name</label>
                <input
                  type="text"
                  placeholder="Dr. Gaurav Sharma"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                />
              </div>

              {/* Read Time */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Read Time</label>
                <input
                  type="text"
                  placeholder="e.g. 4 min read"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cover Image URL */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cover Picture URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Video Guide Link (YouTube / Vimeo / MP4)</label>
                <input
                  type="url"
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Summary / Excerpt *</label>
              <textarea
                required
                rows={2}
                placeholder="Short 2-3 sentence overview that appears on cards and search..."
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Article Content *</label>
              <textarea
                required
                rows={8}
                placeholder="Write full article content, exercise instructions, clinical steps, and recovery tips..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-ink focus:border-teal focus:outline-none text-sm leading-relaxed"
              />
            </div>

            {/* Tags & Featured Checkbox */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
              <div className="w-full sm:w-1/2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="Cervical, Sciatica, Neck Pain, Exercise"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-ink text-xs focus:border-teal focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-bold text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-teal rounded"
                />
                <span>Feature as Top Story on Blog Page</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancelForm}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-ink text-white font-bold px-8 py-2.5 rounded-xl hover:bg-teal transition-all shadow-md text-sm disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : editingPostId ? 'Update Article' : '✓ Publish Article'}
            </button>
          </div>
        </form>
      )}

      {/* Blogs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-3xl animate-pulse"></div>)}
        </div>
      ) : blogs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-4xl mb-3">📝</p>
          <h3 className="text-xl font-bold text-ink font-display mb-1">No articles published yet</h3>
          <p className="text-gray-500 text-sm">Click "+ New Blog Post" above to publish medical guides and videos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {blogs.map(blog => (
            <div
              key={blog._id}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 flex-1">
                {blog.coverImage && (
                  <img
                    src={blog.coverImage}
                    alt={blog.title}
                    className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 hidden sm:block border border-gray-100"
                  />
                )}
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold bg-teal/10 text-teal px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {blog.category}
                    </span>
                    {blog.videoUrl && (
                      <span className="text-[10px] font-black bg-coral/10 text-coral px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        ▶ Video Included
                      </span>
                    )}
                    {blog.isFeatured && (
                      <span className="text-[10px] font-bold bg-[#FFC857]/30 text-amber-900 px-2 py-0.5 rounded-full">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-ink text-base leading-snug truncate">
                    {blog.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{blog.excerpt}</p>
                  <p className="text-[11px] text-gray-400">
                    By {blog.author} • {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                <Link
                  to={`/blog/${blog.slug || blog._id}`}
                  target="_blank"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  View ↗
                </Link>
                <button
                  onClick={() => handleStartEdit(blog)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-teal hover:bg-teal/10 transition-colors"
                >
                  Edit
                </button>
                {deletingBlogId === blog._id ? (
                  <div className="flex items-center gap-1.5 animate-fadeIn">
                    <button
                      onClick={() => {
                        deleteMutation.mutate(blog._id);
                        setDeletingBlogId(null);
                      }}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-xs transition-colors"
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete?'}
                    </button>
                    <button
                      onClick={() => setDeletingBlogId(null)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingBlogId(blog._id)}
                    disabled={deleteMutation.isPending}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

