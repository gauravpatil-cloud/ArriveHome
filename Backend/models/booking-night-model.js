const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingNightSchema = new Schema({
    _id: { type: String, required: true },
    listing: { type: Schema.Types.ObjectId, ref: 'listing', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    date: { type: Date, required: true }
});

module.exports = mongoose.models.BookingNight ||
    mongoose.model('BookingNight', bookingNightSchema);
