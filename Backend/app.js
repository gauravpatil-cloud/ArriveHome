const path = require('path');
require('dotenv').config({
    path: [path.resolve(__dirname, '.env.local'), path.resolve(__dirname, '.env')]
});

const { randomBytes } = require('crypto');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

const User = require('./models/User-model.js');
const listingRoutes = require('./routes/listing.js');
const reviewRoutes = require('./routes/review.js');
const userRoutes = require('./routes/user.js');
const bookingRoutes = require('./routes/booking.js');

const app = express();
const port = Number(process.env.PORT) || 3000;
const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL ||
    process.env.LOCAL_DB || process.env.ATLASDB_URL;
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
const defaultOrigins = [frontendUrl];
if (process.env.NODE_ENV !== 'production') {
    defaultOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}
const allowedOrigins = new Set(
    (process.env.CORS_ORIGINS || defaultOrigins.join(','))
        .split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean)
);
const configuredSessionSecret = process.env.SESSION_SECRET || process.env.SECRET;
const sessionSecret = configuredSessionSecret ||
    (process.env.NODE_ENV === 'production' ? null : randomBytes(32).toString('hex'));

if (!mongoUrl) {
    throw new Error('Set a MongoDB connection variable in Backend/.env or Backend/.env.local.');
}
if (!sessionSecret) {
    throw new Error('Set SESSION_SECRET or SECRET in Backend/.env or Backend/.env.local.');
}
if (!configuredSessionSecret) {
    console.warn('No session secret configured; using a temporary development-only session secret.');
}

app.disable('x-powered-by');
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin.replace(/\/+$/, ''))) {
            return callback(null, true);
        }
        const error = new Error('This frontend origin is not allowed to access the API.');
        error.statusCode = 403;
        callback(error);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: process.env.COOKIE_SAME_SITE || 'lax',
        secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SAME_SITE === 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL ||
            `http://localhost:${port}/api/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const emailProfile = profile.emails?.find(({ value }) => value);
            if (!emailProfile || profile._json?.email_verified !== true) {
                return done(new Error('Google did not provide a verified email address.'));
            }

            const email = emailProfile.value.toLowerCase();
            const displayName = profile.displayName?.trim() ||
                [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ');
            const profilePhoto = profile.photos?.[0]?.value;
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                user = await User.findOne({ email: new RegExp(`^${escapedEmail}$`, 'i') });
                if (user?.googleId && user.googleId !== profile.id) {
                    return done(new Error('This account is linked to a different Google profile.'));
                }
                if (!user) {
                    user = new User({
                        username: `google-${profile.id}`,
                        email,
                        googleId: profile.id,
                        displayName,
                        profilePhoto
                    });
                } else {
                    user.googleId = profile.id;
                }
            }
            if (displayName) user.displayName = displayName;
            if (profilePhoto) user.profilePhoto = profilePhoto;
            await user.save();

            done(null, user);
        } catch (error) {
            done(error);
        }
    }));
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/listings', listingRoutes);
app.use('/api/listings/:id/reviews', reviewRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/bookings', bookingRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const invalidDocumentInput =
        err.name === 'CastError' ||
        err instanceof mongoose.Error.ValidationError;
    const status = err instanceof multer.MulterError || invalidDocumentInput
        ? 400
        : (err.statusCode || err.status || 500);
    if (status >= 500) console.error(err);
    res.status(status).json({
        error: process.env.NODE_ENV !== 'production' && err.providerMessage
            ? err.providerMessage
            : status >= 500 ? 'Something went wrong. Please try again.' : err.message
    });
});

mongoose.connect(mongoUrl)
    .then(() => {
        console.log('Database connected');
        app.listen(port, () => console.log(`API listening on port ${port}`));
    })
    .catch((err) => {
        console.error('Database connection failed:', err);
        process.exitCode = 1;
    });
