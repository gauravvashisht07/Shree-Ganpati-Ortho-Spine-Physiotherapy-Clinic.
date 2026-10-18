import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';
import { useDoctors } from '../../../hooks/useDoctors';
import { useServices } from '../../../hooks/useServices';
import AnalyticsOverview from './AnalyticsOverview';
import AnalyticsTrends from './AnalyticsTrends';
import AnalyticsDemographics from './AnalyticsDemographics';
import AnalyticsRushHours from './AnalyticsRushHours';
import AnalyticsServices from './AnalyticsServices';
import AnalyticsRetention from './AnalyticsRetention';
import PatientDetailModal from './PatientDetailModal';

// Helper to compute date string for preset ranges
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
    case 'thisWeek': {
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
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
    case 'last3Months': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      return { startDate: formatYMD(start), endDate: formatYMD(now) };
    }
    case 'last6Months': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      return { startDate: formatYMD(start), endDate: formatYMD(now) };
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: formatYMD(start), endDate: formatYMD(now) };
    }
    case 'allTime':
    default:
      return { startDate: '', endDate: '' };
  }
}

export default function PatientAnalytics() {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [presetRange, setPresetRange] = useState('allTime');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('All');
  const [selectedService, setSelectedService] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: doctors = [] } = useDoctors().getDoctors;
  const { data: services = [] } = useServices().getServices;

  // Compute active date boundaries
  const dateRange = presetRange === 'custom'
    ? { startDate: customStart, endDate: customEnd }
    : computeDateRange(presetRange);

  // Build query parameter string
  const queryParams = new URLSearchParams();
  if (dateRange.startDate) queryParams.set('startDate', dateRange.startDate);
  if (dateRange.endDate) queryParams.set('endDate', dateRange.endDate);
  if (selectedDoctor !== 'All') queryParams.set('doctorId', selectedDoctor);
  if (selectedService !== 'All') queryParams.set('serviceId', selectedService);
  if (selectedStatus !== 'All') queryParams.set('status', selectedStatus);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  // 1. Overview Query
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview', queryString],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/overview${queryString}`);
      return res.data;
    }
  });

  // 2. Visit Trends Query
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-trends', queryString],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/visit-trends${queryString}`);
      return res.data;
    },
    enabled: activeSubTab === 'trends' || activeSubTab === 'overview'
  });

  // 3. Demographics Query
  const { data: demographics, isLoading: demographicsLoading } = useQuery({
    queryKey: ['analytics-demographics', queryString],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/demographics${queryString}`);
      return res.data;
    },
    enabled: activeSubTab === 'demographics'
  });

  // 4. Rush Hours Query
  const { data: rushData, isLoading: rushLoading } = useQuery({
    queryKey: ['analytics-rush', queryString],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/rush-hours${queryString}`);
      return res.data;
    },
    enabled: activeSubTab === 'rush'
  });

  // 5. Services Query
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['analytics-services', queryString],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/services${queryString}`);
      return res.data;
    },
    enabled: activeSubTab === 'services'
  });

  // 6. Retention Query
  const { data: retentionData, isLoading: retentionLoading } = useQuery({
    queryKey: ['analytics-retention', queryString],
    queryFn: async () => {
      const res = await axiosInstance.get(`/analytics/retention${queryString}`);
      return res.data;
    },
    enabled: activeSubTab === 'retention'
  });

  // Handle CSV Export
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const res = await axiosInstance.get(`/analytics/export${queryString}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Shri_Ganpati_Clinic_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export analytics report: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const subTabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'trends', label: 'Visit Trends', icon: '📈' },
    { id: 'demographics', label: 'Demographics', icon: '👥' },
    { id: 'rush', label: 'Peak Hours & Rush', icon: '⏰' },
    { id: 'services', label: 'Service Analytics', icon: '⚙️' },
    { id: 'retention', label: 'Patient Retention', icon: '🔄' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Export */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-teal bg-teal/10 px-3 py-1 rounded-full">
              Clinic Intelligence
            </span>
          </div>
          <h2 className="text-3xl font-display font-black text-ink mt-1">
            Patient Analytics Dashboard
          </h2>
          <p className="text-xs text-gray-500 font-body">
            Shri Ganpati Ortho &amp; Spine Physiotherapy Clinic • Real-time clinical statistics &amp; patient metrics
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="bg-ink hover:bg-gray-800 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs disabled:opacity-50"
        >
          <span>{isExporting ? '⏳' : '📥'}</span>
          <span>{isExporting ? 'Generating CSV...' : 'Export Filtered CSV'}</span>
        </button>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-2xs space-y-4">
        {/* Preset Date Range Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Period:</span>
          {[
            { id: 'allTime', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'last7', label: 'Last 7 Days' },
            { id: 'last30', label: 'Last 30 Days' },
            { id: 'thisMonth', label: 'This Month' },
            { id: 'lastMonth', label: 'Last Month' },
            { id: 'last3Months', label: 'Last 3 Months' },
            { id: 'thisYear', label: 'This Year' },
            { id: 'custom', label: 'Custom Range...' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPresetRange(p.id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                presetRange === p.id
                  ? 'bg-teal text-white shadow-xs'
                  : 'text-gray-500 hover:text-ink hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Secondary Select Dropdowns & Custom Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Custom Date Inputs if custom range selected */}
          {presetRange === 'custom' && (
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold text-ink focus:outline-none focus:border-teal"
                placeholder="Start Date"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold text-ink focus:outline-none focus:border-teal"
                placeholder="End Date"
              />
            </div>
          )}

          {/* Doctor Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
              Therapist / Doctor
            </label>
            <select
              value={selectedDoctor}
              onChange={e => setSelectedDoctor(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold text-ink focus:outline-none focus:border-teal"
            >
              <option value="All">All Specialists</option>
              {doctors.map(d => (
                <option key={d._id} value={d._id}>Dr. {d.name}</option>
              ))}
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
              Therapy Service
            </label>
            <select
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold text-ink focus:outline-none focus:border-teal"
            >
              <option value="All">All Services</option>
              {services.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
              Appointment Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold text-ink focus:outline-none focus:border-teal"
            >
              <option value="All">All Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="confirmed">Confirmed Only</option>
              <option value="pending">Pending Only</option>
              <option value="cancelled">Cancelled Only</option>
              <option value="no-show">No-Show Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-gray-100/80 rounded-2xl w-full sm:w-max">
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSubTab === tab.id
                ? 'bg-white text-ink shadow-xs'
                : 'text-gray-500 hover:text-ink'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="pt-2">
        {activeSubTab === 'overview' && (
          <div className="space-y-6">
            <AnalyticsOverview overview={overview} isLoading={overviewLoading} />
            {trends && <AnalyticsTrends trends={trends} isLoading={trendsLoading} />}
          </div>
        )}

        {activeSubTab === 'trends' && (
          <AnalyticsTrends trends={trends} isLoading={trendsLoading} />
        )}

        {activeSubTab === 'demographics' && (
          <AnalyticsDemographics
            demographics={demographics}
            isLoading={demographicsLoading}
            onSelectPatient={id => setSelectedPatientId(id)}
          />
        )}

        {activeSubTab === 'rush' && (
          <AnalyticsRushHours rushData={rushData} isLoading={rushLoading} />
        )}

        {activeSubTab === 'services' && (
          <AnalyticsServices servicesData={servicesData} isLoading={servicesLoading} />
        )}

        {activeSubTab === 'retention' && (
          <AnalyticsRetention retentionData={retentionData} isLoading={retentionLoading} />
        )}
      </div>

      {/* Patient Deep History Modal */}
      {selectedPatientId && (
        <PatientDetailModal
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        />
      )}
    </div>
  );
}
