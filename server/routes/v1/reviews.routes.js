const express = require('express');
const router = express.Router();
const Review = require('../../models/Review');
const authMiddleware = require('../../middleware/auth.middleware');

// @route   GET /api/v1/reviews
// @desc    Get all approved reviews (Public)
router.get('/', async (req, res, next) => {
  try {
    const reviews = await Review.find({ isApproved: true }).sort({ createdAt: -1 }).limit(20);
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/v1/reviews
// @desc    Submit a patient review (Public)
router.post('/', async (req, res, next) => {
  try {
    const { patientName, condition, rating, comment, location } = req.body;
    
    if (!patientName || !comment) {
      return res.status(400).json({ message: 'Patient name and review comment are required' });
    }

    const review = await Review.create({
      patientName,
      condition: condition || 'General Therapy',
      rating: Number(rating) || 5,
      comment,
      location: location || 'Himachal Pradesh',
      isApproved: false, // Moderated by default
    });

    res.status(201).json({
      message: 'Thank you! Your review has been submitted and will appear after clinical verification.',
      review,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/v1/reviews/admin
// @desc    Get all reviews for admin moderation (Admin only)
router.get('/admin', authMiddleware, async (req, res, next) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/v1/reviews/:id/status
// @desc    Toggle review approval status (Admin only)
router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/v1/reviews/:id
// @desc    Delete a review (Admin only)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
