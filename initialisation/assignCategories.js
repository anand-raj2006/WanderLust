const mongoose = require('mongoose');
const Listing = require('../models/listing');

const MONGO_URL = 'mongodb://127.0.0.1:27017/wanderlust';

const CATEGORIES = [
    'Trending', 'Rooms', 'Iconic cities', 'Mountains',
    'Castles', 'Amazing pools', 'Camping', 'Farms', 'Arctic'
];

async function assignCategories() {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    const listings = await Listing.find({});
    console.log(`Found ${listings.length} listings`);

    // Shuffle categories array repeatedly so distribution is roughly even
    for (let i = 0; i < listings.length; i++) {
        const category = CATEGORIES[i % CATEGORIES.length];
        await Listing.findByIdAndUpdate(listings[i]._id, { category });
    }

    console.log('Categories assigned successfully!');
    await mongoose.disconnect();
}

assignCategories().catch(console.error);
