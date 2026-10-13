const express = require('express');
const multer = require('multer');
const { storage } = require('../cloudconfig.js');
const { requireLogin, loadListing, requireOwner } = require('../middlewares.js');
const controller = require('../controllers/listing.js');
const bookingController = require('../controllers/booking.js');

const router = express.Router();
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
    storage,
    limits: { files: 10, fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, done) => {
        if (!imageTypes.has(file.mimetype)) {
            const error = new Error('Upload JPG, PNG, or WebP images only.');
            error.statusCode = 400;
            return done(error);
        }
        done(null, true);
    }
});

router.get('/', controller.index);
router.post('/', requireLogin, upload.array('images', 10), controller.create);
router.get('/:id/availability', bookingController.availability);
router.get('/:id', controller.show);
router.patch('/:id', requireLogin, loadListing, requireOwner, upload.array('images', 10), controller.update);
router.delete('/:id', requireLogin, loadListing, requireOwner, controller.remove);

module.exports = router;
