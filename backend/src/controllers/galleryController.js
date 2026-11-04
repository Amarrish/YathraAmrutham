const Gallery = require('../models/Gallery');

// @desc    Get all gallery items with optional filters
// @route   GET /api/gallery
// @access  Public
const getAllGalleryItems = async (req, res, next) => {
  try {
    const { mediaType, category, upcomingOnly } = req.query;
    const filter = {};

    if (mediaType && ['photo', 'video'].includes(mediaType)) {
      filter.mediaType = mediaType;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (upcomingOnly === 'true') {
      filter.isUpcomingTourProgram = true;
    }

    const items = await Gallery.find(filter)
      .populate('upcomingProgram.relatedTourId', 'title destination startDate vehicleType pricePerPerson')
      .sort({ isUpcomingTourProgram: -1, order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single gallery item
// @route   GET /api/gallery/:id
// @access  Public
const getGalleryItemById = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id).populate(
      'upcomingProgram.relatedTourId',
      'title destination startDate vehicleType pricePerPerson'
    );
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new gallery item (Photo, Video, or Upcoming Tour Program)
// @route   POST /api/gallery
// @access  Private/Admin
const createGalleryItem = async (req, res, next) => {
  try {
    const {
      title,
      description,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      category,
      isUpcomingTourProgram,
      upcomingProgram,
      order
    } = req.body;

    if (!title || !mediaType || !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, mediaType (photo or video), and mediaUrl'
      });
    }

    const item = await Gallery.create({
      title,
      description: description || '',
      mediaType,
      mediaUrl,
      thumbnailUrl: thumbnailUrl || '',
      category: category || 'General',
      isUpcomingTourProgram: Boolean(isUpcomingTourProgram),
      upcomingProgram: isUpcomingTourProgram ? upcomingProgram : undefined,
      order: Number(order) || 0,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Gallery item created successfully',
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update gallery item
// @route   PUT /api/gallery/:id
// @access  Private/Admin
const updateGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    const updated = await Gallery.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      message: 'Gallery item updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete gallery item
// @route   DELETE /api/gallery/:id
// @access  Private/Admin
const deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Gallery item not found' });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: 'Gallery item removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem
};
