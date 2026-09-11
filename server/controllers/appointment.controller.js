const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const { generateSlots } = require('../services/slotGenerator');
const { sendBookingConfirmation, sendCancellationNotice } = require('../services/notification.service');

exports.createAppointment = async (req, res) => {
  try {
    let { patientId, patientName, patientEmail, patientPhone, doctorId, serviceId, date, timeSlot } = req.body;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Doctor, date, and time slot are required.' });
    }

    // Resolve or create patient
    if (!patientId) {
      if (!patientName || !patientEmail) {
        return res.status(400).json({ message: 'Patient name and email are required for booking.' });
      }

      const cleanEmail = patientEmail.trim().toLowerCase();
      let patient = await Patient.findOne({ email: cleanEmail });

      if (!patient) {
        patient = await Patient.create({
          name: patientName.trim(),
          email: cleanEmail,
          phone: patientPhone ? patientPhone.trim() : undefined,
          role: 'patient'
        });
      } else if (patientPhone && !patient.phone) {
        patient.phone = patientPhone.trim();
        await patient.save();
      }
      patientId = patient._id;
    }

    // Resolve service if not provided
    if (!serviceId) {
      const defaultService = await Service.findOne();
      if (defaultService) {
        serviceId = defaultService._id;
      } else {
        const createdService = await Service.create({
          name: 'General Physiotherapy Consultation',
          description: 'Standard comprehensive assessment and personalized treatment plan.',
          duration: 30,
          price: 50
        });
        serviceId = createdService._id;
      }
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      serviceId,
      date,
      timeSlot,
      status: 'pending',
      paymentStatus: 'unpaid',
      isActive: true
    });

    // Populate references
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name')
      .populate('serviceId', 'name duration price');

    // Fire and forget email notification
    try {
      sendBookingConfirmation(populatedAppointment);
    } catch (e) {
      console.warn('Email notification failed:', e.message);
    }

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: populatedAppointment
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'This time slot was just booked by someone else, please choose another slot.' 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { status, date, doctorId } = req.query;
    const query = {};
    if (status && status !== 'All') query.status = status;
    if (date) query.date = date;
    if (doctorId) query.doctorId = doctorId;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name email')
      .populate('serviceId', 'name duration price')
      .sort({ date: -1, timeSlot: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.lookupAppointments = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search || !search.trim()) {
      return res.status(400).json({ message: 'Phone number or email is required' });
    }

    const term = search.trim();
    const digitsOnly = term.replace(/\D/g, '');
    const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    const conditions = [
      { email: term.toLowerCase() },
      { phone: term },
      { phone: term.replace(/\s+/g, '') }
    ];

    // If search contains phone digits, match by last 10 digits or digits sequence
    if (last10.length >= 5) {
      conditions.push({ phone: { $regex: last10 } });
      if (digitsOnly.length > last10.length) {
        conditions.push({ phone: { $regex: digitsOnly } });
      }
    }

    // Search patients by email or phone
    const patients = await Patient.find({ $or: conditions });

    if (patients.length === 0) {
      return res.json([]);
    }

    const patientIds = patients.map(p => p._id);
    const appointments = await Appointment.find({ patientId: { $in: patientIds } })
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name photoUrl')
      .populate('serviceId', 'name duration price')
      .sort({ date: -1, timeSlot: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.patientCancel = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name')
      .populate('serviceId', 'name');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }

    appointment.status = 'cancelled';
    appointment.isActive = false; // Free up the slot in unique index
    await appointment.save();

    try {
      sendCancellationNotice(appointment);
    } catch (e) {
      console.warn('Email notification failed:', e.message);
    }

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name')
      .populate('serviceId', 'name');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }

    appointment.status = 'cancelled';
    appointment.isActive = false; // Free up the slot in unique index
    await appointment.save();

    // Fire and forget cancellation email
    sendCancellationNotice(appointment);

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMy = async (req, res) => {
  try {
    const patientId = req.user._id; // from auth middleware
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'name')
      .populate('serviceId', 'name')
      .sort({ date: 1, timeSlot: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Authorization check: doctor must match their own ID unless they are an admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== doctorId) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own schedule' });
    }

    const { startDate, endDate } = req.query;
    const query = { doctorId };
    
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = startDate;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email')
      .populate('serviceId', 'name')
      .sort({ date: 1, timeSlot: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Enforce doctor authorization
    if (req.user.role !== 'admin' && req.user._id.toString() !== appointment.doctorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only modify your own appointments' });
    }

    appointment.status = status;
    if (status === 'cancelled') {
      appointment.isActive = false;
      // Re-fetch populated for email
      const populatedAppt = await Appointment.findById(id)
        .populate('patientId', 'name email')
        .populate('doctorId', 'name')
        .populate('serviceId', 'name');
      sendCancellationNotice(populatedAppt);
    }

    await appointment.save();
    res.json({ message: 'Status updated successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
