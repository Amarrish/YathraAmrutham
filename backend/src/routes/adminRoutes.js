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
  editUser,
  getTourSeatingChart,
  reassignSeat,
  allocateSeat,
  sendTravelInfo
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// All admin routes are protected and require admin privileges
router.use(protect, adminOnly);

router.get('/stats', getAdminStats);
router.get('/bookings', getAllBookings);
router.put('/bookings/:id/confirm-offline-payment', confirmOfflinePayment);
router.put('/bookings/:id/payment-status', updatePaymentStatus);

// User management
router.get('/users', getAllUsers);
router.put('/users/:userId/reset-password', resetUserPassword);
router.put('/users/:userId', editUser);
router.delete('/users/:userId', deleteUser);

// Seating management
router.get('/tours/:tourId/seating-chart', getTourSeatingChart);
router.put('/tours/:tourId/reassign-seat', reassignSeat);
router.post('/tours/:tourId/send-travel-info', sendTravelInfo);

// Booking seat allocation (admin assigns seat for offline users)
router.post('/bookings/:bookingId/allocate-seat', allocateSeat);

module.exports = router;
