const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    },
    timeSlot: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/, // HH:MM
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// Unique index for doctor, date, and time slot, ignoring cancelled appointments
appointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
