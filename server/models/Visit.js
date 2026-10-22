const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    visitId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: false,
      sparse: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: false,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: false,
    },
    visitDate: {
      type: String, // Stored as YYYY-MM-DD
      required: true,
      trim: true,
      index: true,
    },
    timeSlot: {
      type: String,
      trim: true,
      default: '10:00 AM',
    },
    visitType: {
      type: String,
      enum: ['consultation', 'therapy-session', 'follow-up', 'rehab', 'walk-in', 'other'],
      default: 'consultation',
    },
    status: {
      type: String,
      enum: ['completed', 'cancelled'],
      default: 'completed',
      index: true,
    },
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'unpaid', 'refunded'],
      default: 'paid',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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
  },
  {
    timestamps: true,
  }
);

// High performance indexes
visitSchema.index({ patientId: 1, visitDate: -1 });
visitSchema.index({ visitDate: 1, status: 1 });
visitSchema.index({ doctorId: 1, visitDate: 1 });
visitSchema.index({ serviceId: 1 });

const Visit = mongoose.model('Visit', visitSchema);

module.exports = Visit;
