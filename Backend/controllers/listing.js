const Listing = require('../models/listing-model.js');
const Review = require('../models/review-model.js');
const Booking = require('../models/booking-model.js');
const BookingNight = require('../models/booking-night-model.js');
const optionalCoordinate = (value) =>
    value === undefined || value === '' ? undefined : Number(value);

const asPublicListing = (listing, includeExactLocation = false) => {
    const result = listing.toObject ? listing.toObject() : listing;
    if (!includeExactLocation) {
        delete result.mapLocation;
        delete result.latitude;
        delete result.longitude;
    }
    if (result.image?.url && !result.images?.some((image) => image.url === result.image.url)) {
        result.images = [result.image, ...(result.images || [])];
    }
    return result;
};

const validateListing = (body) => {
    const { title, description, location, mapLocation, price } = body;
    if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 100) {
        return 'Title must be between 3 and 100 characters.';
    }
    if (typeof description !== 'string' || !description.trim() || description.length > 5000) {
        return 'Description is required and must be at most 5000 characters.';
    }
    if (typeof location !== 'string' || !location.trim() || location.length > 150) {
        return 'Location is required and must be at most 150 characters.';
    }
    if (typeof mapLocation !== 'string' || !mapLocation.trim() || mapLocation.trim().length > 250) {
        return 'Enter an exact map address of at most 250 characters.';
    }
    const hasLatitude = body.latitude !== undefined && body.latitude !== '';
    const hasLongitude = body.longitude !== undefined && body.longitude !== '';
    if (hasLatitude !== hasLongitude) {
        return 'Select a location pin on the map.';
    }
    if (hasLatitude) {
        const latitude = Number(body.latitude);
        const longitude = Number(body.longitude);
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
            !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
            return 'The selected map location is invalid.';
        }
    }
    if (!Number.isFinite(Number(price)) || Number(price) < 1) {
        return 'Price must be a number greater than zero.';
    }
    return null;
};

module.exports.index = async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = search ? {
        $or: ['title', 'location', 'description'].map((field) => ({
            [field]: new RegExp(escaped, 'i')
        }))
    } : {};
    const listings = await Listing.find(filter).populate('owner', 'username').sort({ _id: -1 });
    res.json({ listings: listings.map(asPublicListing) });
};

module.exports.create = async (req, res) => {
    const validationError = validateListing(req.body);
    if (validationError) return res.status(400).json({ error: validationError });
    if (!req.files?.length) return res.status(400).json({ error: 'Upload at least one property photo.' });

    const listing = await Listing.create({
        title: req.body.title.trim(),
        description: req.body.description.trim(),
        location: req.body.location.trim(),
        mapLocation: req.body.mapLocation.trim(),
        latitude: optionalCoordinate(req.body.latitude),
        longitude: optionalCoordinate(req.body.longitude),
        price: Number(req.body.price),
        images: req.files.map(({ path, filename }) => ({ url: path, filename })),
        owner: req.user._id
    });
    res.status(201).json({ listing: asPublicListing(listing, true) });
};

module.exports.show = async (req, res) => {
    const listing = await Listing.findById(req.params.id)
        .populate('owner', 'username')
        .populate({ path: 'reviews', populate: { path: 'author', select: 'username' } });
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    const ownerId = listing.owner?._id || listing.owner;
    const isOwner = req.user && String(ownerId) === String(req.user._id);
    const hasConfirmedBooking = req.user && !isOwner
        ? await Booking.exists({ listing: listing._id, guest: req.user._id, status: 'confirmed' })
        : false;
    res.json({ listing: asPublicListing(listing, Boolean(isOwner || hasConfirmedBooking)) });
};

module.exports.update = async (req, res) => {
    const validationError = validateListing(req.body);
    if (validationError) return res.status(400).json({ error: validationError });

    const listing = req.listing;
    const existingImageUrls = new Set(listing.images.map(({ url }) => url));
    if (listing.image?.url) existingImageUrls.add(listing.image.url);
    const existingImageCount = existingImageUrls.size;
    if (existingImageCount + (req.files?.length || 0) > 10) {
        return res.status(400).json({ error: 'A listing can have at most 10 photos.' });
    }
    listing.title = req.body.title.trim();
    listing.description = req.body.description.trim();
    listing.location = req.body.location.trim();
    listing.mapLocation = req.body.mapLocation.trim();
    listing.latitude = optionalCoordinate(req.body.latitude);
    listing.longitude = optionalCoordinate(req.body.longitude);
    listing.price = Number(req.body.price);
    if (req.files?.length) {
        listing.images.push(...req.files.map(({ path, filename }) => ({ url: path, filename })));
    }
    await listing.save();
    res.json({ listing: asPublicListing(listing, true) });
};

module.exports.remove = async (req, res) => {
    const activeBooking = await Booking.exists({
        listing: req.listing._id,
        checkOut: { $gt: new Date() },
        $or: [
            { status: 'confirmed' },
            { status: 'pending', expiresAt: { $gt: new Date() } }
        ]
    });
    if (activeBooking) {
        return res.status(409).json({ error: 'This stay has upcoming reservations and cannot be deleted yet.' });
    }
    const bookingIds = await Booking.find({ listing: req.listing._id }).distinct('_id');
    await BookingNight.deleteMany({ booking: { $in: bookingIds } });
    await Booking.deleteMany({ listing: req.listing._id });
    await Review.deleteMany({ _id: { $in: req.listing.reviews } });
    await req.listing.deleteOne();
    res.json({ message: 'Listing deleted.' });
};
