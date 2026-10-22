const User = require('../models/User');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');

// @desc    Get dashboard metrics & overview stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalTours = await Tour.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Financial calculations
    const bookings = await Booking.find();
    let totalRevenueCollected = 0;
    let pendingOfflinePaymentsCount = 0;

    bookings.forEach((b) => {
      totalRevenueCollected += b.pricing.amountPaid || 0;
      if (b.paymentStatus === 'Offline Verification Pending') {
        pendingOfflinePaymentsCount += 1;
      }
    });

    const recentBookings = await Booking.find()
      .populate('user', 'name email phone')
      .populate('tour', 'title destination startDate vehicleType')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalTours,
        totalBookings,
        totalRevenueCollected,
        pendingOfflinePaymentsCount
      },
      recentBookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings across all users
// @route   GET /api/admin/bookings
// @access  Private/Admin
const getAllBookings = async (req, res, next) => {
  try {
    const { status, paymentStatus } = req.query;
    const filter = {};

    if (status) filter.bookingStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('tour')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin confirm offline 20% advance payment & decrement seats
// @route   PUT /api/admin/bookings/:id/confirm-offline-payment
// @access  Private/Admin
const confirmOfflinePayment = async (req, res, next) => {
  try {
    const { adminNotes } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.paymentStatus === 'Advance Paid' || booking.paymentStatus === 'Fully Paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking advance payment is already confirmed.'
      });
    }

    const tour = await Tour.findById(booking.tour);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Associated tour not found'
      });
    }

    // Check seat availability before confirming
    if (tour.availableSeats < booking.numberOfSeats) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available seats (${tour.availableSeats} left). Cannot confirm booking of ${booking.numberOfSeats} seats.`
      });
    }

    // Decrement seats
    tour.availableSeats -= booking.numberOfSeats;
    if (tour.availableSeats <= 0) {
      tour.availableSeats = 0;
      tour.status = 'Full';
    }
    await tour.save();

    // Update booking status
    booking.paymentStatus = 'Advance Paid';
    booking.bookingStatus = 'Confirmed';
    booking.pricing.amountPaid = booking.pricing.advanceRequiredAmount;
    booking.confirmedByAdminAt = new Date();
    if (adminNotes) booking.adminNotes = adminNotes;

    await booking.save();

    const updatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate('tour');

    res.json({
      success: true,
      message: `Offline 20% advance payment confirmed successfully! ${booking.numberOfSeats} seats officially booked.`,
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin update general payment status (e.g. Full Paid, Rejected)
// @route   PUT /api/admin/bookings/:id/payment-status
// @access  Private/Admin
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus, adminNotes } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.paymentStatus = paymentStatus;
    if (adminNotes) booking.adminNotes = adminNotes;

    if (paymentStatus === 'Fully Paid') {
      booking.pricing.amountPaid = booking.pricing.totalAmount;
    } else if (paymentStatus === 'Rejected') {
      booking.bookingStatus = 'Cancelled';
    }

    await booking.save();

    res.json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registered users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Attach booking count to each user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const bookingsCount = await Booking.countDocuments({ user: u._id });
        return {
          ...u.toObject(),
          bookingsCount
        };
      })
    );

    res.json({
      success: true,
      count: usersWithStats.length,
      data: usersWithStats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin reset user password directly
// @route   PUT /api/admin/users/:userId/reset-password
// @access  Private/Admin
const resetUserPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword; // Will be hashed by User pre-save hook
    await user.save();

    res.json({
      success: true,
      message: `Password for user "${user.name}" (${user.email}) has been successfully reset by admin.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin remove/delete a user
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot delete their own account.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cancel or remove user's bookings and restore available seats for affected tours
    const userBookings = await Booking.find({ user: userId });
    for (const b of userBookings) {
      if (b.bookingStatus === 'Confirmed') {
        const tour = await Tour.findById(b.tour);
        if (tour) {
          tour.availableSeats = Math.min(tour.totalSeats, tour.availableSeats + b.numberOfSeats);
          if (tour.status === 'Full') tour.status = 'Active';
          await tour.save();
        }
      }
      await b.deleteOne();
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: `User "${user.name}" (${user.email}) and associated bookings have been removed successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin get seating chart with occupants for a tour
// @route   GET /api/admin/tours/:tourId/seating-chart
// @access  Private/Admin
const getTourSeatingChart = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const bookings = await Booking.find({
      tour: tour._id,
      bookingStatus: { $ne: 'Cancelled' }
    }).populate('user', 'name email phone');

    // Build map of seats 1 to totalSeats
    const seatMap = {};
    for (let i = 1; i <= tour.totalSeats; i++) {
      seatMap[i] = {
        seatNumber: i,
        isOccupied: false,
        passenger: null
      };
    }

    bookings.forEach((b) => {
      if (b.members) {
        b.members.forEach((m, idx) => {
          if (m.seatNumber && seatMap[m.seatNumber]) {
            seatMap[m.seatNumber] = {
              seatNumber: m.seatNumber,
              isOccupied: true,
              passenger: {
                name: m.name,
                age: m.age,
                gender: m.gender,
                isChild: m.isChild,
                contact: m.contact || b.contactDetails?.primaryPhone,
                bookingId: b._id,
                bookingRef: b.bookingId,
                customerName: b.user?.name || b.contactDetails?.primaryName,
                customerEmail: b.user?.email || b.contactDetails?.primaryEmail,
                paymentStatus: b.paymentStatus,
                bookingStatus: b.bookingStatus,
                memberIndex: idx
              }
            };
          }
        });
      }
    });

    const seatsArray = Object.values(seatMap);

    res.json({
      success: true,
      data: {
        tour: {
          id: tour._id,
          title: tour.title,
          destination: tour.destination,
          vehicleType: tour.vehicleType,
          totalSeats: tour.totalSeats,
          availableSeats: tour.availableSeats
        },
        seats: seatsArray
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin rearrange/reassign seat for a passenger
// @route   PUT /api/admin/tours/:tourId/reassign-seat
// @access  Private/Admin
const reassignSeat = async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const { fromSeat, toSeat } = req.body;

    const fromNum = Number(fromSeat);
    const toNum = Number(toSeat);

    if (!fromNum || !toNum || fromNum === toNum) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid and different "fromSeat" and "toSeat" numbers.'
      });
    }

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    if (toNum < 1 || toNum > tour.totalSeats) {
      return res.status(400).json({
        success: false,
        message: `Target seat number must be between 1 and ${tour.totalSeats}.`
      });
    }

    // Find booking that currently holds fromSeat
    const fromBooking = await Booking.findOne({
      tour: tour._id,
      bookingStatus: { $ne: 'Cancelled' },
      'members.seatNumber': fromNum
    });

    if (!fromBooking) {
      return res.status(404).json({
        success: false,
        message: `No passenger found currently occupying seat #${fromNum}.`
      });
    }

    // Check if toSeat is already occupied
    const toBooking = await Booking.findOne({
      tour: tour._id,
      bookingStatus: { $ne: 'Cancelled' },
      'members.seatNumber': toNum
    });

    if (!toBooking) {
      // Empty seat move: Move passenger from fromNum to toNum
      const member = fromBooking.members.find((m) => m.seatNumber === fromNum);
      if (member) member.seatNumber = toNum;

      // Update allocatedSeats array
      fromBooking.allocatedSeats = fromBooking.members.map((m) => m.seatNumber);
      await fromBooking.save();

      return res.json({
        success: true,
        message: `Seat rearranged! Passenger "${member?.name}" successfully moved from Seat #${fromNum} to Seat #${toNum}.`
      });
    } else {
      // Swapping: toSeat is occupied by another passenger! Swap their seats cleanly.
      const fromMember = fromBooking.members.find((m) => m.seatNumber === fromNum);
      const toMember = toBooking.members.find((m) => m.seatNumber === toNum);

      if (fromBooking._id.toString() === toBooking._id.toString()) {
        // Same booking swap
        fromMember.seatNumber = toNum;
        toMember.seatNumber = fromNum;
        fromBooking.allocatedSeats = fromBooking.members.map((m) => m.seatNumber);
        await fromBooking.save();
      } else {
        // Different bookings swap
        fromMember.seatNumber = toNum;
        fromBooking.allocatedSeats = fromBooking.members.map((m) => m.seatNumber);
        await fromBooking.save();

        toMember.seatNumber = fromNum;
        toBooking.allocatedSeats = toBooking.members.map((m) => m.seatNumber);
        await toBooking.save();
      }

      return res.json({
        success: true,
        message: `Seats swapped! "${fromMember?.name}" is now on Seat #${toNum}, and "${toMember?.name}" is now on Seat #${fromNum}.`
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllBookings,
  confirmOfflinePayment,
  updatePaymentStatus,
  getAllUsers,
  resetUserPassword,
  deleteUser,
  getTourSeatingChart,
  reassignSeat
};
