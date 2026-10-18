import React from 'react';
import { SimpleBarChart, RushHeatmap } from './AnalyticsCharts';

export default function AnalyticsRushHours({ rushData, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white p-6 rounded-3xl h-32 border border-gray-100"></div>
        <div className="bg-white p-6 rounded-3xl h-80 border border-gray-100"></div>
      </div>
    );
  }

  if (!rushData) return null;

  const dayChartData = (rushData.dayOfWeekDistribution || []).map(d => ({
    label: d.day.slice(0, 3),
    fullDay: d.day,
    value: d.completed
  }));

  const slotChartData = (rushData.timeSlotDistribution || []).map(s => ({
    label: s.slot.replace(':00', '').replace(' ', ''),
    fullSlot: s.slot,
    value: s.completed
  }));

  const peak = rushData.peakSummary || {};

  return (
    <div className="space-y-6">
      {/* Peak Summary Header */}
      <div className="bg-gradient-to-r from-teal to-[#16635c] text-white p-6 sm:p-8 rounded-3xl shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-teal-100 bg-white/20 px-3 py-1 rounded-full">
              Clinic Rush &amp; Traffic Summary
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-black mt-2">
              Peak Hours &amp; Capacity Insights
            </h3>
            <p className="text-xs text-teal-100 mt-1 max-w-xl">
              Identifies peak patient congestion based on physical completed visits to optimize staff and therapist scheduling.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl text-center border border-white/15">
              <span className="text-[10px] uppercase font-bold text-teal-200 block">Busiest Day</span>
              <strong className="text-sm font-bold block mt-1">{peak.busiestDay || 'N/A'}</strong>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl text-center border border-white/15">
              <span className="text-[10px] uppercase font-bold text-teal-200 block">Peak Hour Slot</span>
              <strong className="text-sm font-bold block mt-1">{peak.busiestSlot || 'N/A'}</strong>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl text-center border border-white/15">
              <span className="text-[10px] uppercase font-bold text-teal-200 block">Avg Visits / Day</span>
              <strong className="text-lg font-bold font-mono block mt-0.5">
                {peak.averageVisitsPerDay || 0}
              </strong>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl text-center border border-white/15">
              <span className="text-[10px] uppercase font-bold text-teal-200 block">Total Completed</span>
              <strong className="text-lg font-bold font-mono block mt-0.5">
                {peak.totalCompletedVisits || 0}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Rush Heatmap Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-bold text-ink">
              Weekly Patient Rush Heatmap Matrix
            </h3>
            <span className="text-xs font-bold text-coral bg-coral/10 px-3 py-1 rounded-full">
              Day × Time Slot Intensity
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Shows patient volume across days and 30-minute therapy slots. Darker shades indicate heavy clinic rush.
          </p>
        </div>

        <RushHeatmap heatmapData={rushData.heatmapData} />
      </div>

      {/* Grid: Day of Week & Hourly Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Busiest Days */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-display font-bold text-ink">
              Visits by Day of the Week
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Completed patient visits compared from Monday through Sunday.
            </p>
          </div>

          <div className="py-2">
            <SimpleBarChart
              data={dayChartData}
              xKey="label"
              yKey="value"
              height={220}
              barColor="#1F8A82"
            />
          </div>

          <div className="text-[11px] text-gray-400 text-center pt-2 border-t border-gray-50">
            Sunday represents emergency appointments and holiday schedules.
          </div>
        </div>

        {/* Busiest Hours */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-display font-bold text-ink">
              Visits by Time Slot (09:30 AM – 05:00 PM)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Identifies the peak morning and afternoon consultation hours.
            </p>
          </div>

          <div className="py-2">
            <SimpleBarChart
              data={slotChartData}
              xKey="label"
              yKey="value"
              height={220}
              barColor="#FF6F4D"
            />
          </div>

          <div className="text-[11px] text-gray-400 text-center pt-2 border-t border-gray-50">
            Clinic lunch hour (01:00 PM - 02:00 PM) is blocked from regular slots.
          </div>
        </div>
      </div>
    </div>
  );
}
