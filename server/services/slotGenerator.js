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
  
  // Default clinic working hours: Monday to Saturday 10:30 AM to 5:30 PM (17:30), Sunday Closed
  if (!daySchedule || daySchedule.length === 0) {
    if (dayOfWeek === 'sunday') {
      daySchedule = []; // Sunday Closed
    } else {
      daySchedule = [
        { start: '10:30', end: '17:30' }
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

  const bookedTimeSlots = bookedAppointments.map(app => app.timeSlot);

  // Filter out booked slots
  const availableSlots = possibleSlots.filter(slot => !bookedTimeSlots.includes(slot));

  return availableSlots;
};

module.exports = { generateSlots };
