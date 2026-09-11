const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const request = require('supertest');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Service = require('./models/Service');
const Appointment = require('./models/Appointment');
const appointmentController = require('./controllers/appointment.controller');

const app = express();
app.use(express.json());
app.post('/api/v1/appointments', appointmentController.createAppointment);

async function runTest() {
  console.log('Starting MongoDB Memory Server...');
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('Connected to in-memory DB.\n');
  
  await Appointment.init(); // ensure indexes are created

  const doctorId = new mongoose.Types.ObjectId();
  const patientId1 = new mongoose.Types.ObjectId();
  const patientId2 = new mongoose.Types.ObjectId();
  const serviceId = new mongoose.Types.ObjectId();
  
  const appointmentPayload1 = {
    patientId: patientId1,
    doctorId,
    serviceId,
    date: '2026-12-01',
    timeSlot: '09:00'
  };

  const appointmentPayload2 = {
    patientId: patientId2, // different patient
    doctorId,
    serviceId,
    date: '2026-12-01',
    timeSlot: '09:00' // EXACT SAME DOCTOR/DATE/SLOT
  };

  console.log('Firing two concurrent POST requests for the exact same slot...');
  
  // Fire requests concurrently using Promise.all
  const [res1, res2] = await Promise.all([
    request(app).post('/api/v1/appointments').send(appointmentPayload1),
    request(app).post('/api/v1/appointments').send(appointmentPayload2)
  ]);

  console.log(`\nRequest 1 Status: ${res1.status}`);
  console.log(`Request 1 Response:`, res1.body);
  
  console.log(`\nRequest 2 Status: ${res2.status}`);
  console.log(`Request 2 Response:`, res2.body);

  const statuses = [res1.status, res2.status];
  
  if (statuses.includes(201) && statuses.includes(409)) {
    console.log('\n✅ TEST PASSED: Exactly one request succeeded (201) and one was rejected due to concurrency collision (409 Conflict).');
  } else {
    console.log('\n❌ TEST FAILED: Did not receive the expected 201/409 combination.', statuses);
  }

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('\nTest complete.');
}

runTest();
