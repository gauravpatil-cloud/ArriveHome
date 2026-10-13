const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookingSchema = new Schema({
    listing: { type: Schema.Types.ObjectId, ref: 'listing', required: true, index: true },
    guest: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ['INR'], default: 'INR' },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },
    expiresAt: { type: Date, required: true, index: true },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true }
}, { timestamps: true });

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
