const express = require('express');
const router = express.Router();
const {
  getAllTours,
  getTourById,
  createTour,
  updateTour,
  updateTourStatus,
  deleteTour,
  getTourSeating,
  getTourRegisteredUsers
} = require('../controllers/tourController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/', getAllTours);
router.get('/:id', getTourById);
router.get('/:id/seating', getTourSeating);

// Admin protected endpoints
router.post('/', protect, adminOnly, createTour);
router.put('/:id', protect, adminOnly, updateTour);
router.put('/:id/status', protect, adminOnly, updateTourStatus);
router.get('/:id/registered-users', protect, adminOnly, getTourRegisteredUsers);
router.delete('/:id', protect, adminOnly, deleteTour);

module.exports = router;
