import React, { useState } from 'react';
import { useAppointments } from '../../hooks/useAppointments';

// In a real app, you would get this from an AuthContext after login
const MOCK_DOCTOR_ID = '6a9dabbadd49164423476630'; // Replace with real logic

export default function Schedule() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { getDoctorSchedule, updateStatus } = useAppointments(MOCK_DOCTOR_ID, { startDate: date, endDate: date });

  const handleStatusChange = (id, status) => {
    updateStatus.mutate({ id, status });
  };

  return (
    <div className="min-h-screen bg-base p-8 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-4xl text-ink font-display font-bold">Daily Schedule</h1>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="mt-4 sm:mt-0 p-3 rounded-xl border border-gray-300 font-body"
          />
        </div>

        {getDoctorSchedule.isLoading ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
          </div>
        ) : getDoctorSchedule.isError ? (
          <p className="text-red-500">Error loading schedule. Please ensure you are logged in as this doctor.</p>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-ink">
                <tr>
                  <th className="p-4 font-bold">Time</th>
                  <th className="p-4 font-bold">Patient</th>
                  <th className="p-4 font-bold">Service</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getDoctorSchedule.data?.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">No appointments scheduled for this date.</td></tr>
                ) : (
                  getDoctorSchedule.data?.map(appt => (
                    <tr key={appt._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4 font-bold text-teal">{appt.timeSlot}</td>
                      <td className="p-4">
                        <div className="font-bold text-ink">{appt.patientId?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{appt.patientId?.email}</div>
                      </td>
                      <td className="p-4 text-gray-700">{appt.serviceId?.name}</td>
                      <td className="p-4">
                        <span className={`inline-block text-xs font-bold px-2 py-1 rounded uppercase tracking-wide
                          ${appt.status === 'completed' ? 'bg-teal/20 text-teal-800' : 
                            appt.status === 'cancelled' || appt.status === 'no-show' ? 'bg-gray-200 text-gray-700' : 
                            'bg-amber/20 text-amber-800'}`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="p-4 space-x-2">
                        {['pending', 'confirmed'].includes(appt.status) && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(appt._id, 'completed')}
                              className="text-xs bg-teal text-white px-3 py-1 rounded hover:bg-ink transition-colors"
                            >
                              Complete
                            </button>
                            <button 
                              onClick={() => handleStatusChange(appt._id, 'no-show')}
                              className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                            >
                              No-Show
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
