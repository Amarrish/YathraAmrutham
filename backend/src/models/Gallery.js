const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    mediaType: {
      type: String,
      enum: ['photo', 'video'],
      required: [true, 'Please specify media type (photo or video)']
    },
    mediaUrl: {
      type: String,
      required: [true, 'Please provide media URL']
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    },
    isUpcomingTourProgram: {
      type: Boolean,
      default: false
    },
    upcomingProgram: {
      tourTitle: { type: String, default: '' },
      destination: { type: String, default: '' },
      dates: { type: String, default: '' },
      itineraryBrief: { type: String, default: '' },
      relatedTourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour'
      }
    },
    order: {
      type: Number,
      default: 0
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

const Gallery = mongoose.model('Gallery', gallerySchema);
module.exports = Gallery;
