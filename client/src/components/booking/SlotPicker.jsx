import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import BookingConfirmation from './BookingConfirmation';
import { useDoctors } from '../../hooks/useDoctors';
import { useServices } from '../../hooks/useServices';
import Navbar from '../Navbar';
import Footer from '../Footer';

export default function SlotPicker() {
  const [searchParams] = useSearchParams();
  const preselectedServiceName = searchParams.get('service');
  const preselectedDoctorId = searchParams.get('doctor');

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState(() => localStorage.getItem('patientEmail') || '');
  const [patientPhone, setPatientPhone] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);

  const queryClient = useQueryClient();
  const { getDoctors } = useDoctors();
  const { data: doctors, isLoading: doctorsLoading } = getDoctors;

  const { getServices } = useServices();
  const { data: services, isLoading: servicesLoading } = getServices;

  // Auto-select doctor or service if passed via URL parameters
  useEffect(() => {
    if (doctors && doctors.length > 0 && !selectedDoctor) {
      if (preselectedDoctorId) {
        const found = doctors.find(d => d._id === preselectedDoctorId);
        if (found) setSelectedDoctor(found);
        else setSelectedDoctor(doctors[0]);
      } else {
        setSelectedDoctor(doctors[0]);
      }
    }
  }, [doctors, preselectedDoctorId]);

  useEffect(() => {
    if (services && services.length > 0 && !selectedService) {
      if (preselectedServiceName) {
        const found = services.find(s => s.name.toLowerCase().includes(preselectedServiceName.toLowerCase()));
        if (found) setSelectedService(found);
        else setSelectedService(services[0]);
      } else {
        setSelectedService(services[0]);
      }
    }
  }, [services, preselectedServiceName]);

  // Next 14 working days (Mon - Sat only, excluding Sundays)
  const upcomingDates = [];
  let dayOffset = 1;
  while (upcomingDates.length < 14) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    if (d.getDay() !== 0) { // Exclude Sunday (0)
      upcomingDates.push(d.toISOString().split('T')[0]);
    }
    dayOffset++;
  }

  // Default to first open working date
  useEffect(() => {
    if (!selectedDate && upcomingDates.length > 0) {
      setSelectedDate(upcomingDates[0]);
    }
  }, []);

  // Fetch real available slots for doctor & date
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ['slots', selectedDoctor?._id, selectedDate],
    queryFn: async () => {
      if (!selectedDoctor?._id || !selectedDate) return [];
      const { data } = await axiosInstance.get(`/doctors/${selectedDoctor._id}/slots?date=${selectedDate}`);
      return data;
    },
    enabled: !!(selectedDoctor?._id && selectedDate),
  });

  // Booking Mutation saving to MongoDB
  const bookMutation = useMutation({
    mutationFn: async () => {
      setBookingError('');
      const payload = {
        doctorId: selectedDoctor._id,
        serviceId: selectedService?._id || services?.[0]?._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim().toLowerCase(),
        patientPhone: patientPhone.trim()
      };

      const { data } = await axiosInstance.post('/appointments', payload);
      return data;
    },
    onSuccess: (data) => {
      // Persist patient email for easy lookup on "My Appointments"
      if (patientEmail) {
        localStorage.setItem('patientEmail', patientEmail.trim().toLowerCase());
      }
      if (patientPhone) {
        localStorage.setItem('patientPhone', patientPhone.trim());
      }
      setConfirmedAppointment(data.appointment || data);
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Failed to complete booking. Please try again.';
      setBookingError(msg);
    }
  });

  if (confirmedAppointment) {
    return (
      <div className="min-h-screen bg-[#FAF6F0]">
        <Navbar />
        <div className="py-12 px-4 md:px-8">
          <BookingConfirmation appointment={confirmedAppointment} />
        </div>
      </div>
    );
  }

  // Calculate Progress (1-4)
  let progressStep = 1;
  if (selectedDoctor) progressStep = 2;
  if (selectedDate && selectedSlot) progressStep = 3;
  if (patientName && patientEmail) progressStep = 4;
  const progressPercent = (progressStep / 4) * 100;

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      setBookingError('Please select a doctor.');
      return;
    }
    if (!selectedSlot) {
      setBookingError('Please select a preferred time slot.');
      return;
    }
    if (!patientName.trim() || !patientEmail.trim()) {
      setBookingError('Please enter your full name and email address.');
      return;
    }
    bookMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <Navbar />
      <div className="py-12 px-4 md:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-6 md:p-12 shadow-sm relative overflow-hidden">
          
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
            <div 
              className="h-full bg-coral transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-bold text-ink mb-10 text-center mt-2">
            Book your session
          </h1>

          <form onSubmit={handleBookingSubmit} className="space-y-12">
            
            {/* STEP 1: CHOOSE DOCTOR */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display font-bold text-ink">1. Choose your doctor</h2>
                {selectedDoctor && (
                  <span className="text-xs font-bold text-teal bg-teal/10 px-3 py-1 rounded-full">
                    Dr. {selectedDoctor.name}
                  </span>
                )}
              </div>

              {doctorsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-2xl"></div>)}
                </div>
              ) : doctors?.length === 0 ? (
                <div className="p-6 bg-amber/10 border border-amber/30 rounded-2xl text-amber-800 text-sm">
                  No doctors currently registered. Please contact the clinic or check back soon.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors?.map(doc => {
                    const isSelected = selectedDoctor?._id === doc._id;
                    return (
                      <button
                        type="button"
                        key={doc._id}
                        onClick={() => { setSelectedDoctor(doc); setSelectedSlot(null); }}
                        className={`text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                          isSelected 
                            ? 'border-coral bg-coral/5 shadow-sm' 
                            : 'border-gray-100 hover:border-coral/40 bg-white'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-full bg-teal/10 border border-teal/20 text-teal flex items-center justify-center font-bold text-xl flex-shrink-0">
                          {doc.photoUrl ? (
                            <img src={doc.photoUrl} alt={doc.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            doc.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-ink text-base">Dr. {doc.name}</h3>
                          <p className="text-xs text-gray-500 truncate">
                            {doc.specialization?.length > 0 ? doc.specialization.join(', ') : 'Physiotherapy Specialist'}
                          </p>
                          <span className="text-[11px] font-bold text-teal mt-1 inline-block">
                            {doc.slotDuration || 30} min consultations
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-coral text-lg font-bold">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* STEP 2: CHOOSE SERVICE */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-display font-bold text-ink">2. Choose treatment / service</h2>
                {selectedService && (
                  <span className="text-xs font-bold text-teal bg-teal/10 px-3 py-1 rounded-full">
                    {selectedService.name} (₹{selectedService.price})
                  </span>
                )}
              </div>

              {servicesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-2xl"></div>)}
                </div>
              ) : services?.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-2xl text-gray-500 text-sm">
                  Standard Consultation will be provided.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {services?.map(service => {
                    const isSelected = selectedService?._id === service._id;
                    return (
                      <button
                        type="button"
                        key={service._id}
                        onClick={() => setSelectedService(service)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                          isSelected 
                            ? 'border-teal bg-teal/5 shadow-sm' 
                            : 'border-gray-100 hover:border-teal/40 bg-white'
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-ink text-sm leading-snug">{service.name}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{service.description || 'Professional therapy session'}</p>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500">{service.duration || 30} min</span>
                          <span className="font-bold text-teal text-sm">₹{service.price}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* STEP 3: CHOOSE DATE & TIME */}
            <section className={!selectedDoctor ? 'opacity-40 pointer-events-none' : ''}>
              <h2 className="text-2xl font-display font-bold text-ink mb-4">3. Select date & time</h2>
              
              {/* Date Slider */}
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-display">
                Date
              </label>
              <div className="flex overflow-x-auto gap-3 pb-3 snap-x">
                {upcomingDates.map(dateStr => {
                  const dateObj = new Date(dateStr);
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = dateObj.getDate();
                  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      type="button"
                      key={dateStr}
                      onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                      className={`snap-start flex-shrink-0 flex flex-col items-center justify-center w-20 h-24 rounded-2xl border-2 transition-all ${
                        isSelected 
                          ? 'border-teal bg-teal text-white shadow-md scale-105' 
                          : 'border-gray-100 hover:border-teal/40 bg-white text-ink'
                      }`}
                    >
                      <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-teal-100' : 'text-gray-400'}`}>{month}</span>
                      <span className="text-2xl font-display font-bold my-0.5">{dayNum}</span>
                      <span className={`text-xs font-bold ${isSelected ? 'text-teal-100' : 'text-gray-500'}`}>{dayName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Time Slots */}
              <div className="mt-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-display">
                  Available Slots for {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'selected date'}
                </label>

                {slotsLoading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="h-11 bg-gray-100 animate-pulse rounded-full"></div>
                    ))}
                  </div>
                ) : slots?.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-2xl text-gray-500 text-sm text-center">
                    No slots available on this date. Please choose another date or doctor.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {slots?.map(slot => {
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`
                            py-2.5 px-3 rounded-xl font-bold text-sm transition-all border-2
                            ${isSelected 
                              ? 'bg-coral border-coral text-white shadow-sm scale-105' 
                              : 'bg-white border-gray-200 text-ink hover:border-coral/50'
                            }
                          `}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* STEP 4: PATIENT DETAILS & CONFIRM */}
            <section className={`bg-gray-50 rounded-3xl p-6 md:p-8 space-y-6 border border-gray-200/80 ${!selectedSlot ? 'opacity-40 pointer-events-none' : ''}`}>
              <h2 className="text-2xl font-display font-bold text-ink">4. Patient details & confirmation</h2>

              {bookingError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl font-bold flex items-center gap-3">
                  <span>⚠️</span>
                  <span>{bookingError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 font-display">
                    Full Name *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="John Doe"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-3.5 rounded-xl font-bold text-ink focus:border-coral focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 font-display">
                    Email Address *
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-3.5 rounded-xl text-ink font-bold focus:border-coral focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 font-display">
                    Phone Number
                  </label>
                  <input 
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-3.5 rounded-xl text-ink font-bold focus:border-coral focus:outline-none"
                  />
                </div>
              </div>

              {/* Summary Bar */}
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4 border-t border-gray-200">
                <div>
                  <h3 className="text-base font-display font-bold text-ink mb-1">Appointment Summary</h3>
                  <p className="text-gray-600 font-body text-sm">
                    {selectedDoctor ? `Dr. ${selectedDoctor.name}` : ''} 
                    {selectedService ? ` • ${selectedService.name} (₹${selectedService.price})` : ''} 
                    {selectedDate && selectedSlot ? ` • ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${selectedSlot}` : ''}
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={bookMutation.isPending || !selectedSlot}
                  className={`
                    w-full md:w-auto px-10 py-4 rounded-full font-bold text-lg font-display transition-all shadow-md
                    bg-coral text-white hover:bg-[#E55A39] hover:shadow-lg disabled:opacity-50
                  `}
                >
                  {bookMutation.isPending ? 'Saving Appointment...' : 'Confirm Booking →'}
                </button>
              </div>
            </section>

          </form>

        </div>
      </div>
      <Footer />
    </div>
  );
}
