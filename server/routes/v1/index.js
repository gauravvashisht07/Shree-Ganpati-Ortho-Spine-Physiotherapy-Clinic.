const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const doctorsRoutes = require('./doctors.routes');
const servicesRoutes = require('./services.routes');
const appointmentsRoutes = require('./appointments.routes');
const reviewsRoutes = require('./reviews.routes');
const blogsRoutes = require('./blogs.routes');

router.use('/auth', authRoutes);
router.use('/doctors', doctorsRoutes);
router.use('/services', servicesRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/blogs', blogsRoutes);

// Basic health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

module.exports = router;
