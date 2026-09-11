const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendBookingConfirmation = async (appointment) => {
  try {
    const transporter = createTransporter();
    
    // Format the email content
    const htmlContent = `
      <h2>You're booked!</h2>
      <p>Hi ${appointment.patientId.name},</p>
      <p>Your appointment has been confirmed.</p>
      <ul>
        <li><strong>Service:</strong> ${appointment.serviceId.name}</li>
        <li><strong>Doctor:</strong> Dr. ${appointment.doctorId.name}</li>
        <li><strong>Date:</strong> ${appointment.date}</li>
        <li><strong>Time:</strong> ${appointment.timeSlot}</li>
      </ul>
      <p>We look forward to seeing you. Let's get you moving again!</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Shree Ganpati Clinic" <hello@clinic.com>',
      to: appointment.patientId.email,
      subject: 'Appointment Confirmation - Shree Ganpati Ortho & Spine',
      html: htmlContent,
    });
    console.log(`Booking confirmation email sent to ${appointment.patientId.email}`);
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error.message);
  }
};

const sendCancellationNotice = async (appointment) => {
  try {
    const transporter = createTransporter();
    
    const htmlContent = `
      <h2>Appointment Cancelled</h2>
      <p>Hi ${appointment.patientId.name},</p>
      <p>Your appointment for ${appointment.serviceId.name} with Dr. ${appointment.doctorId.name} on ${appointment.date} at ${appointment.timeSlot} has been cancelled.</p>
      <p>If you'd like to reschedule, please visit our website.</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Shree Ganpati Clinic" <hello@clinic.com>',
      to: appointment.patientId.email,
      subject: 'Appointment Cancelled - Shree Ganpati Ortho & Spine',
      html: htmlContent,
    });
    console.log(`Cancellation email sent to ${appointment.patientId.email}`);
  } catch (error) {
    console.error('Failed to send cancellation email:', error.message);
  }
};

module.exports = {
  sendBookingConfirmation,
  sendCancellationNotice
};
