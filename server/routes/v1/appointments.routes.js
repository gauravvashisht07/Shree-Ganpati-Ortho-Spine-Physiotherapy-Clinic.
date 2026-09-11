const express = require('express');
const router = express.Router();
const appointmentController = require('../../controllers/appointment.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/rbac.middleware');
const rateLimit = require('express-rate-limit');

const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 booking requests per windowMs
  message: { message: 'Too many booking requests from this IP, please try again after a minute' }
});

// Public or basic auth booking logic
router.post('/', bookingLimiter, appointmentController.createAppointment);

// Patient public endpoints (no password required)
router.get('/lookup', appointmentController.lookupAppointments);
router.put('/:id/patient-cancel', appointmentController.patientCancel);

// Patient endpoints (with auth)
router.get('/my', authMiddleware, requireRole('patient'), appointmentController.getMy);
router.put('/:id/cancel', authMiddleware, requireRole('patient', 'admin'), appointmentController.cancelAppointment);

// Doctor & Admin endpoints
router.get('/', authMiddleware, requireRole('admin'), appointmentController.getAll);
router.get('/doctor/:doctorId', authMiddleware, requireRole('doctor', 'admin'), appointmentController.getDoctorSchedule);
router.patch('/:id/status', authMiddleware, requireRole('doctor', 'admin'), appointmentController.updateStatus);

module.exports = router;
