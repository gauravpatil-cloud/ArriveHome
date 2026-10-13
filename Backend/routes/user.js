const express = require('express');
const passport = require('passport');
const User = require('../models/User-model.js');

const router = express.Router();
const publicUser = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    displayName: user.displayName || user.username,
    profilePhoto: user.profilePhoto || null
});
const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

router.get('/me', (req, res) => {
    res.json({ user: req.user ? publicUser(req.user) : null, googleEnabled });
});

router.get('/google', (req, res, next) => {
    if (!googleEnabled) {
        return res.status(503).json({ error: 'Google sign-in is not configured on this server.' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'], state: true })(req, res, next);
});

router.get('/google/callback',
    (req, res, next) => {
        if (!googleEnabled) return res.redirect(`${frontendUrl}/login?googleError=1`);
        next();
    },
    passport.authenticate('google', {
        failureRedirect: `${frontendUrl}/login?googleError=1`
    }),
    (req, res) => res.redirect(`${frontendUrl}/?google=1`)
);

router.post('/signup', async (req, res, next) => {
    const { email, username, password } = req.body;
    if (typeof email !== 'string' || !email.trim() ||
        typeof username !== 'string' || username.trim().length < 3 ||
        typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Enter a valid email, a username of at least 3 characters, and a password of at least 8 characters.' });
    }

    try {
        const user = await User.register(
            new User({ email: email.trim().toLowerCase(), username: username.trim() }),
            password
        );
        req.logIn(user, (err) => {
            if (err) return next(err);
            res.status(201).json({ user: publicUser(user) });
        });
    } catch (err) {
        if (err.name === 'UserExistsError' || err.code === 11000) {
            return res.status(409).json({ error: 'That username or email is already registered.' });
        }
        next(err);
    }
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: 'Incorrect username or password.' });
        req.logIn(user, (loginError) => {
            if (loginError) return next(loginError);
            res.json({ user: publicUser(user) });
        });
    })(req, res, next);
});

router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((sessionError) => {
            if (sessionError) return next(sessionError);
            res.clearCookie('connect.sid');
            res.json({ message: 'Signed out.' });
        });
    });
});

module.exports = router;
