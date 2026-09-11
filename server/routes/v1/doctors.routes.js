const express = require('express');
const router = express.Router();
const doctorController = require('../../controllers/doctor.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/rbac.middleware');

router.get('/', doctorController.getAll);
router.get('/:id', doctorController.getById);
router.get('/:id/slots', doctorController.getAvailableSlots); // Public or patient protected

router.post('/', authMiddleware, requireRole('admin'), doctorController.create);
router.put('/:id', authMiddleware, requireRole('admin'), doctorController.update);
router.delete('/:id', authMiddleware, requireRole('admin'), doctorController.delete);

module.exports = router;
