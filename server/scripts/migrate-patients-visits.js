const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Visit = require('../models/Visit');
const Service = require('../models/Service');
const { generateNextPatientId, normalizePhoneNumber } = require('../utils/patientIdGenerator');
const { syncPatientVisitStats } = require('../services/patientVisit.service');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- STARTING SAFE PATIENT & VISIT DATA MIGRATION ---');

  // Step 1: Migrate Patients
  const patients = await Patient.find().sort({ createdAt: 1 });
  console.log(`Found ${patients.length} patients in database.`);

  let nextIdCounter = 1001;
  let updatedPatientsCount = 0;

  for (const patient of patients) {
    let changed = false;

    // Assign sequential patientId if not present
    if (!patient.patientId) {
      patient.patientId = `SGP-${nextIdCounter}`;
      nextIdCounter++;
      changed = true;
    } else {
      const match = patient.patientId.match(/^SGP-(\d+)$/);
      if (match && parseInt(match[1], 10) >= nextIdCounter) {
        nextIdCounter = parseInt(match[1], 10) + 1;
      }
    }

    // Populate normalized phone
    const normalized = normalizePhoneNumber(patient.phone);
    if (patient.phone && (!patient.phoneNormalized || patient.phoneNormalized !== normalized)) {
      patient.phoneNormalized = normalized;
      changed = true;
    }

    // Populate registration date
    if (!patient.registrationDate) {
      patient.registrationDate = patient.createdAt 
        ? patient.createdAt.toISOString().split('T')[0] 
        : '2026-09-01';
      changed = true;
    }

    if (changed) {
      await patient.save();
      updatedPatientsCount++;
    }
  }
  console.log(`Updated ${updatedPatientsCount} patient profiles with clinic IDs, normalized phones, and registration dates.`);

  // Step 2: Migrate Completed Appointments to Visits
  const completedAppointments = await Appointment.find({ status: 'completed' })
    .populate('serviceId', 'price')
    .lean();

  console.log(`Found ${completedAppointments.length} completed appointments to verify/migrate into Visit records.`);

  let createdVisitsCount = 0;
  for (const appt of completedAppointments) {
    if (!appt.patientId) continue;

    const existingVisit = await Visit.findOne({ appointmentId: appt._id });
    if (!existingVisit) {
      const fee = appt.serviceId?.price || 0;
      await Visit.create({
        patientId: appt.patientId,
        appointmentId: appt._id,
        doctorId: appt.doctorId,
        serviceId: appt.serviceId?._id || appt.serviceId,
        visitDate: appt.date,
        timeSlot: appt.timeSlot || '10:00 AM',
        visitType: 'consultation',
        status: 'completed',
        fee,
        paymentStatus: appt.paymentStatus === 'paid' ? 'paid' : 'unpaid',
        notes: appt.notes || '',
        patientAddress: appt.patientAddress || '',
        patientAge: appt.patientAge,
        patientGender: appt.patientGender,
        createdAt: appt.createdAt || new Date(),
        updatedAt: appt.updatedAt || new Date()
      });
      createdVisitsCount++;
    }
  }
  console.log(`Created ${createdVisitsCount} new Visit records linked to completed appointments.`);

  // Step 3: Recalculate visit statistics for all patients
  console.log('Recalculating totalVisits, firstVisitDate, and lastVisitDate for all patients...');
  for (const patient of patients) {
    await syncPatientVisitStats(patient._id);
  }

  // Step 4: Verification and Summary
  const totalVisits = await Visit.countDocuments({ status: 'completed' });
  const sampleMigrated = await Patient.find().select('patientId name phone phoneNormalized totalVisits firstVisitDate lastVisitDate registrationDate').limit(5).lean();

  console.log('--- MIGRATION COMPLETED SUCCESSFULLY ---');
  console.log(`Total Completed Visits in System: ${totalVisits}`);
  console.log('Sample Updated Patients:');
  console.table(sampleMigrated);

  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
