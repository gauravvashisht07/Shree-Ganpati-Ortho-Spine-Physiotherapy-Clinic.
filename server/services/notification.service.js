const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer Transporter
 * Supports either:
 *  1. Direct Gmail App Password via EMAIL_USER & EMAIL_PASS (recommended for Gmail)
 *  2. Custom SMTP host via SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */
const createTransporter = () => {
  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
  const emailPass = rawPass.replace(/\s+/g, '');

  // Check if credentials are placeholders or empty
  if (!emailUser || !emailPass || emailUser === 'your_smtp_user' || emailPass === 'your_smtp_password') {
    return null;
  }

  // If using Gmail or EMAIL_USER is a Gmail address
  if (process.env.EMAIL_USER || emailUser.endsWith('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  // Fallback to custom SMTP host
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

const CLINIC_NAME = 'Shree Ganpati Ortho & Spine Physiotherapy Clinic';
const CLINIC_ADDRESS = 'Hospital road, shop no. 2, Court road, near sharma and Sanjeevni clinic, Nadaun, Himachal Pradesh 177033';
const CLINIC_MAP_URL = 'https://share.google/VQtNvUSwIJh91p4eO';
const CLINIC_EMAIL = process.env.ADMIN_EMAIL || 'shreeganpatiorthospinephysio@gmail.com';
const SENDER_EMAIL = process.env.SMTP_FROM || `"${CLINIC_NAME}" <${CLINIC_EMAIL}>`;

/**
 * Parse date and time into start/end calendar format (YYYYMMDDTHHmm00)
 */
const getCalendarDateTimeRange = (dateStr, timeSlotStr, durationMins = 30) => {
  if (!dateStr || !timeSlotStr) return null;

  let [year, month, day] = dateStr.split(/[-/]/).map(Number);
  if (!year || !month || !day) {
    const d = new Date(dateStr);
    year = d.getFullYear();
    month = d.getMonth() + 1;
    day = d.getDate();
  }

  let cleanTime = String(timeSlotStr).trim().toUpperCase();
  let isPM = cleanTime.includes('PM');
  let isAM = cleanTime.includes('AM');
  let [rawH, rawM = '00'] = cleanTime.replace(/[^\d:]/g, '').split(':');
  let hours = parseInt(rawH, 10) || 10;
  let minutes = parseInt(rawM, 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  const pad = (n) => String(n).padStart(2, '0');
  const startDate = new Date(year, month - 1, day, hours, minutes, 0);
  const endDate = new Date(startDate.getTime() + (Number(durationMins) || 30) * 60 * 1000);

  const format = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  return {
    start: format(startDate),
    end: format(endDate),
  };
};

/**
 * Generate iCalendar RFC 5545 Buffer with built-in 1-hour alarm reminder
 */
const generateIcsBuffer = (appointment, range) => {
  const id = appointment._id || `appt-${Date.now()}`;
  const patientName = appointment.patientId?.name || 'Patient';
  const doctorName = appointment.doctorId?.name || 'Specialist';
  const serviceName = appointment.serviceId?.name || 'Physiotherapy Consultation';
  const nowUTC = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const title = `Physiotherapy: ${serviceName} (Dr. ${doctorName})`;
  const description = `Patient: ${patientName}\\nDoctor: Dr. ${doctorName}\\nService: ${serviceName}\\nClinic: ${CLINIC_NAME}\\nDirections: ${CLINIC_MAP_URL}\\n\\nPlease arrive 10 minutes prior to your time slot in comfortable clothing.`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shree Ganpati Ortho & Spine Clinic//Appointment System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${id}@clinic.shreeganpati`,
    `DTSTAMP:${nowUTC}`,
    `DTSTART;TZID=Asia/Kolkata:${range.start}`,
    `DTEND;TZID=Asia/Kolkata:${range.end}`,
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
  ];

  return Buffer.from(icsLines.join('\r\n'), 'utf-8');
};

/**
 * Send Booking Confirmation Email to Patient
 */
const sendBookingConfirmation = async (appointment) => {
  try {
    const patientEmail = appointment.patientId?.email;
    if (!patientEmail || patientEmail.endsWith('@clinic.local')) {
      console.log(`[Notification] Skipped patient email: invalid or local address (${patientEmail})`);
      return;
    }

    const transporter = createTransporter();
    if (!transporter) {
      console.warn('[Notification] SMTP credentials not configured in .env (EMAIL_USER / SMTP_PASS). Skipped patient email.');
      return;
    }

    const patientName = appointment.patientId?.name || 'Valued Patient';
    const doctorName = appointment.doctorId?.name || 'Specialist';
    const serviceName = appointment.serviceId?.name || 'Physiotherapy Consultation';
    const date = appointment.date;
    const time = appointment.timeSlot;
    const duration = appointment.duration || appointment.serviceId?.duration || 30;

    const calRange = getCalendarDateTimeRange(date, time, duration);
    let googleCalendarUrl = '#';
    let icsBuffer = null;

    if (calRange) {
      const calTitle = encodeURIComponent(`Physiotherapy: ${serviceName} - Dr. ${doctorName}`);
      const calDetails = encodeURIComponent(`Patient: ${patientName}\nDoctor: Dr. ${doctorName}\nService: ${serviceName}\nClinic: ${CLINIC_NAME}\nDirections: ${CLINIC_MAP_URL}\n\nPlease arrive 10 minutes prior to your time slot.`);
      const calLoc = encodeURIComponent(CLINIC_ADDRESS);
      googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${calRange.start}/${calRange.end}&ctz=Asia/Kolkata&details=${calDetails}&location=${calLoc}`;
      icsBuffer = generateIcsBuffer(appointment, calRange);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF6F0; margin: 0; padding: 24px; color: #221B26; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #ECE7DE; }
          .header { background: linear-gradient(135deg, #1F8A82 0%, #15625D 100%); color: #ffffff; padding: 32px 28px; text-align: center; }
          .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; }
          .header p { margin: 0; font-size: 14px; opacity: 0.9; }
          .body { padding: 32px 28px; }
          .badge { display: inline-block; background: #E6F4F2; color: #1F8A82; font-weight: bold; font-size: 13px; padding: 6px 14px; border-radius: 50px; margin-bottom: 20px; }
          .card { background: #FAF6F0; border-radius: 14px; padding: 20px; margin: 20px 0; border: 1px solid #ECE7DE; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ECE7DE; font-size: 14px; }
          .row:last-child { border-bottom: none; }
          .label { color: #666; font-weight: 600; }
          .value { color: #221B26; font-weight: 700; text-align: right; }
          .instructions { background: #FFF9E6; border-left: 4px solid #FFC857; padding: 14px 18px; border-radius: 8px; margin: 24px 0; font-size: 13px; color: #555; }
          .instructions strong { color: #221B26; }
          .btn-group { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin: 24px 0 10px 0; }
          .btn { display: inline-block; padding: 12px 24px; border-radius: 50px; font-weight: bold; font-size: 14px; text-decoration: none; text-align: center; }
          .btn-cal { background: #1F8A82; color: #ffffff !important; }
          .btn-map { background: #FF6F4D; color: #ffffff !important; }
          .footer { background: #F6F2EB; padding: 20px 28px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #ECE7DE; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${CLINIC_NAME}</h1>
            <p>Your Health & Mobility Is Our Priority</p>
          </div>
          <div class="body">
            <span class="badge">✓ Booking Confirmed</span>
            <h2 style="margin: 0 0 8px 0; font-size: 20px;">Hello ${patientName},</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">
              Your appointment has been successfully scheduled. We look forward to seeing you at our clinic!
            </p>

            <div class="card">
              <div class="row">
                <span class="label">Consulting Doctor</span>
                <span class="value">Dr. ${doctorName}</span>
              </div>
              <div class="row">
                <span class="label">Treatment / Service</span>
                <span class="value" style="color: #1F8A82;">${serviceName}</span>
              </div>
              <div class="row">
                <span class="label">Date</span>
                <span class="value">${date}</span>
              </div>
              <div class="row">
                <span class="label">Time Slot</span>
                <span class="value">${time}</span>
              </div>
              <div class="row">
                <span class="label">Clinic Location</span>
                <span class="value" style="font-size: 12px; max-width: 250px;">${CLINIC_ADDRESS}</span>
              </div>
            </div>

            <div class="instructions">
              <strong>Patient Instructions:</strong>
              <ul style="margin: 6px 0 0 0; padding-left: 20px;">
                <li>Please arrive 10 minutes prior to your time slot.</li>
                <li>Wear loose and comfortable clothing suitable for physical examination.</li>
                <li>Bring any prior X-rays, MRI scans, or medical prescriptions if available.</li>
              </ul>
            </div>

            <div class="btn-group">
              <a href="${googleCalendarUrl}" class="btn btn-cal" target="_blank">📅 Add to Google Calendar</a>
              <a href="${CLINIC_MAP_URL}" class="btn btn-map" target="_blank">🗺️ Get Directions on Maps</a>
            </div>
            <p style="text-align: center; font-size: 12px; color: #777; margin-top: 14px; margin-bottom: 0;">
              💡 <em>An interactive calendar invite (.ics) is also attached to sync with Apple Calendar or Outlook with 1 tap.</em>
            </p>
          </div>
          <div class="footer">
            <p style="margin: 0 0 4px 0;">${CLINIC_NAME}</p>
            <p style="margin: 0;">For inquiries or rescheduling, reply to this email or visit our Nadaun clinic.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: SENDER_EMAIL,
      to: patientEmail,
      subject: `Appointment Confirmed: ${date} at ${time} - ${CLINIC_NAME}`,
      html: htmlContent,
    };

    if (icsBuffer) {
      mailOptions.icalEvent = {
        filename: 'appointment.ics',
        method: 'request',
        content: icsBuffer,
      };
      mailOptions.attachments = [
        {
          filename: 'appointment-invite.ics',
          content: icsBuffer,
          contentType: 'text/calendar; charset=utf-8; method=REQUEST',
        },
      ];
    }

    await transporter.sendMail(mailOptions);
    console.log(`[Notification] Booking confirmation email with .ics invite sent to patient: ${patientEmail}`);
  } catch (error) {
    console.error('[Notification] Failed to send booking confirmation email to patient:', error.message);
  }
};

/**
 * Send Instant Booking Alert to Clinic Admin and Doctor
 */
const sendAdminBookingNotification = async (appointment) => {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.warn('[Notification] SMTP credentials not configured in .env. Skipped admin email notification.');
      return;
    }

    const patientName = appointment.patientId?.name || 'Online Patient';
    const patientPhone = appointment.patientId?.phone || appointment.patientPhone || 'Not provided';
    const patientEmail = appointment.patientId?.email || 'Not provided';
    const patientAge = appointment.patientAge || appointment.patientId?.age || 'N/A';
    const patientGender = appointment.patientGender || appointment.patientId?.gender || 'N/A';
    const patientAddress = appointment.patientAddress || appointment.patientId?.address || 'N/A';

    const doctorName = appointment.doctorId?.name || 'Clinic Specialist';
    const doctorEmail = appointment.doctorId?.email;
    const serviceName = appointment.serviceId?.name || 'Physiotherapy Consultation';
    const date = appointment.date;
    const time = appointment.timeSlot;
    const notes = appointment.notes || 'None';

    const recipients = [CLINIC_EMAIL];
    if (doctorEmail && !recipients.includes(doctorEmail) && !doctorEmail.endsWith('@clinic.local')) {
      recipients.push(doctorEmail);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF6F0; margin: 0; padding: 24px; color: #221B26; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ECE7DE; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          .header { background: #221B26; color: #ffffff; padding: 24px; text-align: left; }
          .header h2 { margin: 0; font-size: 20px; color: #FFC857; }
          .content { padding: 24px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
          .table td { padding: 10px 12px; border-bottom: 1px solid #F0ECE4; }
          .table td.label { font-weight: bold; color: #666; width: 38%; }
          .table td.val { color: #221B26; font-weight: 600; }
          .badge { display: inline-block; background: #FF6F4D; color: #fff; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">🚨 New Online Booking</span>
            <h2 style="margin-top: 8px;">New Patient Appointment Received</h2>
          </div>
          <div class="content">
            <p style="font-size: 15px; margin-top: 0;">A new patient has scheduled an appointment via the clinic website:</p>
            <table class="table">
              <tr>
                <td class="label">Patient Name</td>
                <td class="val" style="font-size: 16px; color: #1F8A82;">${patientName}</td>
              </tr>
              <tr>
                <td class="label">Phone Number</td>
                <td class="val">
                  <a href="tel:${patientPhone}" style="color: #1F8A82; text-decoration: none; font-weight: bold;">${patientPhone}</a>
                </td>
              </tr>
              <tr>
                <td class="label">Email Address</td>
                <td class="val">${patientEmail}</td>
              </tr>
              <tr>
                <td class="label">Age / Gender</td>
                <td class="val">${patientAge} yrs / ${patientGender}</td>
              </tr>
              <tr>
                <td class="label">Address / City</td>
                <td class="val">${patientAddress}</td>
              </tr>
              <tr>
                <td class="label">Consulting Doctor</td>
                <td class="val">Dr. ${doctorName}</td>
              </tr>
              <tr>
                <td class="label">Service / Treatment</td>
                <td class="val">${serviceName}</td>
              </tr>
              <tr>
                <td class="label">Appointment Date</td>
                <td class="val" style="font-weight: 800; color: #221B26;">${date}</td>
              </tr>
              <tr>
                <td class="label">Time Slot</td>
                <td class="val" style="font-weight: 800; color: #1F8A82;">${time}</td>
              </tr>
              <tr>
                <td class="label">Patient Notes</td>
                <td class="val">${notes}</td>
              </tr>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: SENDER_EMAIL,
      to: recipients.join(', '),
      subject: `[New Booking] ${patientName} - ${date} at ${time} (Dr. ${doctorName})`,
      html: htmlContent,
    });
    console.log(`[Notification] Admin alert sent to: ${recipients.join(', ')}`);
  } catch (error) {
    console.error('[Notification] Failed to send admin booking alert:', error.message);
  }
};

/**
 * Send Cancellation Notice Email to Patient
 */
const sendCancellationNotice = async (appointment) => {
  try {
    const patientEmail = appointment.patientId?.email;
    if (!patientEmail || patientEmail.endsWith('@clinic.local')) {
      return;
    }
    const transporter = createTransporter();
    if (!transporter) return;

    const patientName = appointment.patientId?.name || 'Valued Patient';
    const doctorName = appointment.doctorId?.name || 'Specialist';
    const serviceName = appointment.serviceId?.name || 'Physiotherapy Consultation';
    const date = appointment.date;
    const time = appointment.timeSlot;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 16px; border: 1px solid #ECE7DE;">
        <h2 style="color: #d9534f; margin-top: 0;">Appointment Cancelled</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment for <strong>${serviceName}</strong> with <strong>Dr. ${doctorName}</strong> on <strong>${date}</strong> at <strong>${time}</strong> has been cancelled.</p>
        <p>If you wish to reschedule or if this cancellation was made in error, please visit our website or contact our clinic desk.</p>
        <br/>
        <p style="color: #666; font-size: 13px;">${CLINIC_NAME}<br/>${CLINIC_ADDRESS}</p>
      </div>
    `;

    await transporter.sendMail({
      from: SENDER_EMAIL,
      to: patientEmail,
      subject: `Appointment Cancelled - ${CLINIC_NAME}`,
      html: htmlContent,
    });
    console.log(`[Notification] Cancellation email sent to patient: ${patientEmail}`);
  } catch (error) {
    console.error('[Notification] Failed to send cancellation email to patient:', error.message);
  }
};

/**
 * Send Cancellation Alert to Clinic Admin
 */
const sendAdminCancellationNotice = async (appointment) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return;

    const patientName = appointment.patientId?.name || 'Patient';
    const doctorName = appointment.doctorId?.name || 'Specialist';
    const date = appointment.date;
    const time = appointment.timeSlot;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fff; border-radius: 12px; border: 1px solid #f0ad4e;">
        <h3 style="color: #d9534f; margin-top: 0;">⚠️ Appointment Cancelled</h3>
        <p>An appointment has been cancelled:</p>
        <ul>
          <li><strong>Patient:</strong> ${patientName}</li>
          <li><strong>Doctor:</strong> Dr. ${doctorName}</li>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${time}</li>
        </ul>
        <p style="font-size: 13px; color: #666;">This slot is now released and open for new bookings.</p>
      </div>
    `;

    await transporter.sendMail({
      from: SENDER_EMAIL,
      to: CLINIC_EMAIL,
      subject: `[Cancelled] ${patientName} - ${date} at ${time}`,
      html: htmlContent,
    });
    console.log(`[Notification] Admin cancellation alert sent to: ${CLINIC_EMAIL}`);
  } catch (error) {
    console.error('[Notification] Failed to send admin cancellation alert:', error.message);
  }
};

/**
 * Send Test Email to verify SMTP / Gmail configuration
 */
const sendTestEmail = async (targetEmail) => {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error('Email credentials missing or invalid in .env (EMAIL_USER / EMAIL_PASS).');
  }
  const to = targetEmail || CLINIC_EMAIL;
  const result = await transporter.sendMail({
    from: SENDER_EMAIL,
    to,
    subject: `✓ Verification: Email Notifications Activated - ${CLINIC_NAME}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background: #ffffff; border-radius: 16px; border: 1px solid #1F8A82; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <h2 style="color: #1F8A82; margin: 0 0 12px 0;">🎉 Live Email Delivery is Active!</h2>
        <p style="font-size: 15px; color: #221B26; line-height: 1.6;">
          Your Gmail App Password connection is verified and operational for <strong>${CLINIC_NAME}</strong>.
        </p>
        <div style="background: #F4FBF9; border-left: 4px solid #1F8A82; padding: 12px 16px; border-radius: 6px; margin: 16px 0; font-size: 14px;">
          ✓ Patient booking confirmations are live.<br/>
          ✓ Real-time admin alerts to ${CLINIC_EMAIL} are live.
        </div>
        <p style="font-size: 12px; color: #888; margin: 16px 0 0 0;">
          Sent automatically from your clinic web server.
        </p>
      </div>
    `,
  });
  return result;
};

module.exports = {
  sendBookingConfirmation,
  sendAdminBookingNotification,
  sendCancellationNotice,
  sendAdminCancellationNotice,
  sendTestEmail,
};
