const mongoose = require('mongoose');
const { Schema } = mongoose;

const imageSchema = new Schema({
    url: { type: String, required: true },
    filename: { type: String, default: '' }
}, { _id: false });

const listingSchema = new Schema({
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    images: { type: [imageSchema], default: [] },
    image: {
        url: String,
        filename: String
    },
    price: { type: Number, required: true, min: 1 },
    location: { type: String, required: true, trim: true, maxlength: 150 },
    mapLocation: { type: String, trim: true, maxlength: 250 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'review' }],
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.models.listing || mongoose.model('listing', listingSchema);
