const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
    },
    specialization: [
      {
        type: String,
        trim: true,
      },
    ],
    bio: {
      type: String,
      trim: true,
    },
    qualifications: [
      {
        type: String,
        trim: true,
      },
    ],
    photoUrl: {
      type: String,
      trim: true,
    },
    workingHours: {
      type: Map,
      of: [
        {
          start: { type: String, required: true },
          end: { type: String, required: true },
        },
      ],
      default: {},
    },
    slotDuration: {
      type: Number,
      required: true,
      default: 30, // in minutes
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: 'doctor',
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
