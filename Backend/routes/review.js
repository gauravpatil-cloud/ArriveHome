const express = require('express');
const { requireLogin, loadListing, requireReviewAuthor } = require('../middlewares.js');
const controller = require('../controllers/review.js');

const router = express.Router({ mergeParams: true });

router.post('/', requireLogin, loadListing, controller.create);
router.delete('/:reviewId', requireLogin, loadListing, requireReviewAuthor, controller.remove);

module.exports = router;
