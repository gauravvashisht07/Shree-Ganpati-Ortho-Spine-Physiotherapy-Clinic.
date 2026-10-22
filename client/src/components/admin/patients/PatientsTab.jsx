import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';
import { useDoctors } from '../../../hooks/useDoctors';
import { useServices } from '../../../hooks/useServices';
import PatientDetailModal from '../analytics/PatientDetailModal';

// Helper to compute date range strings
function computeDateRange(preset) {
  const now = new Date();
  const formatYMD = (d) => d.toISOString().split('T')[0];

  switch (preset) {
    case 'today': {
      const today = formatYMD(now);
      return { startDate: today, endDate: today };
    }
    case 'yesterday': {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatYMD(yest);
      return { startDate: yestStr, endDate: yestStr };
    }
    case 'last7': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { startDate: formatYMD(start), endDate: formatYMD(now) };
    }
    case 'last30': {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { startDate: formatYMD(start), endDate: formatYMD(now) };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatYMD(start), endDate: formatYMD(now) };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: formatYMD(start), endDate: formatYMD(end) };
    }
    default:
      return { startDate: '', endDate: '' };
  }
}

export default function PatientsTab() {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];

  // Filters and Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [datePreset, setDatePreset] = useState('allTime');
  const [singleDate, setSingleDate] = useState(todayStr);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('lastVisit');
  const [page, setPage] = useState(1);

  // Modal States
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Live duplicate detection state
  const [matchedExistingPatients, setMatchedExistingPatients] = useState([]);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientAddress: '',
    patientAge: '',
    patientGender: 'male',
    registrationDate: todayStr,
    recordVisit: true,
    visitDate: todayStr,
    timeSlot: '10:00 AM',
    doctorId: '',
    serviceId: '',
    fee: '',
    paymentStatus: 'paid',
    notes: ''
  });

  const { data: doctors = [] } = useDoctors().getDoctors;
  const { data: services = [] } = useServices().getServices;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Compute active date boundaries
  let effectiveStartDate = '';
  let effectiveEndDate = '';
  let effectiveSingleDate = '';

  if (datePreset === 'single') {
    effectiveSingleDate = singleDate;
  } else if (datePreset === 'custom') {
    effectiveStartDate = customStart;
    effectiveEndDate = customEnd;
  } else if (datePreset !== 'allTime') {
    const range = computeDateRange(datePreset);
    effectiveStartDate = range.startDate;
    effectiveEndDate = range.endDate;
  }

  // Fetch Patients from Server API
  const { data: patientsData, isLoading, isFetching } = useQuery({
    queryKey: [
      'admin-patients',
      debouncedSearch,
      datePreset,
      effectiveSingleDate,
      effectiveStartDate,
      effectiveEndDate,
      filterType,
      sortBy,
      page
    ],
    queryFn: async () => {
      const params = {
        page,
        limit: 25,
        sort: sortBy
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterType !== 'all') params.filterType = filterType;
      if (effectiveSingleDate) params.date = effectiveSingleDate;
      if (effectiveStartDate) params.startDate = effectiveStartDate;
      if (effectiveEndDate) params.endDate = effectiveEndDate;

      const res = await axiosInstance.get('/patients', { params });
      return res.data;
    }
  });

  const patients = patientsData?.patients || [];
  const totalCount = patientsData?.totalCount || 0;
  const totalPages = patientsData?.totalPages || 1;
  const stats = patientsData?.stats || { totalRegistered: 0, noVisitsYet: 0, inFilteredView: 0 };

  // Live duplicate detection lookup when typing phone, name, ID, or village in Add Modal
  useEffect(() => {
    if (!showAddModal || selectedExistingPatient) return;
    const query = formData.patientPhone.trim() || formData.patientName.trim();
    if (query.length < 2) {
      setMatchedExistingPatients([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axiosInstance.get('/patients/search', { params: { q: query } });
        setMatchedExistingPatients(res.data || []);
      } catch (err) {
        console.warn('Autocomplete search failed:', err.message);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [formData.patientPhone, formData.patientName, showAddModal, selectedExistingPatient]);

  // Create Patient & Visit Mutation
  const createPatientVisitMutation = useMutation({
    mutationFn: async (payload) => {
      if (payload.recordVisit) {
        // Record as clinical visit
        const res = await axiosInstance.post('/visits', {
          patientId: payload.patientId || undefined,
          patientName: payload.patientName,
          patientPhone: payload.patientPhone,
          patientEmail: payload.patientEmail,
          patientAddress: payload.patientAddress,
          patientAge: payload.patientAge,
          patientGender: payload.patientGender,
          visitDate: payload.visitDate,
          timeSlot: payload.timeSlot,
          doctorId: payload.doctorId || undefined,
          serviceId: payload.serviceId || undefined,
          fee: payload.fee !== '' ? Number(payload.fee) : undefined,
          paymentStatus: payload.paymentStatus,
          notes: payload.notes
        });
        return res.data;
      } else {
        // Just create patient record
        const res = await axiosInstance.post('/patients', {
          name: payload.patientName,
          phone: payload.patientPhone,
          email: payload.patientEmail,
          address: payload.patientAddress,
          age: payload.patientAge,
          gender: payload.patientGender,
          registrationDate: payload.registrationDate
        });
        return res.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-patients'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-rush'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-services'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-retention'] });
      queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });

      setShowAddModal(false);
      setSelectedExistingPatient(null);
      setMatchedExistingPatients([]);
      setFormError('');

      const patientName = data.visit?.patientId?.name || data.patient?.name || 'Patient';
      const patientId = data.visit?.patientId?.patientId || data.patient?.patientId || '';
      setSuccessToast(`✓ Successfully recorded record for ${patientName} (${patientId})`);
      setTimeout(() => setSuccessToast(''), 5000);
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to save record. Please check the fields.');
    }
  });

  const handleStartAdd = (prefillPatient = null) => {
    setFormError('');
    if (prefillPatient) {
      setSelectedExistingPatient(prefillPatient);
      setFormData({
        patientName: prefillPatient.name || '',
        patientPhone: prefillPatient.phone || '',
        patientEmail: prefillPatient.email || '',
        patientAddress: prefillPatient.address || '',
        patientAge: prefillPatient.age !== undefined && prefillPatient.age !== null ? prefillPatient.age : '',
        patientGender: prefillPatient.gender || 'male',
        registrationDate: prefillPatient.registrationDate || todayStr,
        recordVisit: true,
        visitDate: todayStr,
        timeSlot: '10:00 AM',
        doctorId: doctors[0]?._id || '',
        serviceId: services[0]?._id || '',
        fee: services[0]?.price || '',
        paymentStatus: 'paid',
        notes: ''
      });
    } else {
      setSelectedExistingPatient(null);
      setMatchedExistingPatients([]);
      setFormData({
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        patientAddress: '',
        patientAge: '',
        patientGender: 'male',
        registrationDate: todayStr,
        recordVisit: true,
        visitDate: todayStr,
        timeSlot: '10:00 AM',
        doctorId: doctors[0]?._id || '',
        serviceId: services[0]?._id || '',
        fee: services[0]?.price || '',
        paymentStatus: 'paid',
        notes: ''
      });
    }
    setShowAddModal(true);
  };

  const handleSelectExistingMatch = (matched) => {
    setSelectedExistingPatient(matched);
    setMatchedExistingPatients([]);
    setFormData(prev => ({
      ...prev,
      patientName: matched.name || prev.patientName,
      patientPhone: matched.phone || prev.patientPhone,
      patientEmail: matched.email && !matched.email.endsWith('@clinic.local') ? matched.email : prev.patientEmail,
      patientAddress: matched.address || prev.patientAddress,
      patientAge: matched.age !== undefined ? matched.age : prev.patientAge,
      patientGender: matched.gender || prev.patientGender,
      recordVisit: true
    }));
  };

  const handleUnlinkExisting = () => {
    setSelectedExistingPatient(null);
  };

  const handleServiceChange = (svcId) => {
    const svc = services.find(s => s._id === svcId);
    setFormData(prev => ({
      ...prev,
      serviceId: svcId,
      fee: svc ? svc.price : prev.fee
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.patientName.trim()) {
      setFormError('Patient Name is required');
      return;
    }

    if (formData.recordVisit && !formData.visitDate) {
      setFormError('Actual Visit Date is required');
      return;
    }

    createPatientVisitMutation.mutate({
      ...formData,
      patientId: selectedExistingPatient?._id
    });
  };

  const timeOptions = [
    '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-black text-ink tracking-tight">Patients Directory</h2>
          <p className="text-sm text-gray-500 mt-1">
            Permanent clinical records, historical visits, repeat patient tracking &amp; demographics.
          </p>
        </div>

        <button
          onClick={() => handleStartAdd()}
          className="bg-coral text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#E55A39] transition-all shadow-md flex items-center gap-2 text-sm shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Patient or Visit</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 flex justify-between items-center shadow-xs animate-fadeIn">
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Unique Patients
          </span>
          <p className="text-2xl font-display font-black text-ink mt-1 font-mono">
            {stats.totalRegistered}
          </p>
          <span className="text-[11px] text-teal font-medium mt-1 block">
            Permanent clinic files
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Matching Filter View
          </span>
          <p className="text-2xl font-display font-black text-teal mt-1 font-mono">
            {stats.inFilteredView}
          </p>
          <span className="text-[11px] text-gray-500 mt-1 block">
            {datePreset === 'allTime' ? 'All historical records' : `Filtered by ${datePreset}`}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Patients Without Visits
          </span>
          <p className="text-2xl font-display font-black text-amber-700 mt-1 font-mono">
            {stats.noVisitsYet}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Registered but 0 completed visits
          </span>
        </div>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="flex-1 min-w-[260px]">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search by ID (e.g. SGP-1001), name, phone, address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 pl-9 pr-4 py-2.5 rounded-xl text-sm font-body text-ink focus:outline-none focus:border-teal"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Date Presets Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 text-ink text-xs font-bold px-3 py-2.5 rounded-xl focus:border-teal focus:outline-none cursor-pointer"
            >
              <option value="allTime">📅 Date: All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Previous Month</option>
              <option value="single">Single Date...</option>
              <option value="custom">Custom Date Range...</option>
            </select>

            {/* Filter Type Dropdown */}
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 text-ink text-xs font-bold px-3 py-2.5 rounded-xl focus:border-teal focus:outline-none cursor-pointer"
            >
              <option value="all">👥 Filter: All Patients</option>
              <option value="visited">Patients with Visits</option>
              <option value="new">New Patients in Period</option>
              <option value="returning">Returning Patients</option>
              <option value="no-visits">No Visits Yet (0 Visits)</option>
            </select>

            {/* Sorting Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-ink text-xs font-bold px-3 py-2.5 rounded-xl focus:border-teal focus:outline-none cursor-pointer"
            >
              <option value="lastVisit">Sort: Most Recent Visit</option>
              <option value="totalVisitsDesc">Sort: Total Visits (High to Low)</option>
              <option value="totalVisitsAsc">Sort: Total Visits (Low to High)</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="patientId">Sort: Patient ID</option>
            </select>
          </div>
        </div>

        {/* Dynamic Secondary Date Inputs for Single or Custom Range */}
        {datePreset === 'single' && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 animate-fadeIn">
            <span className="text-xs font-bold text-gray-500">Select Date:</span>
            <input
              type="date"
              value={singleDate}
              onChange={(e) => {
                setSingleDate(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
            />
            <span className="text-xs text-gray-400">
              Showing patients with completed visits on {singleDate}
            </span>
          </div>
        )}

        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 animate-fadeIn">
            <span className="text-xs font-bold text-gray-500">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
            />
            <span className="text-xs font-bold text-gray-500">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-ink focus:border-teal focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Add Patient & Visit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-7 border border-gray-100 my-auto max-h-[95dvh] sm:max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-ink">
                  {selectedExistingPatient ? 'Record Visit for Existing Patient' : 'Add Patient & Clinical Visit'}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedExistingPatient
                    ? `Adding a new visit to permanent record of ${selectedExistingPatient.name} (${selectedExistingPatient.patientId})`
                    : 'System automatically checks for existing patients to prevent duplicates.'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedExistingPatient(null);
                  setMatchedExistingPatients([]);
                }}
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

            {/* Existing Patient Matched Banner */}
            {selectedExistingPatient ? (
              <div className="p-3 my-3 bg-teal/10 border border-teal/30 rounded-xl flex items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-teal">
                  <span className="font-bold">✓ Selected Patient: </span>
                  <span className="font-bold text-ink">{selectedExistingPatient.name}</span>
                  <span className="font-mono text-gray-600 ml-1">({selectedExistingPatient.patientId})</span>
                  <span className="ml-2 bg-teal text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {selectedExistingPatient.totalVisits || 0} existing visits
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleUnlinkExisting}
                  className="text-xs font-bold text-coral hover:underline shrink-0"
                >
                  Change / Create New
                </button>
              </div>
            ) : matchedExistingPatients.length > 0 ? (
              /* Live Autocomplete Matches */
              <div className="p-3 my-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 shrink-0 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <span>⚠️</span>
                  <span>Existing Patient Match Found:</span>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {matchedExistingPatients.map(m => (
                    <div
                      key={m._id}
                      className="bg-white p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs hover:border-amber-300 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-ink text-sm">{m.name}</strong>
                          <span className="font-mono text-teal font-bold bg-teal/10 px-2 py-0.5 rounded text-[11px] border border-teal/20">
                            {m.patientId || 'SGP-XXXX'}
                          </span>
                          {m.age && (
                            <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                              {m.age} yrs
                            </span>
                          )}
                          {m.gender && m.gender !== 'prefer-not-to-say' && (
                            <span className="text-[10px] font-bold text-teal bg-teal/5 px-2 py-0.5 rounded-full capitalize">
                              {m.gender}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-600 flex items-center gap-2 flex-wrap">
                          {m.address && (
                            <span className="text-gray-700 font-medium">📍 {m.address}</span>
                          )}
                          {m.phone ? (
                            <span className="font-mono">📞 {m.phone}</span>
                          ) : (
                            <span className="text-gray-400 italic">No phone registered</span>
                          )}
                          <span className="text-coral font-bold font-mono">
                            {m.totalVisits || 0} visits (Last: {m.lastVisitDate || 'No visits'})
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectExistingMatch(m)}
                        className="bg-teal text-white font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-[#186f68] transition-colors shrink-0 self-end sm:self-center"
                      >
                        ✓ Select This Patient
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-4">
                
                {/* Section 1: Patient Details */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Patient Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Patient Name *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(selectedExistingPatient)}
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.patientName}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        disabled={Boolean(selectedExistingPatient)}
                        placeholder="e.g. 98160 12345"
                        value={formData.patientPhone}
                        onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Age (Years)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="e.g. 35"
                        value={formData.patientAge}
                        onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Gender
                      </label>
                      <select
                        value={formData.patientGender}
                        onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm capitalize"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Address / Town / Village
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ward 4, Nadaun"
                        value={formData.patientAddress}
                        onChange={(e) => setFormData({ ...formData, patientAddress: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Clinical Visit (Historical or Current) */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Clinical Visit Details
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-teal">
                      <input
                        type="checkbox"
                        checked={formData.recordVisit}
                        onChange={(e) => setFormData({ ...formData, recordVisit: e.target.checked })}
                        className="rounded text-teal focus:ring-teal"
                      />
                      <span>Record Clinical Visit</span>
                    </label>
                  </div>

                  {formData.recordVisit && (
                    <div className="space-y-3 bg-[#FAF6F0] p-4 rounded-2xl border border-gray-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Actual Visit Date */}
                        <div>
                          <label className="block text-xs font-bold text-coral uppercase tracking-wider mb-1">
                            Actual Visit Date *
                          </label>
                          <input
                            type="date"
                            required
                            value={formData.visitDate}
                            onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                            className="w-full bg-white border border-gray-200 p-2.5 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                          />
                          <span className="text-[10px] text-gray-400 mt-0.5 block">
                            Backdated dates (e.g. 10 Oct 2026) are fully supported.
                          </span>
                        </div>

                        {/* Time Slot */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Time Slot
                          </label>
                          <select
                            value={formData.timeSlot}
                            onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                            className="w-full bg-white border border-gray-200 p-2.5 rounded-xl font-bold text-coral focus:border-teal focus:outline-none text-sm font-mono"
                          >
                            {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>

                        {/* Doctor */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Doctor / Physiotherapist *
                          </label>
                          <select
                            value={formData.doctorId}
                            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                            className="w-full bg-white border border-gray-200 p-2.5 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                          >
                            {doctors.map(d => (
                              <option key={d._id} value={d._id}>Dr. {d.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Service */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Therapy Service *
                          </label>
                          <select
                            value={formData.serviceId}
                            onChange={(e) => handleServiceChange(e.target.value)}
                            className="w-full bg-white border border-gray-200 p-2.5 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                          >
                            {services.map(s => (
                              <option key={s._id} value={s._id}>{s.name} (₹{s.price})</option>
                            ))}
                          </select>
                        </div>

                        {/* Fee */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Fee Charged (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.fee}
                            onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                            className="w-full bg-white border border-gray-200 p-2.5 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                          />
                        </div>

                        {/* Payment Status */}
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Payment Status
                          </label>
                          <select
                            value={formData.paymentStatus}
                            onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                            className="w-full bg-white border border-gray-200 p-2.5 rounded-xl font-bold text-ink focus:border-teal focus:outline-none text-sm"
                          >
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid / Pending</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          Clinical Notes / Chief Complaint
                        </label>
                        <textarea
                          rows="2"
                          placeholder="e.g. Patient presents with lower back stiffness, applied IFT and spinal stretching"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-ink focus:border-teal focus:outline-none text-sm"
                        ></textarea>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Footer */}
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
                  disabled={createPatientVisitMutation.isPending}
                  className="bg-teal text-white font-bold px-7 py-2.5 rounded-xl hover:bg-[#186f68] transition-all shadow-md text-sm disabled:opacity-50"
                >
                  {createPatientVisitMutation.isPending ? 'Saving Record...' : '✓ Save to Clinical Records'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patients Table & List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-4xl mb-3">👥</p>
          <h3 className="text-xl font-bold text-ink font-display mb-1">No patient records found</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {searchTerm || filterType !== 'all' || datePreset !== 'allTime'
              ? 'No patients match your current filter or search criteria.'
              : 'Add your first patient using the "+ Add Patient or Visit" button above.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="py-4 px-5 font-bold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    Patient ID
                  </th>
                  <th className="py-4 px-5 font-bold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    Patient Name &amp; Info
                  </th>
                  <th className="py-4 px-5 font-bold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    Phone &amp; Location
                  </th>
                  <th className="py-4 px-5 font-bold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    Total Visits
                  </th>
                  <th className="py-4 px-5 font-bold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    First Visit
                  </th>
                  <th className="py-4 px-5 font-bold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap">
                    Last Visit
                  </th>
                  <th className="py-4 px-5 font-bold text-gray-500 uppercase tracking-wider text-xs whitespace-nowrap text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr
                    key={p._id}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Patient ID */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold bg-teal/10 text-teal px-2.5 py-1 rounded-md border border-teal/20">
                        {p.patientId || 'SGP-XXXX'}
                      </span>
                    </td>

                    {/* Patient Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-coral/10 text-coral flex items-center justify-center font-bold text-sm shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-ink text-sm hover:text-teal cursor-pointer" onClick={() => setSelectedPatientId(p._id)}>
                              {p.name}
                            </span>
                            {p.age && (
                              <span className="text-[11px] font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {p.age} yrs
                              </span>
                            )}
                            {p.gender && p.gender !== 'prefer-not-to-say' && (
                              <span className="text-[10px] font-bold text-teal bg-teal/5 px-2 py-0.5 rounded-full capitalize">
                                {p.gender}
                              </span>
                            )}
                          </div>
                          {p.email && !p.email.endsWith('@clinic.local') && (
                            <span className="text-xs text-gray-400 block mt-0.5">{p.email}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone & Location */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="text-xs font-mono font-bold text-gray-700">
                        {p.phone || <span className="text-gray-300 font-sans italic">No phone</span>}
                      </div>
                      {p.address && (
                        <div className="text-[11px] text-gray-500 mt-0.5 max-w-[200px] truncate" title={p.address}>
                          📍 {p.address}
                        </div>
                      )}
                    </td>

                    {/* Total Visits Badge */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      {p.totalVisits > 0 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal/10 text-teal border border-teal/20">
                          {p.totalVisits} visit{p.totalVisits > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          No visits yet
                        </span>
                      )}
                    </td>

                    {/* First Visit */}
                    <td className="py-4 px-5 whitespace-nowrap text-xs font-mono text-gray-600">
                      {p.firstVisitDate || <span className="text-gray-300 font-sans italic">—</span>}
                    </td>

                    {/* Last Visit */}
                    <td className="py-4 px-5 whitespace-nowrap text-xs font-mono font-bold text-coral">
                      {p.lastVisitDate || <span className="text-gray-300 font-sans italic">—</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStartAdd(p)}
                          className="text-xs font-bold text-coral bg-coral/10 hover:bg-coral/20 px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Record another visit for this patient"
                        >
                          <span>+</span>
                          <span>Visit</span>
                        </button>
                        <button
                          onClick={() => setSelectedPatientId(p._id)}
                          className="text-xs font-bold text-teal bg-teal/5 hover:bg-teal/10 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <span>📜</span>
                          <span>Clinical History</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="lg:hidden space-y-3.5">
            {patients.map(p => (
              <div
                key={p._id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-coral/10 text-coral flex items-center justify-center font-bold text-sm shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-teal bg-teal/10 px-2 py-0.5 rounded border border-teal/20">
                          {p.patientId || 'SGP-XXXX'}
                        </span>
                        <h4 className="font-bold text-ink text-base">{p.name}</h4>
                        {p.age && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {p.age} yrs
                          </span>
                        )}
                      </div>
                      {p.phone && (
                        <p className="text-xs text-gray-600 font-mono mt-0.5">📞 {p.phone}</p>
                      )}
                    </div>
                  </div>

                  {p.totalVisits > 0 ? (
                    <span className="text-xs font-bold bg-teal/10 text-teal px-2.5 py-1 rounded-full border border-teal/20">
                      {p.totalVisits} visit{p.totalVisits > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                      No visits
                    </span>
                  )}
                </div>

                {p.address && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-xl">
                    📍 {p.address}
                  </p>
                )}

                <div className="border-t border-gray-50 pt-2.5 text-xs text-gray-500 flex justify-between items-center font-mono">
                  <span>First: <strong className="text-ink font-sans">{p.firstVisitDate || '—'}</strong></span>
                  <span>Last: <strong className="text-coral font-sans">{p.lastVisitDate || '—'}</strong></span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleStartAdd(p)}
                    className="text-xs font-bold text-coral bg-coral/10 hover:bg-coral/20 py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span>+</span>
                    <span>Record Visit</span>
                  </button>
                  <button
                    onClick={() => setSelectedPatientId(p._id)}
                    className="text-xs font-bold text-teal bg-teal/5 hover:bg-teal/10 py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <span>📜</span>
                    <span>Clinical History</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 text-xs">
              <span className="text-gray-500">
                Page <strong className="text-ink">{page}</strong> of <strong className="text-ink">{totalPages}</strong> ({totalCount} total patients)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-ink font-bold disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-ink font-bold disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
