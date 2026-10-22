const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllBookings,
  confirmOfflinePayment,
  updatePaymentStatus,
  getAllUsers,
  resetUserPassword,
  deleteUser,
  getTourSeatingChart,
  reassignSeat
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// All admin routes are protected and require admin privileges
router.use(protect, adminOnly);

router.get('/stats', getAdminStats);
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/confirm-offline-payment', confirmOfflinePayment);
router.put('/bookings/:id/payment-status', updatePaymentStatus);
router.get('/users', getAllUsers);
router.put('/users/:userId/reset-password', resetUserPassword);
router.delete('/users/:userId', deleteUser);

// Seating management & rearrange routes
router.get('/tours/:tourId/seating-chart', getTourSeatingChart);
router.put('/tours/:tourId/reassign-seat', reassignSeat);

module.exports = router;
