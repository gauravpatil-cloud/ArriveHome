const Review = require('../models/review-model.js');

module.exports.create = async (req, res) => {
    const stars = Number(req.body.stars);
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!Number.isInteger(stars) || stars < 1 || stars > 5 || !message || message.length > 2000) {
        return res.status(400).json({ error: 'Choose a 1-5 star rating and enter a review of at most 2000 characters.' });
    }

    const review = await Review.create({ stars, message, author: req.user._id });
    await req.listing.updateOne({ $push: { reviews: review._id } });
    await review.populate('author', 'username');
    res.status(201).json({ review });
};

module.exports.remove = async (req, res) => {
    await req.review.deleteOne();
    await req.listing.updateOne({ $pull: { reviews: req.review._id } });
    res.json({ message: 'Review deleted.' });
};
