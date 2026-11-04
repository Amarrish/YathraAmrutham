const Tour = require('../models/Tour');
const Booking = require('../models/Booking');

// @desc    Get all tours with optional search/filtering
// @route   GET /api/tours
// @access  Public
const getAllTours = async (req, res, next) => {
  try {
    const { destination, vehicleType, search, minPrice, maxPrice, status, includeDeleted } = req.query;

    const query = {};

    // By default exclude soft-deleted tours
    if (includeDeleted !== 'true') {
      query.isDeleted = { $ne: true };
    }

    if (status !== undefined && status !== '') {
      if (status !== 'all') {
        query.status = status;
      }
    } else {
      query.status = { $in: ['Active', 'Upcoming', 'Full'] };
    }

    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }

    if (vehicleType) {
      query.vehicleType = { $regex: vehicleType, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.pricePerPerson = {};
      if (minPrice) query.pricePerPerson.$gte = Number(minPrice);
      if (maxPrice) query.pricePerPerson.$lte = Number(maxPrice);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
        { startLocation: { $regex: search, $options: 'i' } },
        { vehicleType: { $regex: search, $options: 'i' } }
      ];
    }

    const tours = await Tour.find(query).sort({ startDate: 1 });

    res.json({
      success: true,
      count: tours.length,
      data: tours
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tour by ID
// @route   GET /api/tours/:id
// @access  Public
const getTourById = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    res.json({
      success: true,
      data: tour
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new tour
// @route   POST /api/tours
// @access  Private/Admin
const createTour = async (req, res, next) => {
  try {
    const {
      title,
      description,
      destination,
      startLocation,
      startDate,
      endDate,
      pricePerPerson,
      totalSeats,
      availableSeats,
      vehicleType,
      itinerary,
      inclusions,
      exclusions,
      images,
      seatingGrid,
      status
    } = req.body;

    if (
      !title ||
      !description ||
      !destination ||
      !startLocation ||
      !startDate ||
      !endDate ||
      !pricePerPerson ||
      (!totalSeats && (!seatingGrid || !seatingGrid.cells)) ||
      !vehicleType
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required tour fields'
      });
    }

    // If seatingGrid is provided, calculate totalSeats from active seat cells
    let finalTotalSeats = Number(totalSeats);
    if (seatingGrid && Array.isArray(seatingGrid.cells) && seatingGrid.cells.length > 0) {
      const activeSeatCells = seatingGrid.cells.filter((c) => c.isSeat);
      if (activeSeatCells.length > 0) {
        finalTotalSeats = activeSeatCells.length;
      }
    }

    const finalAvailableSeats =
      availableSeats !== undefined ? Number(availableSeats) : finalTotalSeats;

    const tour = await Tour.create({
      title,
      description,
      destination,
      startLocation,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      pricePerPerson: Number(pricePerPerson),
      totalSeats: finalTotalSeats,
      availableSeats: finalAvailableSeats,
      vehicleType,
      itinerary: itinerary || [],
      inclusions: inclusions || [],
      exclusions: exclusions || [],
      images: images || [],
      seatingGrid: seatingGrid || undefined,
      status: status || 'Active',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      data: tour
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tour
// @route   PUT /api/tours/:id
// @access  Private/Admin
const updateTour = async (req, res, next) => {
  try {
    let tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const updates = { ...req.body };
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.pricePerPerson) updates.pricePerPerson = Number(updates.pricePerPerson);

    // If seatingGrid is updated, sync totalSeats
    if (updates.seatingGrid && Array.isArray(updates.seatingGrid.cells)) {
      const activeSeatCells = updates.seatingGrid.cells.filter((c) => c.isSeat);
      if (activeSeatCells.length > 0) {
        updates.totalSeats = activeSeatCells.length;
      }
    } else if (updates.totalSeats) {
      updates.totalSeats = Number(updates.totalSeats);
    }

    if (updates.availableSeats !== undefined) {
      updates.availableSeats = Number(updates.availableSeats);
    }

    tour = await Tour.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Tour updated successfully',
      data: tour
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tour status (e.g. Active, Completed)
// @route   PUT /api/tours/:id/status
// @access  Private/Admin
const updateTourStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !['Active', 'Completed', 'Upcoming', 'Full', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required (Active, Completed, Upcoming, Full, Cancelled)'
      });
    }

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found' });
    }

    tour.status = status;
    await tour.save();

    res.json({
      success: true,
      message: `Tour marked as ${status} successfully`,
      data: tour
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tour (soft-deletes if bookings exist to preserve "Tour Name Unavailable" history)
// @route   DELETE /api/tours/:id
// @access  Private/Admin
const deleteTour = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    const existingBookings = await Booking.countDocuments({
      tour: tour._id,
      bookingStatus: { $ne: 'Cancelled' }
    });

    if (existingBookings > 0) {
      // Soft delete: marks as deleted so customers see "Tour Name Unavailable (Removed by Admin)" safely
      tour.isDeleted = true;
      tour.status = 'Cancelled';
      await tour.save();

      return res.json({
        success: true,
        message: `Tour "${tour.title}" has ${existingBookings} active booking(s). It has been safely archived as "Unavailable" to preserve customer tickets.`
      });
    }

    await tour.deleteOne();

    res.json({
      success: true,
      message: 'Tour removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visual seating layout & booked seat numbers for a tour
// @route   GET /api/tours/:id/seating
// @access  Public
const getTourSeating = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Find all active/pending/confirmed bookings for this tour
    const bookings = await Booking.find({
      tour: tour._id,
      bookingStatus: { $ne: 'Cancelled' }
    });

    const bookedSeats = [];
    bookings.forEach((b) => {
      if (b.members && b.members.length > 0) {
        b.members.forEach((m, idx) => {
          if (m.seatNumber) {
            bookedSeats.push({
              seatNumber: m.seatNumber,
              bookingId: b._id,
              bookingRef: b.bookingId,
              passengerName: m.name,
              gender: m.gender,
              age: m.age,
              isChild: m.isChild,
              paymentStatus: b.paymentStatus,
              bookingStatus: b.bookingStatus,
              memberIndex: idx
            });
          }
        });
      }
    });

    const bookedNumbers = bookedSeats.map((s) => s.seatNumber);

    // Blocked/Disabled by admin
    const blockedSeats =
      tour.seatingGrid?.cells
        ?.filter((c) => c.isBlockedByAdmin && c.seatNumber)
        .map((c) => c.seatNumber) || [];

    const availableSeatNumbers = [];
    for (let i = 1; i <= tour.totalSeats; i++) {
      if (!bookedNumbers.includes(i) && !blockedSeats.includes(i)) {
        availableSeatNumbers.push(i);
      }
    }

    res.json({
      success: true,
      data: {
        tourId: tour._id,
        tourTitle: tour.title,
        vehicleType: tour.vehicleType,
        totalSeats: tour.totalSeats,
        availableSeatsCount: availableSeatNumbers.length,
        bookedSeats,
        bookedNumbers,
        blockedSeats,
        availableSeatNumbers,
        seatingGrid: tour.seatingGrid || null
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registered users & passengers for a tour
// @route   GET /api/tours/:id/registered-users
// @access  Private/Admin
const getTourRegisteredUsers = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found' });
    }

    const bookings = await Booking.find({
      tour: tour._id,
      bookingStatus: { $ne: 'Cancelled' }
    })
      .populate('user', 'name email phone address')
      .sort({ createdAt: -1 });

    const passengers = [];
    let totalRevenue = 0;
    let totalAdvancePaid = 0;

    bookings.forEach((b) => {
      totalRevenue += b.pricing?.totalAmount || 0;
      totalAdvancePaid += b.pricing?.amountPaid || 0;

      b.members.forEach((m, idx) => {
        passengers.push({
          bookingId: b._id,
          bookingRef: b.bookingId,
          bookerName: b.user?.name || b.contactDetails?.primaryName,
          bookerEmail: b.user?.email || b.contactDetails?.primaryEmail,
          bookerPhone: b.user?.phone || b.contactDetails?.primaryPhone,
          bookerAddress: b.user?.address || b.contactDetails?.address,
          passengerName: m.name,
          age: m.age,
          gender: m.gender,
          isChild: m.isChild,
          seatNumber: m.seatNumber || null,
          paymentStatus: b.paymentStatus,
          bookingStatus: b.bookingStatus,
          paymentMethod: b.paymentMethod,
          amountPaid: b.pricing?.amountPaid || 0,
          totalAmount: b.pricing?.totalAmount || 0,
          memberIndex: idx,
          createdAt: b.createdAt
        });
      });
    });

    res.json({
      success: true,
      data: {
        tour: {
          id: tour._id,
          title: tour.title,
          destination: tour.destination,
          startLocation: tour.startLocation,
          startDate: tour.startDate,
          endDate: tour.endDate,
          vehicleType: tour.vehicleType,
          totalSeats: tour.totalSeats,
          availableSeats: tour.availableSeats,
          status: tour.status
        },
        stats: {
          totalBookings: bookings.length,
          totalPassengers: passengers.length,
          totalRevenue,
          totalAdvancePaid
        },
        passengers,
        bookings
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTours,
  getTourById,
  createTour,
  updateTour,
  updateTourStatus,
  deleteTour,
  getTourSeating,
  getTourRegisteredUsers
};
