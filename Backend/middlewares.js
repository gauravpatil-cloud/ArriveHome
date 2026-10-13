const Listing = require('./models/listing-model.js');
const Review = require('./models/review-model.js');

module.exports.requireLogin = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Sign in to continue.' });
    }
    next();
};

module.exports.loadListing = async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    req.listing = listing;
    next();
};

module.exports.requireOwner = (req, res, next) => {
    if (!req.listing.owner.equals(req.user._id)) {
        return res.status(403).json({ error: 'Only the host can change this listing.' });
    }
    next();
};

module.exports.requireReviewAuthor = async (req, res, next) => {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found.' });
    if (!review.author.equals(req.user._id)) {
        return res.status(403).json({ error: 'You can only delete your own reviews.' });
    }
    req.review = review;
    next();
};
