const Booking = require('../models/Booking');
const Tour = require('../models/Tour');

// Helper to generate human-readable booking ID: BK-YYYYMMDD-XXXX
const generateBookingId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `BK-${dateStr}-${randomSuffix}`;
};

// @desc    Create a new tour booking
// @route   POST /api/bookings
// @access  Private (User)
const createBooking = async (req, res, next) => {
  try {
    const {
      tourId,
      numberOfSeats,
      members,
      contactDetails,
      paymentMethod,
      offlinePaymentDetails,
      nonRefundableAcknowledged
    } = req.body;

    if (!tourId || !numberOfSeats || !members || !contactDetails || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all booking details including members and payment method.'
      });
    }

    if (!nonRefundableAcknowledged) {
      return res.status(400).json({
        success: false,
        message: 'You must acknowledge and accept that the 20% advance fee is non-refundable.'
      });
    }

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'The requested tour was not found.'
      });
    }

    const seatsCount = Number(numberOfSeats);
    if (tour.availableSeats < seatsCount) {
      return res.status(400).json({
        success: false,
        message: `Only ${tour.availableSeats} seats are currently available for this tour. Cannot reserve ${seatsCount} seats.`
      });
    }

    if (members.length !== seatsCount) {
      return res.status(400).json({
        success: false,
        message: `Member details list has ${members.length} entries, but ${seatsCount} seats were selected.`
      });
    }

    // Determine booked seats on this tour to prevent overlapping seat selections
    const existingBookings = await Booking.find({
      tour: tour._id,
      bookingStatus: { $ne: 'Cancelled' }
    });

    const alreadyBookedSeats = new Set();
    existingBookings.forEach((b) => {
      if (b.allocatedSeats && b.allocatedSeats.length > 0) {
        b.allocatedSeats.forEach((s) => alreadyBookedSeats.add(Number(s)));
      }
      if (b.members) {
        b.members.forEach((m) => {
          if (m.seatNumber) alreadyBookedSeats.add(Number(m.seatNumber));
        });
      }
    });

    // Check requested seat numbers
    let requestedSeats = req.body.selectedSeats;
    if (!requestedSeats || !Array.isArray(requestedSeats) || requestedSeats.length !== seatsCount) {
      // Check if seats are set inside members array
      const memberSeats = members.map((m) => m.seatNumber).filter(Boolean);
      if (memberSeats.length === seatsCount) {
        requestedSeats = memberSeats.map(Number);
      } else {
        // Auto-assign first available seats
        requestedSeats = [];
        for (let i = 1; i <= tour.totalSeats; i++) {
          if (!alreadyBookedSeats.has(i)) {
            requestedSeats.push(i);
            if (requestedSeats.length === seatsCount) break;
          }
        }
      }
    } else {
      requestedSeats = requestedSeats.map(Number);
    }

    // Validate seat bounds and duplicates
    const invalidSeats = requestedSeats.filter((s) => s < 1 || s > tour.totalSeats);
    if (invalidSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Seat numbers must be between 1 and ${tour.totalSeats}. Invalid: ${invalidSeats.join(', ')}`
      });
    }

    const uniqueRequested = new Set(requestedSeats);
    if (uniqueRequested.size !== seatsCount) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate seat numbers selected in the same booking.'
      });
    }

    const conflicts = requestedSeats.filter((s) => alreadyBookedSeats.has(s));
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Seat number(s) ${conflicts.join(', ')} are already booked by another passenger. Please select available seats.`
      });
    }

    // Allocate seat numbers to each passenger in members array
    members.forEach((m, idx) => {
      m.seatNumber = requestedSeats[idx];
    });

    // Financial calculations
    const pricePerPerson = tour.pricePerPerson;
    const totalAmount = pricePerPerson * seatsCount;
    const advanceRequiredAmount = Math.round(totalAmount * 0.2); // 20% advance non-refundable
    const remainingAmount = totalAmount - advanceRequiredAmount;

    let paymentStatus = 'Pending';
    let bookingStatus = 'Pending Confirmation';
    let amountPaid = 0;

    if (paymentMethod === 'Online') {
      // Instant online simulation confirmed
      paymentStatus = 'Advance Paid';
      bookingStatus = 'Confirmed';
      amountPaid = advanceRequiredAmount;

      // Decrement seats immediately for online paid bookings
      tour.availableSeats -= seatsCount;
      if (tour.availableSeats <= 0) {
        tour.availableSeats = 0;
        tour.status = 'Full';
      }
      await tour.save();
    } else {
      // Offline payment pending admin confirmation
      paymentStatus = 'Offline Verification Pending';
      bookingStatus = 'Pending Confirmation';
      amountPaid = 0;
    }

    const booking = await Booking.create({
      bookingId: generateBookingId(),
      user: req.user._id,
      tour: tour._id,
      numberOfSeats: seatsCount,
      members,
      allocatedSeats: requestedSeats,
      contactDetails,
      pricing: {
        pricePerPerson,
        totalAmount,
        advanceRequiredAmount,
        remainingAmount,
        amountPaid
      },
      nonRefundableAcknowledged: true,
      paymentMethod,
      offlinePaymentDetails: offlinePaymentDetails || {},
      paymentStatus,
      bookingStatus
    });

    const populatedBooking = await Booking.findById(booking._id).populate('tour');

    res.status(201).json({
      success: true,
      message:
        paymentMethod === 'Online'
          ? 'Booking confirmed! 20% non-refundable advance received.'
          : 'Booking submitted. Offline payment awaiting admin confirmation.',
      data: populatedBooking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings for the logged-in user
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
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

// @desc    Get booking details by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('tour')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Ensure only the owner or an admin can access this booking
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById
};
