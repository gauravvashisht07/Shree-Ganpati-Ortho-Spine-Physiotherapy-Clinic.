const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/analytics.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const requireRole = require('../../middleware/rbac.middleware');

// All analytics routes require authenticated admin access
router.use(authMiddleware, requireRole('admin'));

// 1. KPI Overview
router.get('/overview', analyticsController.getOverview);

// 2. Daily, Weekly & Monthly Visit Trends
router.get('/visit-trends', analyticsController.getVisitTrends);

// 3. Demographics (Age Group & Gender Breakdown)
router.get('/demographics', analyticsController.getDemographics);

// 4. Busiest Days & Rush Heatmap
router.get('/rush-hours', analyticsController.getRushHours);

// 5. Service Popularity & Revenue
router.get('/services', analyticsController.getServicesAnalytics);

// 6. Patient Retention & Returning Patients
router.get('/retention', analyticsController.getPatientRetention);

// 7. Individual Patient Visit History
router.get('/patient-history/:patientId', analyticsController.getPatientHistory);

// 8. Filtered CSV Export
router.get('/export', analyticsController.exportCSV);

module.exports = router;
