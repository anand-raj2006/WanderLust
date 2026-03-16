const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpreessError');
const { listingSchema, reviewSchema } = require('../schema');
const Listing = require('../models/listing');
const { isLoggedIn, isOwner, validateListing } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudconfig.js');
const upload = multer({ storage: storage });

// Geocode a location string using the free Nominatim API (no API key required)
async function geocode(location, country) {
    try {
        const query = [location, country].filter(Boolean).join(', ');
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'WanderLust/1.0 (wanderlust-app)' }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
    } catch (err) {
        console.error('Geocoding failed:', err.message);
    }
    return null;
}

//index route to display all listings
router.get('/', wrapAsync(async (req, res) => {
    const { category, search, country } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (country) filter.country = country;
    if (search) filter.location = { $regex: search.trim(), $options: 'i' };
    const allListings = await Listing.find(filter);
    res.render('listings/index.ejs', {
        listings: allListings,
        activeCategory: category || null,
        searchQuery: search || '',
        selectedCountry: country || '',
    });
}));

//Create route to add a new listing
router.get('/new', isLoggedIn, (req, res) => {

    res.render('listings/new.ejs');
});
router.post('/', isLoggedIn, upload.single('listing[image]'), validateListing, wrapAsync(async (req, res, next) => {
    const { image, ...listingData } = req.body.listing || {};
    const newListing = new Listing(listingData);
    if (req.file) {
        const imageUrl = req.file.path || req.file.secure_url || req.file.url;
        if (imageUrl) {
            newListing.image = {
                url: imageUrl,
                filename: req.file.filename || req.file.public_id || 'listingimage'
            };
        }
    }
    newListing.owner = req.user._id;
    const geo = await geocode(newListing.location, newListing.country);
    if (geo) newListing.geometry = geo;
    await newListing.save();
    req.flash('success', 'New listing created!');
    res.redirect('/listings');
}));

//Edit route
router.get('/:id/edit', isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }
    res.render('listings/edit.ejs', { listing });
}));

//Update route
router.put('/:id', isLoggedIn, isOwner, upload.single('listing[image]'), validateListing, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const { image, ...listingData } = req.body.listing || {};
    const updateData = { ...listingData };
    if (req.file) {
        const imageUrl = req.file.path || req.file.secure_url || req.file.url;
        if (imageUrl) {
            updateData.image = {
                url: imageUrl,
                filename: req.file.filename || req.file.public_id || 'listingimage'
            };
        }
    }
    const geo = await geocode(updateData.location, updateData.country);
    if (geo) updateData.geometry = geo;
    await Listing.findByIdAndUpdate(id, updateData, { runValidators: true });

    req.flash('success', 'Listing updated!');
    res.redirect(`/listings/${id}`);
}));

//show route to display a single listing
router.get('/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    })
        .populate('owner', 'username');
    if (!listing) {
        req.flash('error', 'Listing not found!');
        return res.redirect('/listings');
    }
    res.render('listings/show.ejs', { listing });
}));

//Delete route
router.delete('/:id', isLoggedIn, isOwner, wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Listing deleted!');
    res.redirect('/listings');
}));

module.exports = router;