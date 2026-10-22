const express = require('express');
const router = express.Router();
const patientController = require('../../controllers/patient.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/rbac.middleware');

// All patient management routes require admin role
router.use(authMiddleware, requireRole('admin'));

// 1. Directory of patients with search and date filters
router.get('/', patientController.getPatients);

// 2. Real-time patient search / duplicate detection
router.get('/search', patientController.searchPatients);

// 3. Single patient profile with complete visit history
router.get('/:id', patientController.getPatientById);

// 4. Register new patient (with optional historical date)
router.post('/', patientController.createPatient);

// 5. Update patient profile
router.put('/:id', patientController.updatePatient);

// 6. Delete patient
router.delete('/:id', patientController.deletePatient);

module.exports = router;
