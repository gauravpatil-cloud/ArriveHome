const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    stars: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, maxlength: 2000 }
});

module.exports = mongoose.models.review || mongoose.model('review', reviewSchema);
