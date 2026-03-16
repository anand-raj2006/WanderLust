const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const User = require('../models/user');
const passport = require('passport');
const { saveReturnTo } = require('../middleware');

router.get('/signup', (req, res) => {
    res.render('user/signup.ejs');
});

router.post('/signup', wrapAsync(async (req, res) => {
    const { username, email, password } = req.body;

    const newUser = new User({ username, email });

    try {
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('/signup');
            }
            req.flash('success', 'Welcome to WanderLust!');
            return res.redirect('/listings');
        });
    } catch (err) {
        req.flash('error', err.message);
        return res.redirect('/signup');
    }
}));

router.get('/login', (req, res) => {
    res.render('user/login.ejs');
});

router.post('/login', saveReturnTo, passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/login'
}), wrapAsync(async (req, res) => {
    req.flash('success', 'Welcome back!');
    res.redirect(res.locals.returnTo || '/listings');
}));

router.get('/logout', (req, res) => {
    req.logout(() => {
        req.flash('success', 'Logged out successfully!');
        res.redirect('/listings');
    });
});

module.exports = router;