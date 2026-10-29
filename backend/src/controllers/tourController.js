const Tour = require('../models/Tour');
const Booking = require('../models/Booking');

// @desc    Get all tours with optional search/filtering
// @route   GET /api/tours
// @access  Public
const getAllTours = async (req, res, next) => {
  try {
    const { destination, vehicleType, search, minPrice, maxPrice, status } = req.query;

    const query = {};

    if (status) {
      query.status = status;
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
      vehicleType,
      itinerary,
      inclusions,
      exclusions,
      images
    } = req.body;

    if (
      !title ||
      !description ||
      !destination ||
      !startLocation ||
      !startDate ||
      !endDate ||
      !pricePerPerson ||
      !totalSeats ||
      !vehicleType
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required tour fields'
      });
    }

    const tour = await Tour.create({
      title,
      description,
      destination,
      startLocation,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      pricePerPerson: Number(pricePerPerson),
      totalSeats: Number(totalSeats),
      availableSeats: req.body.availableSeats !== undefined ? Number(req.body.availableSeats) : Number(totalSeats),
      vehicleType,
      itinerary: itinerary || [],
      inclusions: inclusions || [],
      exclusions: exclusions || [],
      images: images || [],
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

    // Process dates and numbers if passed
    const updates = { ...req.body };
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.pricePerPerson) updates.pricePerPerson = Number(updates.pricePerPerson);
    if (updates.totalSeats) updates.totalSeats = Number(updates.totalSeats);
    if (updates.availableSeats !== undefined) updates.availableSeats = Number(updates.availableSeats);

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

// @desc    Delete tour
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
    const availableSeatNumbers = [];
    for (let i = 1; i <= tour.totalSeats; i++) {
      if (!bookedNumbers.includes(i)) {
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
        availableSeatNumbers
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
  deleteTour,
  getTourSeating
};
