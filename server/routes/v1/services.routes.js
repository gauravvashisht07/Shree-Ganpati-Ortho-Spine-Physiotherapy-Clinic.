const express = require('express');
const router = express.Router();
const serviceController = require('../../controllers/service.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/rbac.middleware');

router.get('/', serviceController.getAll);
router.get('/:id', serviceController.getById);

// Restrict modifications to admin
router.post('/', authMiddleware, requireRole('admin'), serviceController.create);
router.put('/:id', authMiddleware, requireRole('admin'), serviceController.update);
router.delete('/:id', authMiddleware, requireRole('admin'), serviceController.delete);

module.exports = router;
