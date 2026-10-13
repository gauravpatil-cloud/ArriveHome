const { createHmac, timingSafeEqual } = require('crypto');
const Booking = require('../models/booking-model.js');
const BookingNight = require('../models/booking-night-model.js');
const Listing = require('../models/listing-model.js');

const DAY_MS = 24 * 60 * 60 * 1000;
const HOLD_MS = 15 * 60 * 1000;

const parseDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
};

const overlapQuery = (checkIn, checkOut) => ({
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
    $or: [
        { status: 'confirmed' },
        { status: 'pending', expiresAt: { $gt: new Date() } }
    ]
});

const parseStay = (req, res) => {
    const checkIn = parseDate(req.body.checkIn);
    const checkOut = parseDate(req.body.checkOut);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (!checkIn || !checkOut || checkIn < today || checkOut <= checkIn) {
        res.status(400).json({ error: 'Choose valid check-in and check-out dates. Check-out must be after check-in.' });
        return null;
    }
    return { checkIn, checkOut, nights: (checkOut - checkIn) / DAY_MS };
};

module.exports.availability = async (req, res) => {
    const listing = await Listing.findById(req.params.id).select('_id');
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    const bookings = await Booking.find({
        listing: listing._id,
        checkOut: { $gt: new Date() },
        $or: [
            { status: 'confirmed' },
            { status: 'pending', expiresAt: { $gt: new Date() } }
        ]
    }).select('checkIn checkOut');
    res.json({
        blockedDates: bookings.map(({ checkIn, checkOut }) => ({
            checkIn: checkIn.toISOString().slice(0, 10),
            checkOut: checkOut.toISOString().slice(0, 10)
        }))
    });
};

module.exports.createOrder = async (req, res) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        return res.status(503).json({ error: 'Online payments are not configured. Add Razorpay keys to a Backend env file.' });
    }

    const stay = parseStay(req, res);
    if (!stay) return;
    const listing = await Listing.findById(req.body.listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.owner.equals(req.user._id)) {
        return res.status(400).json({ error: 'You cannot book your own listing.' });
    }
    const now = new Date();
    const expiredBookings = await Booking.find({
        listing: listing._id,
        status: 'pending',
        expiresAt: { $lte: now }
    }).select('_id');
    if (expiredBookings.length) {
        const expiredIds = expiredBookings.map(({ _id }) => _id);
        await BookingNight.deleteMany({ booking: { $in: expiredIds } });
        await Booking.updateMany({ _id: { $in: expiredIds } }, { status: 'cancelled' });
    }
    if (await Booking.exists({ listing: listing._id, ...overlapQuery(stay.checkIn, stay.checkOut) })) {
        return res.status(409).json({ error: 'Those dates are no longer available. Please choose different dates.' });
    }

    const subtotal = Math.round(listing.price * stay.nights * 100);
    const tax = Math.round(subtotal * 0.18);
    const totalPaise = subtotal + tax;
    const holdUntil = new Date(Date.now() + HOLD_MS);
    const booking = await Booking.create({
        listing: listing._id,
        guest: req.user._id,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        nights: stay.nights,
        amount: totalPaise / 100,
        expiresAt: holdUntil
    });

    try {
        const reservationNights = Array.from({ length: stay.nights }, (_, index) => {
            const date = new Date(stay.checkIn.getTime() + index * DAY_MS);
            const dateKey = date.toISOString().slice(0, 10);
            return {
                _id: `${listing._id}:${dateKey}`,
                listing: listing._id,
                booking: booking._id,
                date
            };
        });
        await BookingNight.insertMany(reservationNights);
    } catch (error) {
        await BookingNight.deleteMany({ booking: booking._id });
        await booking.deleteOne();
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Those dates were just reserved. Please choose different dates.' });
        }
        throw error;
    }

    try {
        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: totalPaise,
                currency: 'INR',
                receipt: booking._id.toString(),
                notes: { listingId: listing._id.toString(), guestId: req.user._id.toString() }
            })
        });
        const order = await response.json();
        if (!response.ok) {
            const providerMessage = order.error?.description;
            const error = new Error(providerMessage || 'Razorpay could not create a payment order.');
            error.statusCode = response.status >= 400 && response.status < 500 ? 400 : 502;
            error.providerMessage = providerMessage;
            throw error;
        }

        booking.razorpayOrderId = order.id;
        await booking.save();
        res.status(201).json({
            bookingId: booking._id,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId
        });
    } catch (error) {
        await BookingNight.deleteMany({ booking: booking._id });
        await booking.deleteOne();
        throw error;
    }
};

module.exports.verifyPayment = async (req, res) => {
    const { bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (![bookingId, orderId, paymentId, signature].every((value) => typeof value === 'string' && value)) {
        return res.status(400).json({ error: 'Payment verification details are incomplete.' });
    }

    const booking = await Booking.findOne({ _id: bookingId, guest: req.user._id });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.razorpayOrderId !== orderId) {
        return res.status(400).json({ error: 'Payment order does not match this booking.' });
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: 'Payment verification is not configured. Contact the host before retrying.' });
    }
    if (booking.status === 'confirmed') return res.json({ bookingId: booking._id, status: booking.status });
    if (booking.status !== 'pending' || booking.expiresAt <= new Date()) {
        booking.status = 'cancelled';
        await booking.save();
        await BookingNight.deleteMany({ booking: booking._id });
        return res.status(410).json({ error: 'This payment session has expired. Start a new booking.' });
    }

    const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest();
    const received = /^[\da-f]{64}$/i.test(signature) ? Buffer.from(signature, 'hex') : Buffer.alloc(0);
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
        return res.status(400).json({ error: 'Payment signature could not be verified.' });
    }

    booking.status = 'confirmed';
    booking.razorpayPaymentId = paymentId;
    await booking.save();
    res.json({ bookingId: booking._id, status: booking.status });
};

module.exports.mine = async (req, res) => {
    const bookings = await Booking.find({ guest: req.user._id, status: 'confirmed' })
        .populate('listing', 'title location price images image')
        .sort({ createdAt: -1 });
    res.json({ bookings });
};
