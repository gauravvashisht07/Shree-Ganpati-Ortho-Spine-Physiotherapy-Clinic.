import React, { useState } from 'react';
import { SimpleBarChart, SimpleDonutChart } from './AnalyticsCharts';

export default function AnalyticsDemographics({ demographics, isLoading, onSelectPatient }) {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="bg-white p-6 rounded-3xl h-72 border border-gray-100"></div>
        <div className="bg-white p-6 rounded-3xl h-72 border border-gray-100"></div>
      </div>
    );
  }

  if (!demographics) return null;

  const ageData = (demographics.ageGroupAnalytics || []).map(a => ({
    label: a.category.replace(' (', '\n('),
    rawCategory: a.category,
    value: a.count,
    percentage: a.percentage,
    patients: a.patients
  }));

  const activeGroupObj = demographics.ageGroupAnalytics?.find(
    a => a.category === selectedAgeGroup
  );

  const genderDonutData = (demographics.genderAnalytics || []).map(g => ({
    label: g.gender,
    value: g.count,
    percentage: g.percentage
  }));

  return (
    <div className="space-y-6">
      {/* Top Grid: Age Groups & Gender */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Groups Distribution */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-ink">
                Patient Distribution by Age Group
              </h3>
              <span className="text-xs text-teal font-bold bg-teal/10 px-2.5 py-1 rounded-full">
                Click bar to filter
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Identifies which age demographics visit Shri Ganpati Clinic most frequently.
            </p>
          </div>

          <div className="py-2">
            <SimpleBarChart
              data={ageData}
              xKey="rawCategory"
              yKey="value"
              height={230}
              barColor="#1F8A82"
              onBarClick={(item) => {
                setSelectedAgeGroup(item.rawCategory === selectedAgeGroup ? null : item.rawCategory);
              }}
              activeKey={selectedAgeGroup}
            />
          </div>

          <div className="text-[11px] text-gray-400 text-center pt-2 border-t border-gray-50">
            {selectedAgeGroup ? (
              <span className="text-coral font-bold">
                Filtered: {selectedAgeGroup} ({activeGroupObj?.count || 0} patients). Click again to clear.
              </span>
            ) : (
              'Click any age bar above to inspect patient roster below.'
            )}
          </div>
        </div>

        {/* Gender Breakdown */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-lg font-display font-bold text-ink">
              Gender Distribution
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Based on recorded patient records. Unspecified genders are safely classified as Unknown.
            </p>
          </div>

          <div className="py-2">
            <SimpleDonutChart
              data={genderDonutData}
              labelKey="label"
              valueKey="value"
              centerTitle="Patients"
              centerSubtitle="by gender"
            />
          </div>

          {/* Quick Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-gray-50">
            {demographics.genderAnalytics?.map((g, idx) => (
              <div key={idx} className="bg-[#FAF6F0] p-2.5 rounded-xl text-center">
                <span className="text-[10px] uppercase font-bold text-gray-500 block truncate">
                  {g.gender}
                </span>
                <span className="text-base font-bold font-mono text-ink">
                  {g.count} <span className="text-[10px] text-gray-400">({g.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Age Group Patient List Drill-down */}
      {selectedAgeGroup && activeGroupObj && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-coral/30 shadow-md animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-coral bg-coral/10 px-3 py-1 rounded-full">
                Drill-Down Patient Roster
              </span>
              <h4 className="text-xl font-display font-bold text-ink mt-1">
                {selectedAgeGroup} ({activeGroupObj.patients?.length || 0} Patients)
              </h4>
              <p className="text-xs text-gray-500">
                Click any patient to inspect their complete visit history and clinical timeline.
              </p>
            </div>
            <button
              onClick={() => setSelectedAgeGroup(null)}
              className="text-gray-400 hover:text-ink font-bold text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors"
            >
              ✕ Clear Filter
            </button>
          </div>

          {activeGroupObj.patients?.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No patient records found in this age bracket.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {activeGroupObj.patients.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => p.id && onSelectPatient && onSelectPatient(p.id)}
                  className="p-3.5 rounded-2xl border border-gray-100 hover:border-teal/50 hover:bg-teal/5 cursor-pointer transition-all bg-gray-50/50"
                >
                  <div className="flex justify-between items-start">
                    <strong className="text-sm text-ink truncate block">{p.name}</strong>
                    <span className="text-[10px] font-bold text-teal bg-teal/10 px-2 py-0.5 rounded-full shrink-0">
                      {p.completedVisits} visit{p.completedVisits === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    <p>Age: {p.age !== null && p.age !== undefined ? `${p.age} yrs` : 'Unknown'} • {p.gender}</p>
                    {p.address && <p className="truncate">📍 {p.address}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Age x Gender Cross Matrix */}
      {demographics.crossAnalysis && demographics.crossAnalysis.length > 0 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-lg font-display font-bold text-ink">
              Age Group × Gender Cross Analysis
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Demographic distribution comparing male, female, and other patient visits per age group.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Age Group</th>
                  <th className="p-3.5 text-center">Total Patients</th>
                  <th className="p-3.5 text-center text-teal">Male</th>
                  <th className="p-3.5 text-center text-coral">Female</th>
                  <th className="p-3.5 text-center text-gray-500">Other / Unspecified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-ink">
                {demographics.crossAnalysis.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3.5 font-bold">{row.category}</td>
                    <td className="p-3.5 text-center font-mono font-bold">{row.total}</td>
                    <td className="p-3.5 text-center font-mono text-teal font-bold">{row.male}</td>
                    <td className="p-3.5 text-center font-mono text-coral font-bold">{row.female}</td>
                    <td className="p-3.5 text-center font-mono text-gray-400">{row.other}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
