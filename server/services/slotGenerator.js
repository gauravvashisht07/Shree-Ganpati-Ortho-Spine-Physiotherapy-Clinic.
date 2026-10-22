const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

const getDayName = (dateString) => {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

const parseTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const generateSlots = async (doctorId, date) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw new Error('Doctor not found');

  const dayOfWeek = getDayName(date);
  
  let daySchedule = null;
  if (doctor.workingHours && typeof doctor.workingHours.get === 'function') {
    daySchedule = doctor.workingHours.get(dayOfWeek);
  } else if (doctor.workingHours && typeof doctor.workingHours === 'object') {
    daySchedule = doctor.workingHours[dayOfWeek];
  }
  
  // Default clinic working hours: Monday to Saturday 10:00 AM to 5:00 PM (17:00) with 1:00 PM - 1:30 PM Lunch Break, Sunday Closed
  if (!daySchedule || daySchedule.length === 0) {
    if (dayOfWeek === 'sunday') {
      daySchedule = []; // Sunday Closed
    } else {
      daySchedule = [
        { start: '10:00', end: '13:00' }, // Morning session: 10:00 AM - 1:00 PM
        { start: '13:30', end: '17:00' }  // Afternoon session: 1:30 PM - 5:00 PM (1:00 PM - 1:30 PM Lunch Break)
      ];
    }
  }

  const slotDuration = doctor.slotDuration || 30; // default 30 mins
  let possibleSlots = [];

  // Generate all possible slots based on working hours
  daySchedule.forEach(block => {
    let currentStart = parseTime(block.start);
    const endTime = parseTime(block.end);

    while (currentStart + slotDuration <= endTime) {
      possibleSlots.push(formatTime(currentStart));
      currentStart += slotDuration;
    }
  });

  // Fetch all active appointments for this doctor on this date
  const bookedAppointments = await Appointment.find({
    doctorId,
    date,
    status: { $ne: 'cancelled' }
  });

  const slotCapacity = doctor.slotCapacity || 1;

  // Count active bookings per normalized time slot
  const slotCountMap = {};
  bookedAppointments.forEach(app => {
    let slotKey = (app.timeSlot || '').trim().toUpperCase();
    if (slotKey.includes('AM') || slotKey.includes('PM')) {
      const isPM = slotKey.includes('PM');
      const raw = slotKey.replace(/[^\d:]/g, '');
      const [rawH, rawM = '00'] = raw.split(':');
      let hours = parseInt(rawH, 10);
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      slotKey = `${hours.toString().padStart(2, '0')}:${parseInt(rawM, 10).toString().padStart(2, '0')}`;
    }
    slotCountMap[slotKey] = (slotCountMap[slotKey] || 0) + 1;
  });

  // Filter out slots that have reached or exceeded doctor's slotCapacity
  const availableSlots = possibleSlots.filter(slot => (slotCountMap[slot] || 0) < slotCapacity);

  return availableSlots;
};

module.exports = { generateSlots };
