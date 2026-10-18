import React from 'react';

export default function AnalyticsOverview({ overview, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl h-32 border border-gray-100"></div>
        ))}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="bg-white p-8 rounded-3xl text-center text-gray-500 border border-gray-100">
        No overview analytics available for the selected range.
      </div>
    );
  }

  const kpis = [
    {
      id: 'total-patients',
      title: 'Total Patients',
      value: overview.totalPatients || 0,
      badge: 'All-Time Registered',
      badgeColor: 'bg-teal/10 text-teal',
      icon: '👥',
      definition: 'Unique patient records registered across the clinic database.'
    },
    {
      id: 'today-appointments',
      title: "Today's Appointments",
      value: overview.todayAppointments || 0,
      badge: 'Live Today',
      badgeColor: 'bg-blue-50 text-blue-700',
      icon: '📅',
      definition: 'All scheduled sessions and walk-ins for today.'
    },
    {
      id: 'today-completed',
      title: "Today's Completed Visits",
      value: overview.todayCompletedVisits || 0,
      badge: 'Attended Today',
      badgeColor: 'bg-emerald-50 text-emerald-700',
      icon: '✅',
      definition: 'Patients who physically completed their physiotherapy therapy today.'
    },
    {
      id: 'new-patients',
      title: 'New Patients in Period',
      value: overview.newPatientsInPeriod || 0,
      badge: 'First-Time Clinic Visits',
      badgeColor: 'bg-amber/20 text-amber-800',
      icon: '🌱',
      definition: 'Unique patients whose first recorded clinic completed visit fell in this date range.'
    },
    {
      id: 'returning-patients',
      title: 'Returning Patients',
      value: overview.returningPatientsCount || 0,
      badge: '> 1 Completed Visit',
      badgeColor: 'bg-purple-50 text-purple-700',
      icon: '🔄',
      definition: 'Patients who returned to the clinic for more than one completed therapy session.'
    },
    {
      id: 'total-visits',
      title: 'Total Completed Visits',
      value: overview.totalVisitsInPeriod || 0,
      badge: `${overview.completionRate || 0}% Completion`,
      badgeColor: 'bg-teal/10 text-teal',
      icon: '🩺',
      definition: 'Total successful physiotherapy sessions conducted during the selected period.'
    },
    {
      id: 'cancellation-rate',
      title: 'Cancellation Rate',
      value: `${overview.cancellationRate || 0}%`,
      badge: 'Excludes Completed',
      badgeColor: overview.cancellationRate > 15 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600',
      icon: '🚫',
      definition: 'Percentage of total appointments in this period that were cancelled.'
    },
    {
      id: 'no-show-rate',
      title: 'No-Show Rate',
      value: `${overview.noShowRate || 0}%`,
      badge: 'Missed Sessions',
      badgeColor: overview.noShowRate > 10 ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-600',
      icon: '⚠️',
      definition: 'Percentage of appointments where the patient did not arrive and was marked as no-show.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 8 Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(card => (
          <div
            key={card.id}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-2xs hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{card.icon}</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {card.title}
              </h4>
              <p className="text-3xl font-display font-black text-ink mt-1 font-mono">
                {card.value}
              </p>
            </div>

            <p className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-50 leading-relaxed">
              {card.definition}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue & Completion Summary Banner */}
      <div className="bg-gradient-to-br from-teal/10 via-base to-coral/10 p-6 sm:p-8 rounded-3xl border border-teal/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-teal bg-white/80 px-3 py-1 rounded-full border border-teal/20">
            Estimated Therapy Revenue
          </span>
          <h3 className="text-2xl sm:text-3xl font-display font-black text-ink mt-2">
            ₹{(overview.estimatedRevenue || 0).toLocaleString('en-IN')}
          </h3>
          <p className="text-xs text-gray-600 mt-1 max-w-xl">
            Calculated from {overview.totalVisitsInPeriod || 0} completed patient visits multiplied by consultation service fees. Cancelled or missed appointments are excluded.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 bg-white/90 p-4 rounded-2xl border border-gray-100 shadow-2xs">
          <div className="text-center px-3 border-r border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Bookings</span>
            <span className="text-xl font-bold font-mono text-ink">{overview.totalAppointmentsInPeriod || 0}</span>
          </div>
          <div className="text-center px-3 border-r border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Visits Completed</span>
            <span className="text-xl font-bold font-mono text-teal">{overview.totalVisitsInPeriod || 0}</span>
          </div>
          <div className="text-center px-3">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Completion Rate</span>
            <span className="text-xl font-bold font-mono text-coral">{overview.completionRate || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
