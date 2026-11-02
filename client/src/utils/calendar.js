/**
 * Calendar Utilities for Shree Ganpati Ortho & Spine Clinic
 * Supports Google Calendar Direct URL & RFC 5545 iCalendar (.ics) generation
 */

const CLINIC_NAME = 'Shree Ganpati Ortho & Spine Physiotherapy Clinic';
const CLINIC_ADDRESS = 'Hospital road, shop no. 2, Court road, near sharma and Sanjeevni clinic, Nadaun, Himachal Pradesh 177033';
const CLINIC_MAP_URL = 'https://share.google/VQtNvUSwIJh91p4eO';

/**
 * Parse date string (YYYY-MM-DD) and timeSlot (HH:mm or "10:30 AM") into Start and End DateTime Strings
 */
export const getAppointmentDateTimeRange = (dateStr, timeSlotStr, durationMins = 30) => {
  if (!dateStr || !timeSlotStr) return null;

  // Normalize date
  let [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) {
    const d = new Date(dateStr);
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
  }

  // Parse timeSlot
  let cleanTime = String(timeSlotStr).trim().toUpperCase();
  let isPM = cleanTime.includes('PM');
  let isAM = cleanTime.includes('AM');
  let [rawH, rawM = '00'] = cleanTime.replace(/[^\d:]/g, '').split(':');
  let hours = parseInt(rawH, 10) || 10;
  let minutes = parseInt(rawM, 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  const pad = (n) => String(n).padStart(2, '0');

  // Start Date Object
  const startDate = new Date(year, month - 1, day, hours, minutes, 0);
  const endDate = new Date(startDate.getTime() + (Number(durationMins) || 30) * 60 * 1000);

  const formatCalDateTime = (d) => {
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  return {
    startFormatted: formatCalDateTime(startDate),
    endFormatted: formatCalDateTime(endDate),
    startDate,
    endDate,
  };
};

/**
 * Build 1-Click Google Calendar Event URL
 */
export const buildGoogleCalendarUrl = (appointment) => {
  const patientName = appointment?.patientId?.name || appointment?.patientName || 'Patient';
  const doctorName = appointment?.doctorId?.name || appointment?.doctorName || 'Specialist';
  const serviceName = appointment?.serviceId?.name || appointment?.serviceName || 'Physiotherapy Consultation';
  const date = appointment?.date;
  const timeSlot = appointment?.timeSlot;
  const duration = appointment?.duration || 30;

  const range = getAppointmentDateTimeRange(date, timeSlot, duration);
  if (!range) return null;

  const title = `Physiotherapy: ${serviceName} - Dr. ${doctorName}`;
  const details = [
    `Patient: ${patientName}`,
    `Consulting Doctor: Dr. ${doctorName}`,
    `Service: ${serviceName}`,
    `Clinic: ${CLINIC_NAME}`,
    `Directions: ${CLINIC_MAP_URL}`,
    ``,
    `Instructions: Please arrive 10 minutes prior to your time slot in comfortable clothing.`,
  ].join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${range.startFormatted}/${range.endFormatted}`,
    ctz: 'Asia/Kolkata',
    details,
    location: CLINIC_ADDRESS,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate standard RFC 5545 .ics iCalendar file string
 */
export const generateIcsContent = (appointment) => {
  const id = appointment?._id || `appt-${Date.now()}`;
  const patientName = appointment?.patientId?.name || appointment?.patientName || 'Patient';
  const doctorName = appointment?.doctorId?.name || appointment?.doctorName || 'Specialist';
  const serviceName = appointment?.serviceId?.name || appointment?.serviceName || 'Physiotherapy Consultation';
  const date = appointment?.date;
  const timeSlot = appointment?.timeSlot;
  const duration = appointment?.duration || 30;

  const range = getAppointmentDateTimeRange(date, timeSlot, duration);
  if (!range) return '';

  const nowUTC = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const title = `Physiotherapy Session: ${serviceName} (Dr. ${doctorName})`;
  const description = `Patient: ${patientName}\\nDoctor: Dr. ${doctorName}\\nService: ${serviceName}\\nClinic: ${CLINIC_NAME}\\nDirections: ${CLINIC_MAP_URL}\\n\\nPlease arrive 10 minutes prior to your slot.`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shree Ganpati Ortho & Spine Clinic//Appointment System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${id}@clinic.shreeganpati`,
    `DTSTAMP:${nowUTC}`,
    `DTSTART;TZID=Asia/Kolkata:${range.startFormatted}`,
    `DTEND;TZID=Asia/Kolkata:${range.endFormatted}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${CLINIC_ADDRESS}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Physiotherapy Appointment in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};

/**
 * Trigger .ics download in browser
 */
export const downloadAppointmentIcs = (appointment) => {
  const icsData = generateIcsContent(appointment);
  if (!icsData) return;

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const date = appointment?.date || 'session';
  link.setAttribute('download', `shree-ganpati-appointment-${date}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

