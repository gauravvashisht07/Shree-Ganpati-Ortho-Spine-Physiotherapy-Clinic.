import React, { useState } from 'react';
import { SimpleHorizontalBarChart } from './AnalyticsCharts';

export default function AnalyticsServices({ servicesData, isLoading }) {
  const [sortBy, setSortBy] = useState('completedVisits'); // 'completedVisits', 'totalAppointments', 'revenue', 'least'

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white p-6 rounded-3xl h-64 border border-gray-100"></div>
        <div className="bg-white p-6 rounded-3xl h-80 border border-gray-100"></div>
      </div>
    );
  }

  if (!servicesData || !servicesData.services) return null;

  const rawServices = [...servicesData.services];

  const sortedServices = rawServices.sort((a, b) => {
    if (sortBy === 'completedVisits') return b.completedVisits - a.completedVisits;
    if (sortBy === 'totalAppointments') return b.totalAppointments - a.totalAppointments;
    if (sortBy === 'revenue') return b.revenue - a.revenue;
    if (sortBy === 'least') return a.completedVisits - b.completedVisits;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Top Section: Horizontal Bar Chart of Most Popular */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h3 className="text-xl font-display font-bold text-ink">
              Physiotherapy Services Popularity
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Ranked by completed therapy sessions conducted across clinic records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSortBy('completedVisits')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortBy === 'completedVisits'
                  ? 'bg-white text-teal shadow-2xs'
                  : 'text-gray-500 hover:text-ink'
              }`}
            >
              Most Popular
            </button>
            <button
              onClick={() => setSortBy('revenue')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortBy === 'revenue'
                  ? 'bg-white text-teal shadow-2xs'
                  : 'text-gray-500 hover:text-ink'
              }`}
            >
              Highest Revenue
            </button>
            <button
              onClick={() => setSortBy('least')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortBy === 'least'
                  ? 'bg-white text-teal shadow-2xs'
                  : 'text-gray-500 hover:text-ink'
              }`}
            >
              Least Popular
            </button>
          </div>
        </div>

        <SimpleHorizontalBarChart
          data={sortedServices}
          labelKey="name"
          valueKey="completedVisits"
          secondaryKey="revenue"
          maxItems={8}
        />
      </div>

      {/* Comprehensive Services Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs">
        <div className="mb-4">
          <h3 className="text-lg font-display font-bold text-ink">
            Detailed Service Performance Matrix
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Full breakdown including unique patients, completion share, and revenue.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Service / Treatment</th>
                <th className="p-4 text-center">Fee</th>
                <th className="p-4 text-center">Total Bookings</th>
                <th className="p-4 text-center text-teal">Completed Visits</th>
                <th className="p-4 text-center">Unique Patients</th>
                <th className="p-4 text-center">% Share of Visits</th>
                <th className="p-4 text-right">Revenue (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-ink">
              {sortedServices.map((svc, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-ink">
                    <div>{svc.name}</div>
                    <span className="text-[10px] text-gray-400 font-normal">{svc.duration} mins session</span>
                  </td>
                  <td className="p-4 text-center font-mono font-bold">₹{svc.price}</td>
                  <td className="p-4 text-center font-mono font-bold text-gray-700">{svc.totalAppointments}</td>
                  <td className="p-4 text-center font-mono font-bold text-teal">
                    <span className="bg-teal/10 px-2.5 py-1 rounded-full">
                      {svc.completedVisits}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono text-gray-600">{svc.uniquePatientsCount}</td>
                  <td className="p-4 text-center font-mono text-coral font-bold">
                    {svc.percentageOfCompletedVisits}%
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-ink">
                    ₹{svc.revenue.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
