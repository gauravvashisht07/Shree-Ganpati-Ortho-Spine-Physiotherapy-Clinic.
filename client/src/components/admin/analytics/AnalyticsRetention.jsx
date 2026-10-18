import React from 'react';
import { SimpleDonutChart } from './AnalyticsCharts';

export default function AnalyticsRetention({ retentionData, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="bg-white p-6 rounded-3xl h-64 border border-gray-100"></div>
        <div className="bg-white p-6 rounded-3xl h-64 border border-gray-100"></div>
        <div className="bg-white p-6 rounded-3xl h-64 border border-gray-100"></div>
      </div>
    );
  }

  if (!retentionData) return null;

  const donutData = [
    { label: 'Single-Visit Patients', value: retentionData.singleVisitPatients || 0 },
    { label: 'Returning Patients', value: retentionData.returningPatientsCount || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Retention KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Active Patients</span>
          <strong className="text-3xl font-display font-black text-ink block mt-1 font-mono">
            {retentionData.totalPatientsInPeriod || 0}
          </strong>
          <p className="text-[11px] text-gray-400 mt-2">
            Unique patients with appointments recorded in the selected period.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Returning Patients</span>
          <strong className="text-3xl font-display font-black text-teal block mt-1 font-mono">
            {retentionData.returningPatientsCount || 0}
          </strong>
          <p className="text-[11px] text-gray-400 mt-2">
            Patients who attended more than one completed therapy session.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Repeat Visit Rate</span>
          <strong className="text-3xl font-display font-black text-coral block mt-1 font-mono">
            {retentionData.repeatVisitRate || 0}%
          </strong>
          <p className="text-[11px] text-gray-400 mt-2">
            Percentage of patients who returned for follow-up rehabilitation.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Avg. Visits / Patient</span>
          <strong className="text-3xl font-display font-black text-ink block mt-1 font-mono">
            {retentionData.averageVisitsPerPatient || 0}
          </strong>
          <p className="text-[11px] text-gray-400 mt-2">
            Average number of physical completed sessions per treated patient.
          </p>
        </div>
      </div>

      {/* Donut and Retention Explainer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-display font-bold text-ink">
              New vs Returning Patients Ratio
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Comparison of single-session vs multi-session therapy recipients.
            </p>
          </div>

          <div className="py-2">
            <SimpleDonutChart
              data={donutData}
              labelKey="label"
              valueKey="value"
              centerTitle="Retention"
              centerSubtitle="Ratio"
            />
          </div>

          <div className="text-[11px] text-gray-400 text-center pt-2 border-t border-gray-50">
            High repeat rate indicates strong rehabilitation protocol adherence.
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-[#FAF6F0] p-6 sm:p-8 rounded-3xl border border-gray-200/60 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-teal bg-teal/10 px-3 py-1 rounded-full">
              Clinical Quality Metric
            </span>
            <h3 className="text-xl font-display font-bold text-ink mt-3">
              Physiotherapy Course Completion
            </h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              In spine and orthopedic physiotherapy, effective treatment plans typically require a series of 3 to 10 progressive sessions. 
              Patients with only 1 recorded visit may be single consultations, initial assessments, or walk-ins.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-200/60 mt-4">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-500">Total Completed Therapy Visits:</span>
              <span className="font-mono text-ink text-sm">{retentionData.totalCompletedVisits || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-500">Single Consultation Patients:</span>
              <span className="font-mono text-gray-700 text-sm">{retentionData.singleVisitPatients || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-gray-500">Recurring Rehabilitation Patients:</span>
              <span className="font-mono text-teal text-sm">{retentionData.returningPatientsCount || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
