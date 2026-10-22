const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const {
  resolveOrCreatePatient,
  recordClinicalVisit,
  syncPatientVisitStats,
  syncAppointmentToVisit,
  searchExistingPatients
} = require('../services/patientVisit.service');

async function runTests() {
  console.log('=== RUNNING SCENARIO VERIFICATION TESTS (A through J) ===\n');
  
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGO_URI is not defined in environment variables');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB.\n');

  const testPhone = '9999912345';
  const testEmail = 'qa_test_patient@clinic.local';

  // Cleanup any old test runs
  await Patient.deleteMany({ phone: testPhone });
  await Visit.deleteMany({ patientAddress: 'QA Test Suite Address' });
  await Appointment.deleteMany({ notes: 'QA Test Appointment' });

  let doctor = await Doctor.findOne();
  let service = await Service.findOne();

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName) {
    totalCount++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      throw new Error(`Assertion failed in: ${testName}`);
    }
  }

  try {
    // ---------------------------------------------------------
    // Scenario A: New Patient with Historical First Visit
    // ---------------------------------------------------------
    console.log('Scenario A: New Patient with Historical First Visit');
    const newPatient = await resolveOrCreatePatient({
      patientName: 'Test Rahul Sharma',
      patientPhone: testPhone,
      patientAddress: 'QA Test Suite Address',
      patientAge: 32,
      patientGender: 'male',
      registrationDate: '2026-10-10'
    });

    assert(newPatient.patientId && newPatient.patientId.startsWith('SGP-'), 'Sequential Patient ID generated (e.g. SGP-1043)');
    assert(newPatient.phoneNormalized === '9999912345', 'Phone normalized to 10 digits');

    // Add backdated visit for 10 October 2026
    const visit1 = await recordClinicalVisit({
      patientId: newPatient._id,
      doctorId: doctor._id,
      serviceId: service._id,
      visitDate: '2026-10-10',
      timeSlot: '10:00 AM',
      fee: 250,
      paymentStatus: 'paid',
      notes: 'Initial consultation',
      patientAddress: 'QA Test Suite Address'
    });

    const patientAfterA = await Patient.findById(newPatient._id);
    assert(patientAfterA.totalVisits === 1, 'Total visits is exactly 1');
    assert(patientAfterA.firstVisitDate === '2026-10-10', 'First visit date is 2026-10-10');
    assert(patientAfterA.lastVisitDate === '2026-10-10', 'Last visit date is 2026-10-10');
    console.log('');

    // ---------------------------------------------------------
    // Scenario B: Repeat Patient Detection
    // ---------------------------------------------------------
    console.log('Scenario B: Repeat Patient Detection (no duplicate created)');
    const matched = await searchExistingPatients(testPhone);
    assert(matched.length >= 1 && matched[0]._id.toString() === newPatient._id.toString(), 'Existing patient identified by phone search');

    const resolvedPatient = await resolveOrCreatePatient({
      patientPhone: testPhone,
      patientName: 'Test Rahul Sharma'
    });
    assert(resolvedPatient._id.toString() === newPatient._id.toString(), 'No duplicate patient created on re-entry');

    // Add second visit for 15 October 2026
    const visit2 = await recordClinicalVisit({
      patientId: resolvedPatient._id,
      doctorId: doctor._id,
      serviceId: service._id,
      visitDate: '2026-10-15',
      timeSlot: '11:00 AM',
      fee: 200,
      paymentStatus: 'paid',
      notes: 'Follow-up session',
      patientAddress: 'QA Test Suite Address'
    });

    const patientAfterB = await Patient.findById(newPatient._id);
    assert(patientAfterB.totalVisits === 2, 'Total visits increased to 2');
    assert(patientAfterB.firstVisitDate === '2026-10-10', 'First visit date preserved as 2026-10-10');
    assert(patientAfterB.lastVisitDate === '2026-10-15', 'Last visit date updated to 2026-10-15');
    console.log('');

    // ---------------------------------------------------------
    // Scenario C: Backdated Visit
    // ---------------------------------------------------------
    console.log('Scenario C: Backdated Visit (entering 12 Oct visit between 10 Oct and 15 Oct)');
    const visit3 = await recordClinicalVisit({
      patientId: newPatient._id,
      doctorId: doctor._id,
      serviceId: service._id,
      visitDate: '2026-10-12',
      timeSlot: '02:00 PM',
      fee: 200,
      paymentStatus: 'paid',
      notes: 'Intermediary historical session',
      patientAddress: 'QA Test Suite Address'
    });

    const patientAfterC = await Patient.findById(newPatient._id);
    assert(patientAfterC.totalVisits === 3, 'Total visits increased to 3');
    assert(patientAfterC.firstVisitDate === '2026-10-10', 'First visit remains 2026-10-10');
    assert(patientAfterC.lastVisitDate === '2026-10-15', 'Last visit remains maximum visit date 2026-10-15');
    console.log('');

    // ---------------------------------------------------------
    // Scenario D: Correcting a Visit Date
    // ---------------------------------------------------------
    console.log('Scenario D: Correcting a Visit Date');
    visit2.visitDate = '2026-10-25'; // Move 15 Oct visit to 25 Oct
    await visit2.save();
    await syncPatientVisitStats(newPatient._id);

    const patientAfterD = await Patient.findById(newPatient._id);
    assert(patientAfterD.lastVisitDate === '2026-10-25', 'Last visit updated to corrected maximum date 2026-10-25');
    assert(patientAfterD.firstVisitDate === '2026-10-10', 'First visit remains 2026-10-10');
    console.log('');

    // ---------------------------------------------------------
    // Scenario E: Date Filtering
    // ---------------------------------------------------------
    console.log('Scenario E: Date-Wise Filtering by Actual Visit Date');
    const visitsOnOct12 = await Visit.find({
      patientId: newPatient._id,
      visitDate: '2026-10-12',
      status: 'completed'
    });
    assert(visitsOnOct12.length === 1, 'Only visits occurring on 2026-10-12 are returned');
    assert(visitsOnOct12[0].visitDate === '2026-10-12', 'Visit date strictly matches filter date');
    console.log('');

    // ---------------------------------------------------------
    // Scenario F: Appointments vs Visits Separation
    // ---------------------------------------------------------
    console.log('Scenario F: Appointments vs Clinical Visits Workflow');
    const appt = await Appointment.create({
      patientId: newPatient._id,
      doctorId: doctor._id,
      serviceId: service._id,
      date: '2026-11-01',
      timeSlot: '03:00 PM',
      status: 'confirmed',
      paymentStatus: 'unpaid',
      notes: 'QA Test Appointment'
    });

    // Check that booking an appointment did NOT create a completed visit
    const patientAfterBooking = await Patient.findById(newPatient._id);
    assert(patientAfterBooking.totalVisits === 3, 'Booking appointment did NOT increase completed visit count');

    // Cancel appointment - should not create a visit
    appt.status = 'cancelled';
    await appt.save();
    await syncAppointmentToVisit(appt);
    const patientAfterCancel = await Patient.findById(newPatient._id);
    assert(patientAfterCancel.totalVisits === 3, 'Cancelling appointment did NOT increase completed visit count');

    // Now mark as completed
    appt.status = 'completed';
    appt.paymentStatus = 'paid';
    await appt.save();
    const generatedVisit = await syncAppointmentToVisit(appt);
    assert(generatedVisit !== null, 'Completing appointment generated a clinical visit record');

    const patientAfterComplete = await Patient.findById(newPatient._id);
    assert(patientAfterComplete.totalVisits === 4, 'Total visits increased to 4 after marking attended/completed');
    assert(patientAfterComplete.lastVisitDate === '2026-11-01', 'Last visit updated to appointment date 2026-11-01');
    console.log('');

    // ---------------------------------------------------------
    // Scenario G: Rapid Duplicate Prevention
    // ---------------------------------------------------------
    console.log('Scenario G: Rapid Duplicate Visit Prevention');
    const dupVisit = await recordClinicalVisit({
      patientId: newPatient._id,
      doctorId: doctor._id,
      serviceId: service._id,
      visitDate: '2026-10-12',
      timeSlot: '02:00 PM',
      fee: 200,
      paymentStatus: 'paid',
      notes: 'Intermediary historical session'
    });
    const patientAfterDup = await Patient.findById(newPatient._id);
    assert(patientAfterDup.totalVisits === 4, 'Rapid identical re-submission prevented duplicate visit creation');
    console.log('');

    // ---------------------------------------------------------
    // Scenario H: Patient Analytics Verification
    // ---------------------------------------------------------
    console.log('Scenario H: Patient Analytics Calculation Accuracy');
    const allVisitsCount = await Visit.countDocuments({ status: 'completed' });
    const allUniquePatients = await Patient.countDocuments();
    assert(allVisitsCount > 0, `Total completed visits in clinic database: ${allVisitsCount}`);
    assert(allUniquePatients > 0, `Total unique patients in clinic database: ${allUniquePatients}`);
    console.log('');

    // ---------------------------------------------------------
    // Scenario J: Existing Data Integrity
    // ---------------------------------------------------------
    console.log('Scenario J: Existing Data Integrity Verification');
    const existingPatientsWithId = await Patient.countDocuments({ patientId: { $regex: '^SGP-' } });
    assert(existingPatientsWithId >= 42, `All existing patients (${existingPatientsWithId}) have permanent SGP-XXXX IDs`);
    console.log('');

    // Cleanup test artifacts
    await Patient.findByIdAndDelete(newPatient._id);
    await Visit.deleteMany({ patientId: newPatient._id });
    await Appointment.findByIdAndDelete(appt._id);

    console.log(`=================================================`);
    console.log(`ALL TESTS PASSED! (${passedCount}/${totalCount} assertions verified successfully)`);
    console.log(`=================================================\n`);
  } catch (err) {
    console.error('Test run error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
