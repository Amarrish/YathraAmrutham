const express = require('express');
const router = express.Router();
const {
  getAllTours,
  getTourById,
  createTour,
  updateTour,
  deleteTour,
  getTourSeating
} = require('../controllers/tourController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/', getAllTours);
router.get('/:id', getTourById);
router.get('/:id/seating', getTourSeating);
router.post('/', protect, adminOnly, createTour);
router.put('/:id', protect, adminOnly, updateTour);
router.delete('/:id', protect, adminOnly, deleteTour);

module.exports = router;
