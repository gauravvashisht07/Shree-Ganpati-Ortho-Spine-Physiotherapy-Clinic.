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
    patientAddress: {
      type: String,
      trim: true,
      default: '',
    },
    patientAge: {
      type: Number,
      min: 0,
    },
    patientGender: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    timeSlot: {
      type: String,
      required: true,
      trim: true,
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
    },
    duration: {
      type: Number,
      default: 30, // in minutes
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    }
  },
  {
    timestamps: true,
  }
);

// High-performance query indexes for schedule and analytics lookups
// Non-unique index on doctor, date, and time slot allows multiple appointments per slot
appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 });
appointmentSchema.index({ date: 1, status: 1 });
appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ serviceId: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
