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

    const blockedSeats =
      tour.seatingGrid?.cells
        ?.filter((c) => c.isBlockedByAdmin && c.seatNumber)
        .map((c) => c.seatNumber) || [];

    res.json({
      success: true,
      data: {
        tour: {
          id: tour._id,
          title: tour.title,
          destination: tour.destination,
          vehicleType: tour.vehicleType,
          totalSeats: tour.totalSeats,
          availableSeats: tour.availableSeats,
          seatingGrid: tour.seatingGrid || null,
          blockedSeats
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

// @desc    Admin edit user details (name, phone, address, role)
// @route   PUT /api/admin/users/:userId
// @access  Private/Admin
const editUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, phone, address, role } = req.body;

    if (userId.toString() === req.user._id.toString() && role && role !== req.user.role) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot change their own role.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (address !== undefined) user.address = address.trim();
    if (role !== undefined && ['user', 'admin'].includes(role)) user.role = role;

    await user.save();
    const updatedUser = await User.findById(userId).select('-password');

    res.json({
      success: true,
      message: `User "${updatedUser.name}" updated successfully.`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin manually allocate a seat for an offline/unallocated booking member
// @route   POST /api/admin/bookings/:bookingId/allocate-seat
// @access  Private/Admin
const allocateSeat = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { memberId, seatNumber } = req.body;

    const seatNum = Number(seatNumber);
    if (!seatNum || seatNum < 1) {
      return res.status(400).json({ success: false, message: 'Invalid seat number.' });
    }

    const booking = await Booking.findById(bookingId).populate('tour');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const tour = booking.tour;
    if (seatNum > tour.totalSeats) {
      return res.status(400).json({
        success: false,
        message: `Seat number must be between 1 and ${tour.totalSeats}.`
      });
    }

    // Check conflict with another booking
    const conflictBooking = await Booking.findOne({
      tour: tour._id,
      bookingStatus: { $ne: 'Cancelled' },
      'members.seatNumber': seatNum,
      _id: { $ne: bookingId }
    });

    if (conflictBooking) {
      return res.status(400).json({
        success: false,
        message: `Seat #${seatNum} is already occupied. Choose a different seat.`
      });
    }

    // Find member by _id or index
    let memberFound = false;
    for (let i = 0; i < booking.members.length; i++) {
      const m = booking.members[i];
      if (m._id.toString() === memberId || String(i) === String(memberId)) {
        if (m.seatNumber === seatNum) {
          return res.status(400).json({ success: false, message: `Member already has seat #${seatNum}.` });
        }
        booking.members[i].seatNumber = seatNum;
        memberFound = true;
        break;
      }
    }

    if (!memberFound) {
      return res.status(404).json({ success: false, message: 'Member not found in booking.' });
    }

    booking.allocatedSeats = booking.members.map((m) => m.seatNumber).filter(Boolean);
    await booking.save();

    res.json({
      success: true,
      message: `Seat #${seatNum} allocated successfully.`,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin send travel info email to all confirmed passengers of a tour
// @route   POST /api/admin/tours/:tourId/send-travel-info
// @access  Private/Admin
const sendTravelInfo = async (req, res, next) => {
  try {
    const { tourId } = req.params;

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found.' });
    }

    const bookings = await Booking.find({
      tour: tourId,
      bookingStatus: 'Confirmed'
    }).populate('user', 'name email phone');

    if (bookings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No confirmed bookings found for this tour.'
      });
    }

    const nodemailer = require('nodemailer');

    let transporter;
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
    }

    let sentCount = 0;
    const emailResults = [];

    for (const booking of bookings) {
      for (const member of booking.members) {
        const recipientEmail = booking.user?.email || booking.contactDetails?.primaryEmail;
        const recipientName = member.name || booking.user?.name;
        if (!recipientEmail) continue;

        const mailOptions = {
          from: `"WanderWise Travels" <${process.env.SMTP_USER || 'noreply@wanderwise.com'}>`,
          to: recipientEmail,
          subject: `🚌 Your Travel Details — ${tour.title}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:12px;">
              <div style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:24px;border-radius:10px 10px 0 0;text-align:center;">
                <h1 style="color:white;margin:0;font-size:22px;">✈️ WanderWise Travels</h1>
                <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">Your Journey Awaits!</p>
              </div>
              <div style="background:white;padding:28px;border-radius:0 0 10px 10px;border:1px solid #e2e8f0;">
                <h2 style="color:#1e293b;margin-top:0;">Hello, ${recipientName}! 👋</h2>
                <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:16px 0;">
                  <h3 style="color:#0369a1;margin:0 0 12px;">📋 Trip Summary</h3>
                  <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <tr><td style="padding:4px 0;color:#64748b;width:140px;">Tour:</td><td style="font-weight:bold;color:#1e293b;">${tour.title}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748b;">Destination:</td><td style="font-weight:bold;color:#1e293b;">${tour.destination}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748b;">Starting From:</td><td style="font-weight:bold;color:#1e293b;">${tour.startLocation}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748b;">Departure:</td><td style="font-weight:bold;color:#1e293b;">${new Date(tour.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748b;">Return:</td><td style="font-weight:bold;color:#1e293b;">${new Date(tour.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748b;">Vehicle:</td><td style="font-weight:bold;color:#1e293b;">${tour.vehicleType}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748b;">Seat Number:</td><td style="font-weight:bold;color:#059669;font-size:15px;">#${member.seatNumber || 'TBD'}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748b;">Co-passengers:</td><td style="font-weight:bold;color:#1e293b;">${booking.numberOfSeats} total passengers</td></tr>
                  </table>
                </div>
                <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:16px 0;">
                  <h3 style="color:#15803d;margin:0 0 12px;">👤 Your Passenger Details</h3>
                  <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <tr><td style="padding:4px 0;color:#64748b;width:140px;">Name:</td><td style="font-weight:bold;color:#1e293b;">${member.name}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748b;">Age:</td><td style="font-weight:bold;color:#1e293b;">${member.age} years</td></tr>
                    <tr><td style="padding:4px 0;color:#64748b;">Gender:</td><td style="font-weight:bold;color:#1e293b;">${member.gender}</td></tr>
                    <tr><td style="padding:4px 0;color:#64748b;">Booking Ref:</td><td style="font-weight:bold;color:#1e293b;">${booking.bookingId || booking._id}</td></tr>
                  </table>
                </div>
                <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin:16px 0;font-size:12px;">
                  <strong style="color:#92400e;">⚠️ Important:</strong>
                  <span style="color:#78350f;"> Please arrive at the pickup point at least <strong>30 minutes before departure</strong>. Carry a valid photo ID.</span>
                </div>
                <p style="color:#64748b;font-size:12px;">Questions? Contact us: <strong>support@wanderwise.com</strong> | <strong>+91 98765 43210</strong></p>
                <p style="color:#94a3b8;font-size:11px;">© 2026 WanderWise Travels. Have a wonderful journey! 🌟</p>
              </div>
            </div>
          `
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          sentCount++;
          emailResults.push({ email: recipientEmail, member: member.name, messageId: info.messageId });
          const previewUrl = nodemailer.getTestMessageUrl(info);
          if (previewUrl) console.log(`📧 Travel info sent to ${recipientEmail}. Preview: ${previewUrl}`);
        } catch (emailErr) {
          console.error(`Failed to send to ${recipientEmail}:`, emailErr.message);
        }
      }
    }

    // SMS stub
    console.log(`[SMS STUB] Would send SMS to confirmed passengers for tour: ${tour.title}. Set TWILIO_SID env var to activate.`);

    res.json({
      success: true,
      message: `Travel information sent to ${sentCount} passenger(s) successfully.`,
      data: { tourId, tourTitle: tour.title, emailsSent: sentCount, results: emailResults }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin toggle seat block/enable for a tour
// @route   PUT /api/admin/tours/:tourId/toggle-seat-block
// @access  Private/Admin
const toggleSeatBlock = async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const { seatNumber } = req.body;

    const seatNum = Number(seatNumber);
    if (!seatNum || seatNum < 1) {
      return res.status(400).json({ success: false, message: 'Valid seatNumber is required' });
    }

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour not found' });
    }

    const isOccupied = await Booking.findOne({
      tour: tour._id,
      bookingStatus: { $ne: 'Cancelled' },
      'members.seatNumber': seatNum
    });

    if (isOccupied) {
      return res.status(400).json({
        success: false,
        message: `Seat #${seatNum} is currently booked by a passenger and cannot be blocked.`
      });
    }

    if (!tour.seatingGrid || !Array.isArray(tour.seatingGrid.cells) || tour.seatingGrid.cells.length === 0) {
      tour.seatingGrid = {
        rows: Math.ceil(tour.totalSeats / 4),
        columns: 4,
        cells: []
      };
      for (let i = 1; i <= tour.totalSeats; i++) {
        tour.seatingGrid.cells.push({
          row: Math.ceil(i / 4),
          col: ((i - 1) % 4) + 1,
          isSeat: true,
          seatNumber: i,
          isBlockedByAdmin: false
        });
      }
    }

    const cell = tour.seatingGrid.cells.find((c) => c.seatNumber === seatNum && c.isSeat);
    if (!cell) {
      return res.status(404).json({ success: false, message: `Seat #${seatNum} not found in layout.` });
    }

    cell.isBlockedByAdmin = !cell.isBlockedByAdmin;
    const nowBlocked = cell.isBlockedByAdmin;

    await tour.save();

    res.json({
      success: true,
      message: `Seat #${seatNum} is now ${nowBlocked ? 'Blocked (Disabled)' : 'Enabled (Available)'}.`,
      data: {
        seatNumber: seatNum,
        isBlockedByAdmin: nowBlocked
      }
    });
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
  editUser,
  getTourSeatingChart,
  reassignSeat,
  allocateSeat,
  sendTravelInfo,
  toggleSeatBlock
};
