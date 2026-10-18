import React, { useState } from 'react';
import { SimpleAreaChart, SimpleDonutChart, SimpleBarChart } from './AnalyticsCharts';

export default function AnalyticsTrends({ trends, isLoading }) {
  const [trendMetric, setTrendMetric] = useState('completed'); // 'completed' or 'total'

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="bg-white p-6 rounded-3xl h-72 border border-gray-100"></div>
        <div className="bg-white p-6 rounded-3xl h-72 border border-gray-100"></div>
      </div>
    );
  }

  if (!trends) return null;

  const dailyChartData = (trends.dailyTrends || []).map(d => ({
    label: d.date.slice(5), // MM-DD
    fullDate: d.date,
    value: trendMetric === 'completed' ? d.completed : d.total
  }));

  const monthlyChartData = (trends.monthlyTrends || []).map(m => ({
    label: m.month,
    value: m.completed
  }));

  const statusDonutData = [
    { label: 'Completed', value: trends.statusDistribution?.completed || 0 },
    { label: 'Confirmed', value: trends.statusDistribution?.confirmed || 0 },
    { label: 'Pending', value: trends.statusDistribution?.pending || 0 },
    { label: 'Cancelled', value: trends.statusDistribution?.cancelled || 0 },
    { label: 'No-Show', value: trends.statusDistribution?.['no-show'] || 0 }
  ];

  const growthChartData = (trends.patientGrowth || []).map(g => ({
    label: g.month,
    value: g.cumulativePatients
  }));

  return (
    <div className="space-y-6">
      {/* Daily Visit Trend Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h3 className="text-xl font-display font-bold text-ink">
              Daily Patient Visits Trend
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Physical clinic patient traffic tracked day by day in the selected date range.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setTrendMetric('completed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                trendMetric === 'completed'
                  ? 'bg-white text-teal shadow-2xs'
                  : 'text-gray-500 hover:text-ink'
              }`}
            >
              Completed Visits
            </button>
            <button
              onClick={() => setTrendMetric('total')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                trendMetric === 'total'
                  ? 'bg-white text-teal shadow-2xs'
                  : 'text-gray-500 hover:text-ink'
              }`}
            >
              All Bookings
            </button>
          </div>
        </div>

        <SimpleAreaChart
          data={dailyChartData}
          xKey="label"
          yKey="value"
          height={260}
          strokeColor={trendMetric === 'completed' ? '#1F8A82' : '#FF6F4D'}
          fillGradientStart={
            trendMetric === 'completed'
              ? 'rgba(31, 138, 130, 0.35)'
              : 'rgba(255, 111, 77, 0.35)'
          }
          tooltipLabel={trendMetric === 'completed' ? 'Visits' : 'Bookings'}
        />
      </div>

      {/* Grid: Status Distribution & Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Donut */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-display font-bold text-ink">
              Appointment Status Distribution
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Breakdown of all appointments scheduled in this period.
            </p>
          </div>

          <div className="py-4">
            <SimpleDonutChart
              data={statusDonutData}
              labelKey="label"
              valueKey="value"
              centerTitle="Bookings"
              centerSubtitle="in period"
            />
          </div>

          <div className="text-[11px] text-gray-400 text-center pt-2 border-t border-gray-50">
            * Cancelled and no-show sessions do not count toward completed clinical visits.
          </div>
        </div>

        {/* Monthly Patient Visits */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-display font-bold text-ink">
              Monthly Patient Visits
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Month-over-month completed patient visits across clinic records.
            </p>
          </div>

          <div className="py-2">
            <SimpleBarChart
              data={monthlyChartData}
              xKey="label"
              yKey="value"
              height={220}
              barColor="#1F8A82"
            />
          </div>

          <div className="text-[11px] text-gray-400 text-center pt-2 border-t border-gray-50">
            Total completed sessions by billing month.
          </div>
        </div>
      </div>

      {/* Patient Growth Trend */}
      {growthChartData.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs">
          <div className="mb-6">
            <h3 className="text-lg font-display font-bold text-ink">
              Cumulative Registered Patient Growth
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Historical growth of unique patient records registered at Shri Ganpati Clinic.
            </p>
          </div>

          <SimpleAreaChart
            data={growthChartData}
            xKey="label"
            yKey="value"
            height={200}
            strokeColor="#FF6F4D"
            fillGradientStart="rgba(255, 111, 77, 0.3)"
            fillGradientEnd="rgba(255, 111, 77, 0.02)"
            tooltipLabel="Total Registered Patients"
          />
        </div>
      )}
    </div>
  );
}
