const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const { generateSlots } = require('../services/slotGenerator');
const { sendBookingConfirmation, sendCancellationNotice } = require('../services/notification.service');

exports.createAppointment = async (req, res) => {
  try {
    const isAdmin = Boolean(req.user && req.user.role === 'admin');
    let {
      patientId,
      patientName,
      patientEmail,
      patientPhone,
      patientAddress,
      address,
      patientAge,
      age,
      patientGender,
      gender,
      doctorId,
      serviceId,
      date,
      timeSlot,
      status,
      paymentStatus,
      duration,
      notes
    } = req.body;

    const finalAddress = (patientAddress || address || '').trim();
    const finalAge = patientAge !== undefined && patientAge !== '' ? Number(patientAge) : (age !== undefined && age !== '' ? Number(age) : undefined);
    const finalGender = (patientGender || gender || '').trim().toLowerCase();

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: 'Doctor, date, and time slot are required.' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Selected doctor not found' });
    }

    // Normalize date format if passed as DD-MM-YYYY or MM-DD-YYYY to YYYY-MM-DD
    if (typeof date === 'string') {
      const parts = date.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2].length === 4) {
          date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }

    // Normalize timeSlot format (e.g., "10:00 AM" -> "10:00", "01:30 PM" -> "13:30")
    if (typeof timeSlot === 'string') {
      const cleanTime = timeSlot.trim().toUpperCase();
      if (cleanTime.includes('AM') || cleanTime.includes('PM')) {
        const isPM = cleanTime.includes('PM');
        const rawTime = cleanTime.replace(/[^\d:]/g, '');
        const [rawH, rawM = '00'] = rawTime.split(':');
        let hours = parseInt(rawH, 10);
        const minutes = parseInt(rawM, 10);
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        timeSlot = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
        const [h, m] = cleanTime.split(':');
        timeSlot = `${h.padStart(2, '0')}:${m}`;
      }
    }

    // Public self-booking capacity enforcement:
    // When a public patient books online, verify that the slot has not exceeded the doctor's capacity.
    // For admin-created appointments, unlimited multiple appointments are permitted for the same slot.
    if (!isAdmin) {
      const activeBookingsCount = await Appointment.countDocuments({
        doctorId,
        date,
        timeSlot,
        status: { $ne: 'cancelled' },
        isActive: true
      });

      const maxCapacity = doctor.slotCapacity || 1;
      if (activeBookingsCount >= maxCapacity) {
        return res.status(409).json({
          message: 'This time slot has reached its maximum booking capacity for this doctor. Please choose another time or contact the clinic directly.'
        });
      }
    }

    // Resolve or create patient
    if (!patientId) {
      if (!patientName || !patientName.trim()) {
        return res.status(400).json({ message: 'Patient name is required for booking.' });
      }

      const cleanName = patientName.trim();
      const rawEmail = (patientEmail || '').trim().toLowerCase();
      const rawPhone = (patientPhone || '').trim();

      // Determine cleanEmail to guarantee database uniqueness and consistency
      let cleanEmail = rawEmail;
      if (!cleanEmail) {
        if (rawPhone) {
          const cleanPhoneDigits = rawPhone.replace(/[^\d+]/g, '');
          cleanEmail = `${cleanPhoneDigits}@clinic.local`;
        } else {
          cleanEmail = `patient_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@clinic.local`;
        }
      }

      let patient = null;
      if (rawEmail) {
        patient = await Patient.findOne({ email: rawEmail });
      } else if (rawPhone) {
        patient = await Patient.findOne({ phone: rawPhone });
        if (!patient) {
          patient = await Patient.findOne({ email: cleanEmail });
        }
      }

      if (!patient) {
        patient = await Patient.create({
          name: cleanName,
          email: cleanEmail,
          phone: rawPhone || undefined,
          address: finalAddress || undefined,
          age: finalAge,
          gender: finalGender || undefined,
          role: 'patient'
        });
      } else {
        let changed = false;
        if (rawPhone && !patient.phone) {
          patient.phone = rawPhone;
          changed = true;
        }
        if (rawEmail && (!patient.email || patient.email.endsWith('@clinic.local'))) {
          patient.email = rawEmail;
          changed = true;
        }
        if (finalAddress && (!patient.address || patient.address !== finalAddress)) {
          patient.address = finalAddress;
          changed = true;
        }
        if (finalAge !== undefined && patient.age !== finalAge) {
          patient.age = finalAge;
          changed = true;
        }
        if (finalGender && patient.gender !== finalGender) {
          patient.gender = finalGender;
          changed = true;
        }
        if (changed) await patient.save();
      }
      patientId = patient._id;
    }

    // Prevent accidental duplicate submission by the exact same patient in fast succession
    const duplicateAppt = await Appointment.findOne({
      patientId,
      doctorId,
      date,
      timeSlot,
      status: { $ne: 'cancelled' }
    });

    if (duplicateAppt && !isAdmin) {
      return res.status(409).json({
        message: 'An active appointment for this patient is already booked for this exact time slot.'
      });
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
      patientAddress: finalAddress,
      patientAge: finalAge,
      patientGender: finalGender,
      date,
      timeSlot,
      status: status || (isAdmin ? 'confirmed' : 'pending'),
      paymentStatus: paymentStatus || 'unpaid',
      duration: duration ? Number(duration) : (doctor.slotDuration || 30),
      notes: (notes || '').trim(),
      isActive: status !== 'cancelled'
    });

    // Populate references
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone address age gender')
      .populate('doctorId', 'name email slotCapacity')
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
    console.error('Error creating appointment:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(error.errors).map(e => e.message).join(', ') || 'Validation error'
      });
    }
    res.status(500).json({ message: error.message || 'Server error', error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { status, date, doctorId, serviceId } = req.query;
    const query = {};
    if (status && status !== 'All') query.status = status;
    if (date) query.date = date;
    if (doctorId && doctorId !== 'All') query.doctorId = doctorId;
    if (serviceId && serviceId !== 'All') query.serviceId = serviceId;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone address age gender')
      .populate('doctorId', 'name email slotCapacity')
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
      return res.status(400).json({ message: 'Phone number, email, or patient name is required' });
    }

    const term = search.trim();
    const digitsOnly = term.replace(/\D/g, '');
    const last10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    const conditions = [
      { email: term.toLowerCase() },
      { phone: term },
      { phone: term.replace(/\s+/g, '') },
      { name: { $regex: new RegExp(term, 'i') } }
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
      .populate('patientId', 'name email phone address age gender')
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

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientName,
      patientPhone,
      patientEmail,
      patientAddress,
      patientAge,
      patientGender,
      doctorId,
      serviceId,
      date,
      timeSlot,
      status,
      paymentStatus,
      duration,
      notes
    } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Enforce doctor authorization if not admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== appointment.doctorId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only modify your own appointments' });
    }

    // Normalize date if provided
    if (date && typeof date === 'string') {
      const parts = date.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          appointment.date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2].length === 4) {
          appointment.date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else {
        appointment.date = date;
      }
    }

    // Normalize timeSlot if provided
    if (timeSlot && typeof timeSlot === 'string') {
      const cleanTime = timeSlot.trim().toUpperCase();
      if (cleanTime.includes('AM') || cleanTime.includes('PM')) {
        const isPM = cleanTime.includes('PM');
        const rawTime = cleanTime.replace(/[^\d:]/g, '');
        const [rawH, rawM = '00'] = rawTime.split(':');
        let hours = parseInt(rawH, 10);
        const minutes = parseInt(rawM, 10);
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        appointment.timeSlot = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
        const [h, m] = cleanTime.split(':');
        appointment.timeSlot = `${h.padStart(2, '0')}:${m}`;
      } else {
        appointment.timeSlot = timeSlot;
      }
    }

    if (doctorId) appointment.doctorId = doctorId;
    if (serviceId) appointment.serviceId = serviceId;
    if (paymentStatus) appointment.paymentStatus = paymentStatus;
    if (duration !== undefined && duration !== '') appointment.duration = Number(duration);
    if (notes !== undefined) appointment.notes = notes.trim();
    if (patientAddress !== undefined) appointment.patientAddress = patientAddress.trim();
    if (patientAge !== undefined && patientAge !== '') appointment.patientAge = Number(patientAge);
    if (patientGender !== undefined) appointment.patientGender = patientGender.trim().toLowerCase();

    const prevStatus = appointment.status;
    if (status && status !== prevStatus) {
      appointment.status = status;
      if (status === 'cancelled') {
        appointment.isActive = false;
      } else {
        appointment.isActive = true;
      }
    }

    await appointment.save();

    // Update associated patient document if patient details were provided
    if (appointment.patientId) {
      const patient = await Patient.findById(appointment.patientId);
      if (patient) {
        let patientChanged = false;
        if (patientName && patientName.trim() && patient.name !== patientName.trim()) {
          patient.name = patientName.trim();
          patientChanged = true;
        }
        if (patientPhone !== undefined && patient.phone !== patientPhone.trim()) {
          patient.phone = patientPhone.trim();
          patientChanged = true;
        }
        if (patientEmail && patientEmail.trim() && !patientEmail.endsWith('@clinic.local')) {
          patient.email = patientEmail.trim().toLowerCase();
          patientChanged = true;
        }
        if (patientAddress !== undefined && patient.address !== patientAddress.trim()) {
          patient.address = patientAddress.trim();
          patientChanged = true;
        }
        if (patientAge !== undefined && patientAge !== '' && patient.age !== Number(patientAge)) {
          patient.age = Number(patientAge);
          patientChanged = true;
        }
        if (patientGender && patient.gender !== patientGender.trim().toLowerCase()) {
          patient.gender = patientGender.trim().toLowerCase();
          patientChanged = true;
        }
        if (patientChanged) await patient.save();
      }
    }

    // Populate references and return
    const populatedAppt = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone address age gender')
      .populate('doctorId', 'name email slotCapacity')
      .populate('serviceId', 'name duration price');

    if (status === 'cancelled' && prevStatus !== 'cancelled') {
      try {
        sendCancellationNotice(populatedAppt);
      } catch (e) {
        console.warn('Email notification failed:', e.message);
      }
    }

    res.json({ message: 'Appointment updated successfully', appointment: populatedAppt });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: error.message || 'Server error', error: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSlotOccupancy = async (req, res) => {
  try {
    let { date, doctorId } = req.query;
    if (!date) return res.status(400).json({ message: 'Date query parameter is required (YYYY-MM-DD)' });

    // Normalize date format
    if (typeof date === 'string') {
      const parts = date.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2].length === 4) {
          date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }

    const query = { date, status: { $ne: 'cancelled' } };
    if (doctorId && doctorId !== 'All') query.doctorId = doctorId;

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name phone')
      .populate('serviceId', 'name duration price')
      .populate('doctorId', 'name slotCapacity');

    const occupancy = {};
    appointments.forEach(app => {
      const slot = app.timeSlot;
      if (!occupancy[slot]) {
        occupancy[slot] = { count: 0, appointments: [] };
      }
      occupancy[slot].count += 1;
      occupancy[slot].appointments.push({
        _id: app._id,
        patientName: app.patientId?.name || 'Walk-in Patient',
        patientPhone: app.patientId?.phone || '',
        doctorName: app.doctorId?.name || '',
        doctorId: app.doctorId?._id,
        serviceName: app.serviceId?.name || '',
        status: app.status
      });
    });

    res.json({ date, doctorId: doctorId || 'all', occupancy });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
