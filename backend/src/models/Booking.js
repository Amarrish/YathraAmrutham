const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Passenger name is required'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Passenger age is required'],
    min: [0, 'Age cannot be negative']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Passenger gender is required']
  },
  isChild: {
    type: Boolean,
    default: false
  },
  address: {
    type: String,
    default: ''
  },
  contact: {
    type: String,
    default: ''
  },
  optionalImage: {
    type: String,
    default: ''
  },
  seatNumber: {
    type: Number,
    min: [1, 'Seat number must be at least 1']
  }
});

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: true
    },
    numberOfSeats: {
      type: Number,
      required: [true, 'Number of seats is required'],
      min: [1, 'Must book at least 1 seat']
    },
    members: {
      type: [memberSchema],
      required: true,
      validate: [
        function (members) {
          return members.length === this.numberOfSeats;
        },
        'Member details must match the number of seats booked'
      ]
    },
    allocatedSeats: {
      type: [Number],
      default: []
    },
    contactDetails: {
      primaryName: { type: String, required: true },
      primaryPhone: { type: String, required: true },
      primaryEmail: { type: String, required: true },
      address: { type: String, required: true }
    },
    pricing: {
      pricePerPerson: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      advanceRequiredAmount: { type: Number, required: true }, // 20%
      remainingAmount: { type: Number, required: true }, // 80%
      amountPaid: { type: Number, default: 0 }
    },
    nonRefundableAcknowledged: {
      type: Boolean,
      required: true,
      default: true
    },
    paymentMethod: {
      type: String,
      enum: ['Online', 'Offline'],
      required: true
    },
    offlinePaymentDetails: {
      referenceNumber: { type: String, default: '' },
      paymentMode: {
        type: String,
        enum: ['Bank Transfer', 'UPI', 'Cash', 'Other'],
        default: 'UPI'
      },
      notes: { type: String, default: '' },
      submittedAt: { type: Date }
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Advance Paid', 'Fully Paid', 'Offline Verification Pending', 'Rejected'],
      default: 'Pending'
    },
    bookingStatus: {
      type: String,
      enum: ['Pending Confirmation', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending Confirmation'
    },
    adminNotes: {
      type: String,
      default: ''
    },
    confirmedByAdminAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
