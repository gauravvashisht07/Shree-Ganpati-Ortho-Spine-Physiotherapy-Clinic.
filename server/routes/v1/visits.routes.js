const express = require('express');
const router = express.Router();
const visitController = require('../../controllers/visit.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/rbac.middleware');

// All visit management routes require admin role
router.use(authMiddleware, requireRole('admin'));

// 1. Record a new clinical visit (supports historical/backdated dates)
router.post('/', visitController.createVisit);

// 2. Query clinical visits with date, doctor, and patient filters
router.get('/', visitController.getVisits);

// 3. Update an existing clinical visit (change date, notes, service, doctor)
router.put('/:id', visitController.updateVisit);

// 4. Delete an existing clinical visit (without deleting patient)
router.delete('/:id', visitController.deleteVisit);

module.exports = router;
