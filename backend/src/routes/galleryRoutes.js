const express = require('express');
const router = express.Router();
const {
  getAllGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem
} = require('../controllers/galleryController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/', getAllGalleryItems);
router.get('/:id', getGalleryItemById);

// Admin protected
router.post('/', protect, adminOnly, createGalleryItem);
router.put('/:id', protect, adminOnly, updateGalleryItem);
router.delete('/:id', protect, adminOnly, deleteGalleryItem);

module.exports = router;
