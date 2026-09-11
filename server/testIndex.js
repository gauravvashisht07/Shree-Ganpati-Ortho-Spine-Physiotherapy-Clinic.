const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Appointment = require('./models/Appointment');

async function runTest() {
  console.log('Starting MongoDB Memory Server...');
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
  console.log('Connected to in-memory database.');

  // Initialize models to ensure indexes are created
  await Appointment.init();

  const doctorId = new mongoose.Types.ObjectId();
  const patientId = new mongoose.Types.ObjectId();
  const serviceId = new mongoose.Types.ObjectId();

  const appointmentData = {
    patientId,
    doctorId,
    serviceId,
    date: '2026-10-01',
    timeSlot: '10:30',
  };

  try {
    console.log('\n--- Test 1: Insert first appointment ---');
    await Appointment.create({ ...appointmentData, status: 'pending' });
    console.log('✅ First appointment inserted successfully.');

    console.log('\n--- Test 2: Insert second appointment (same slot) ---');
    await Appointment.create({ ...appointmentData, status: 'confirmed' });
    console.error('❌ ERROR: Second appointment was inserted successfully. The unique index failed!');
  } catch (error) {
    if (error.code === 11000) {
      console.log('✅ Success! Caught expected duplicate key error (code 11000).');
      console.log(`   Message: ${error.message}`);
    } else {
      console.error('❌ Caught unexpected error:', error);
    }
  }

  try {
    console.log('\n--- Test 3: Insert cancelled appointment (same slot) ---');
    await Appointment.create({ ...appointmentData, status: 'cancelled' });
    console.log('✅ Cancelled appointment inserted successfully (partial filter expression works!).');
  } catch (error) {
    console.error('❌ Failed to insert cancelled appointment:', error);
  }

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('\nTest completed.');
}

runTest();
