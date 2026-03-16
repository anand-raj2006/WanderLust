const Listing = require('./models/listing');
const Review = require('./models/review');
const { listingSchema, reviewSchema } = require('./schema');
const ExpressError = require('./utils/ExpreessError');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // For non-GET requests (e.g. POST review), redirect back to the page URL after login.
        const returnTo = req.method === 'GET' ? req.originalUrl : req.get('Referer');
        if (returnTo && !returnTo.includes('/login')) {
            req.session.returnTo = returnTo;
        }
        req.flash('error', 'You must be logged in first!');
        return res.redirect('/login');
    }
    next();
};


module.exports.saveReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
        delete req.session.returnTo;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    const { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }
    if (!req.user || !listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash('error', 'You are not the owner of this listing!');
        return res.redirect('/listings/' + id);
    }
    next();
};

module.exports.validateListing = (req, res, next) => {//Validation middleware for listing
    let result = listingSchema.validate(req.body);
    if (result.error) {
        let msg = result.error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
};

module.exports.validateReview = (req, res, next) => {//Validation middleware for review
    let result = reviewSchema.validate(req.body);
    if (result.error) {
        let msg = result.error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
        req.flash('error', 'Review not found!');
        return res.redirect('/listings/' + id);
    }
    if (!req.user || !review.author || !review.author.equals(req.user._id)) {
        req.flash('error', 'You are not the author of this review!');
        return res.redirect('/listings/' + id);
    }
    next();
};