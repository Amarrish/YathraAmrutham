const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a tour title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide a tour description']
    },
    destination: {
      type: String,
      required: [true, 'Please provide a tour destination'],
      trim: true
    },
    startLocation: {
      type: String,
      required: [true, 'Please provide starting location / pickup point'],
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide departure start date']
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide coming back / end date']
    },
    pricePerPerson: {
      type: Number,
      required: [true, 'Please provide tour fee per person'],
      min: [0, 'Tour fee cannot be negative']
    },
    totalSeats: {
      type: Number,
      required: [true, 'Please specify total seats capacity'],
      min: [1, 'Must have at least 1 seat']
    },
    availableSeats: {
      type: Number,
      required: [true, 'Please specify available seats'],
      min: [0, 'Available seats cannot be negative']
    },
    vehicleType: {
      type: String,
      required: [true, 'Please specify vehicle type'],
      trim: true
    },
    itinerary: [
      {
        day: { type: Number, required: true },
        title: { type: String, required: true },
        details: { type: String, required: true }
      }
    ],
    inclusions: {
      type: [String],
      default: []
    },
    exclusions: {
      type: [String],
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['Active', 'Upcoming', 'Full', 'Completed', 'Cancelled'],
      default: 'Active'
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    seatingGrid: {
      rows: { type: Number, default: 10 },
      columns: { type: Number, default: 5 },
      cells: [
        {
          row: { type: Number, required: true },
          col: { type: Number, required: true },
          isSeat: { type: Boolean, default: true },
          seatNumber: { type: Number },
          isBlockedByAdmin: { type: Boolean, default: false }
        }
      ]
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Virtual property to calculate duration in days
tourSchema.virtual('durationDays').get(function () {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(new Date(this.endDate) - new Date(this.startDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  return 1;
});

tourSchema.set('toJSON', { virtuals: true });
tourSchema.set('toObject', { virtuals: true });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
