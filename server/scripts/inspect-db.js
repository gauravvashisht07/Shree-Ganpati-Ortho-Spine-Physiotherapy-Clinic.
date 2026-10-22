const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const statusCounts = await mongoose.connection.collection('appointments').aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]).toArray();
  console.log('Status counts:', statusCounts);

  const dates = await mongoose.connection.collection('appointments').aggregate([
    { $group: { _id: null, minDate: { $min: '$date' }, maxDate: { $max: '$date' } } }
  ]).toArray();
  console.log('Dates span:', dates);

  const apptPatientIds = await mongoose.connection.collection('appointments').distinct('patientId');
  const patientsWithoutAppts = await mongoose.connection.collection('patients').countDocuments({
    _id: { $nin: apptPatientIds }
  });
  console.log('Total distinct patients with appointments:', apptPatientIds.length);
  console.log('Patients with zero appointments in Patient collection:', patientsWithoutAppts);

  // Check how phone numbers are stored currently
  const samplePhones = await mongoose.connection.collection('patients').find({}, { projection: { name: 1, phone: 1, email: 1 } }).limit(10).toArray();
  console.log('Sample phones:', samplePhones);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
