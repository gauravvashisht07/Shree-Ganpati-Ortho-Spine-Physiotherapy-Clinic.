import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import { useDoctors } from '../../hooks/useDoctors';
import { useServices } from '../../hooks/useServices';
import { useAuth } from '../../context/AuthContext';

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
              <p className="text-xs font-bold text-ink truncate">{user?.email || 'admin@shreeganpati.com'}</p>
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
    const key = email || phone || name;

    if (!patientsMap.has(key)) {
      patientsMap.set(key, {
        id: key,
        name: name,
        email: email,
        phone: phone,
        totalAppointments: 1,
        lastAppointmentDate: appt.date,
        lastDoctor: appt.doctorId?.name || 'Doctor',
        lastService: appt.serviceId?.name || 'Consultation',
        lastStatus: appt.status || 'confirmed'
      });
    } else {
      const existing = patientsMap.get(key);
      existing.totalAppointments += 1;
      if (new Date(appt.date) > new Date(existing.lastAppointmentDate)) {
        existing.lastAppointmentDate = appt.date;
        existing.lastDoctor = appt.doctorId?.name || existing.lastDoctor;
        existing.lastService = appt.serviceId?.name || existing.lastService;
        existing.lastStatus = appt.status || existing.lastStatus;
      }
    }
  });

  const patients = Array.from(patientsMap.values()).filter(p => {
    const match = `${p.name} ${p.email} ${p.phone}`.toLowerCase();
    return match.includes(searchTerm.toLowerCase());
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    doctorId: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM'
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
      setShowAddModal(false);
      setFormData({
        patientName: '',
        patientEmail: '',
        patientPhone: '',
        doctorId: doctors[0]?._id || '',
        serviceId: services[0]?._id || '',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00 AM'
      });
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create patient record');
    }
  });

  const handleStartAdd = () => {
    setFormData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      doctorId: doctors[0]?._id || '',
      serviceId: services[0]?._id || '',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '10:00 AM'
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
    if (!formData.patientPhone.trim() && !formData.patientEmail.trim()) {
      setFormError('Please enter at least a phone number or email');
      return;
    }

    const payload = {
      patientName: formData.patientName.trim(),
      patientEmail: formData.patientEmail.trim() || `${formData.patientPhone.trim()}@clinic.local`,
      patientPhone: formData.patientPhone.trim(),
      doctorId: formData.doctorId || doctors[0]?._id,
      serviceId: formData.serviceId || services[0]?._id,
      date: formData.date,
      timeSlot: formData.timeSlot,
      status: 'confirmed'
    };

    createPatientApptMutation.mutate(payload);
  };

  const timeOptions = [
    '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
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
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-body text-sm text-ink focus:outline-none focus:border-teal"
            />
          </div>
        </div>
      </div>

      {/* Manual Patient Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-display font-bold text-ink">Register Patient &amp; Book Session</h3>
                <p className="text-xs text-gray-500">Record a patient entry and assign an appointment date &amp; time slot.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-ink font-bold text-lg p-2"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rakesh Kumar"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rakesh@example.com (optional)"
                    value={formData.patientEmail}
                    onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
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
                <div className="sm:col-span-2">
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
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
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
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Contact Info</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Total Visits</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Recent Visit</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Recent Service</th>
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
                          <div>{patient.name}</div>
                          <span className="text-[10px] text-teal font-bold uppercase tracking-wider">Verified Patient</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-sm text-gray-600">
                      <div>{patient.email || '—'}</div>
                      {patient.phone && <div className="text-xs text-gray-400 font-mono mt-0.5">{patient.phone}</div>}
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
                      <h3 className="font-bold text-ink text-base">{patient.name}</h3>
                      <p className="text-xs text-gray-500">{patient.email || 'No email'}</p>
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
                <div className="border-t border-gray-50 pt-3 text-xs text-gray-500 flex justify-between">
                  <span>Last Visit: <strong className="text-ink">{patient.lastAppointmentDate}</strong></span>
                  <span>{patient.lastService}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AppointmentsTab() {
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    doctorId: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM'
  });
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();

  const { data: doctors = [] } = useDoctors().getDoctors;
  const { data: services = [] } = useServices().getServices;

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['admin-appointments', filterStatus],
    queryFn: async () => {
      const params = filterStatus !== 'All' ? `?status=${filterStatus}` : '';
      const { data } = await axiosInstance.get(`/appointments${params}`);
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
      setShowAddModal(false);
      setFormData({
        patientName: '',
        patientEmail: '',
        patientPhone: '',
        doctorId: doctors[0]?._id || '',
        serviceId: services[0]?._id || '',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00 AM'
      });
      setFormError('');
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create appointment');
    }
  });

  const handleStartAdd = () => {
    setFormData({
      patientName: '',
      patientEmail: '',
      patientPhone: '',
      doctorId: doctors[0]?._id || '',
      serviceId: services[0]?._id || '',
      date: new Date().toISOString().split('T')[0],
      timeSlot: '10:00 AM'
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
    if (!formData.patientPhone.trim() && !formData.patientEmail.trim()) {
      setFormError('Please enter at least a phone number or email');
      return;
    }

    const payload = {
      patientName: formData.patientName.trim(),
      patientEmail: formData.patientEmail.trim() || `${formData.patientPhone.trim()}@clinic.local`,
      patientPhone: formData.patientPhone.trim(),
      doctorId: formData.doctorId || doctors[0]?._id,
      serviceId: formData.serviceId || services[0]?._id,
      date: formData.date,
      timeSlot: formData.timeSlot,
      status: 'confirmed'
    };

    createAppointmentMutation.mutate(payload);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await axiosInstance.patch(`/appointments/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
    }
  });

  const getStatusStyle = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber/20 text-amber-800';
      case 'confirmed': return 'bg-teal text-white';
      case 'cancelled': return 'bg-gray-200 text-gray-500';
      case 'completed': return 'border-2 border-coral text-coral bg-transparent';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const timeOptions = [
    '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-ink">Appointments</h2>
          <p className="text-sm text-gray-500 font-body mt-1">Live schedule &amp; manual walk-in / date-time booking</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleStartAdd}
            className="bg-coral text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#E55A39] transition-all shadow-sm flex items-center gap-1.5 text-sm"
          >
            <span>+</span>
            <span>Manual Patient Entry</span>
          </button>

          <select 
            className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-ink font-bold focus:outline-none focus:border-teal text-sm"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Manual Patient / Appointment Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 my-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-display font-bold text-ink">Manual Patient &amp; Slot Entry</h3>
                <p className="text-xs text-gray-500">Add a walk-in patient or offline booking to the schedule date &amp; time wise.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-ink font-bold text-lg p-2"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rakesh Kumar"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                  />
                </div>

                {/* Patient Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rakesh@example.com (optional)"
                    value={formData.patientEmail}
                    onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
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
                <div className="sm:col-span-2">
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
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
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
                  className="bg-teal text-white font-bold px-7 py-2.5 rounded-xl hover:bg-[#186f68] transition-all shadow-md text-sm disabled:opacity-50"
                >
                  {createAppointmentMutation.isPending ? 'Saving Entry...' : '✓ Add Patient to Schedule'}
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
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-4xl mb-3">📅</p>
          <h3 className="text-xl font-bold text-ink font-display mb-1">No appointments found</h3>
          <p className="text-gray-500 text-sm">Appointments booked through the website will appear here in real time.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Date / Time</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Patient</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Doctor</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Service</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appt => {
                  const patientName = appt.patientId?.name || appt.patientName || 'Anonymous';
                  const patientPhone = appt.patientId?.phone || '';
                  const patientEmail = appt.patientId?.email || '';
                  const docName = appt.doctorId?.name || 'Assigned Doctor';
                  const serviceName = appt.serviceId?.name || 'General Consultation';

                  return (
                    <tr key={appt._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-6 font-bold text-ink whitespace-nowrap">
                        {appt.date} <span className="text-gray-400 ml-2 font-mono font-medium">{appt.timeSlot}</span>
                      </td>
                      <td className="p-6 font-bold">
                        <div>{patientName}</div>
                        {(patientPhone || patientEmail) && (
                          <div className="text-xs text-gray-400 font-normal">{patientPhone || patientEmail}</div>
                        )}
                      </td>
                      <td className="p-6 text-gray-600">Dr. {docName}</td>
                      <td className="p-6 text-teal font-medium">{serviceName}</td>
                      <td className="p-6">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${getStatusStyle(appt.status)}`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="p-6 text-right whitespace-nowrap">
                        <select
                          value={appt.status}
                          onChange={(e) => updateStatusMutation.mutate({ id: appt._id, status: e.target.value })}
                          className="text-xs font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-ink focus:outline-none focus:border-teal cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="lg:hidden space-y-4">
            {appointments.map(appt => {
              const patientName = appt.patientId?.name || appt.patientName || 'Anonymous';
              const docName = appt.doctorId?.name || 'Assigned Doctor';
              const serviceName = appt.serviceId?.name || 'General Consultation';

              return (
                <div key={appt._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                     <div>
                       <h3 className="font-bold text-ink text-lg">{patientName}</h3>
                       <p className="text-teal text-sm font-medium">{serviceName}</p>
                     </div>
                     <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusStyle(appt.status)}`}>
                       {appt.status}
                     </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                     <p className="font-bold text-ink text-sm">{appt.date} at {appt.timeSlot}</p>
                     <p className="text-gray-500 text-sm">Dr. {docName}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-4">
                    <span className="text-xs text-gray-500 font-bold">Change status:</span>
                    <select
                      value={appt.status}
                      onChange={(e) => updateStatusMutation.mutate({ id: appt._id, status: e.target.value })}
                      className="text-xs font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-ink focus:outline-none focus:border-teal"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function DoctorsTab() {
  const { getDoctors, createDoctor, updateDoctor, deleteDoctor } = useDoctors();
  const [formData, setFormData] = useState({ name: '', email: '', specialization: '', slotDuration: 30 });
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStartAdd = () => {
    setEditingDoctorId(null);
    setFormData({ name: '', email: '', specialization: '', slotDuration: 30 });
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
    });
    setShowAdd(true);
    setErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelForm = () => {
    setShowAdd(false);
    setEditingDoctorId(null);
    setFormData({ name: '', email: '', specialization: '', slotDuration: 30 });
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const payload = {
      ...formData,
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
        <h2 className="text-3xl font-display font-bold text-ink">Manage Doctors</h2>
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
              <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs">Specializations</th>
              <th className="p-6 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getDoctors.data?.map(doc => (
              <tr key={doc._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="p-6 font-bold text-ink whitespace-nowrap">Dr. {doc.name}</td>
                <td className="p-6 text-gray-600">{doc.email}</td>
                <td className="p-6 text-gray-600">
                  <div className="flex flex-wrap gap-1">
                    {doc.specialization?.map(spec => (
                      <span key={spec} className="text-xs bg-gray-100 px-2.5 py-1 rounded-md text-gray-600 font-medium">{spec}</span>
                    ))}
                  </div>
                </td>
                <td className="p-6 text-right space-x-3 whitespace-nowrap">
                  <button 
                    onClick={() => handleStartEdit(doc)} 
                    className="text-teal hover:text-ink font-bold transition-colors px-2 py-1 rounded hover:bg-teal/10"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => { if(window.confirm(`Delete Dr. ${doc.name}?`)) deleteDoctor.mutate(doc._id) }} 
                    className="text-red-500 hover:text-red-700 font-bold transition-colors px-2 py-1 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
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
            <p className="text-gray-500 text-sm mb-3">{doc.email}</p>
            <div className="flex flex-wrap gap-1 mb-4">
              {doc.specialization?.map(spec => (
                <span key={spec} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{spec}</span>
              ))}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-50 pt-4">
              <button 
                onClick={() => handleStartEdit(doc)} 
                className="min-h-[44px] px-4 text-teal hover:bg-teal/10 rounded-lg font-bold text-sm"
              >
                Edit
              </button>
              <button 
                onClick={() => { if(window.confirm(`Delete Dr. ${doc.name}?`)) deleteDoctor.mutate(doc._id) }} 
                className="min-h-[44px] px-4 text-red-500 hover:bg-red-50 rounded-lg font-bold text-sm"
              >
                Delete
              </button>
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
                  <button 
                    onClick={() => { if(window.confirm(`Delete service "${svc.name}"?`)) deleteService.mutate(svc._id) }} 
                    className="text-red-500 hover:text-red-700 font-bold transition-colors px-2 py-1 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
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
              <button 
                onClick={() => { if(window.confirm(`Delete service "${svc.name}"?`)) deleteService.mutate(svc._id) }} 
                className="min-h-[44px] px-4 text-red-500 hover:bg-red-50 rounded-lg font-bold text-sm"
              >
                Delete
              </button>
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

                <button
                  onClick={() => {
                    if (window.confirm(`Delete review from ${rev.patientName}?`)) {
                      deleteReview.mutate(rev._id);
                    }
                  }}
                  disabled={deleteReview.isPending}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
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
                <button
                  onClick={() => {
                    if (window.confirm(`Delete post "${blog.title}"?`)) {
                      deleteMutation.mutate(blog._id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

