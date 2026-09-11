const request = require('supertest');
const app = require('./testApp');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function runTests() {
  console.log('--- Running RBAC Tests ---\n');

  // 1. Generate a mock token for a patient
  const patientToken = jwt.sign({ userId: '123', role: 'patient' }, JWT_SECRET, { expiresIn: '15m' });
  
  // 2. Generate a mock token for an admin
  const adminToken = jwt.sign({ userId: '456', role: 'admin' }, JWT_SECRET, { expiresIn: '15m' });

  // Test 1: Hit admin route with patient token
  console.log('Test 1: Patient accessing admin route');
  const res1 = await request(app)
    .get('/api/v1/admin-dashboard')
    .set('Authorization', `Bearer ${patientToken}`);
  
  if (res1.status === 403) {
    console.log(`✅ Success! Received 403 Forbidden: ${res1.body.message}`);
  } else {
    console.log(`❌ Failed! Expected 403, got ${res1.status}`);
  }

  console.log('\n----------------------------------------\n');

  // Test 2: Hit admin route with admin token
  console.log('Test 2: Admin accessing admin route');
  const res2 = await request(app)
    .get('/api/v1/admin-dashboard')
    .set('Authorization', `Bearer ${adminToken}`);
  
  if (res2.status === 200) {
    console.log(`✅ Success! Received 200 OK: ${res2.body.message}`);
  } else {
    console.log(`❌ Failed! Expected 200, got ${res2.status}`);
  }
}

runTests();
