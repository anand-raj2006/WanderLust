const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing');
const mongo_url = 'mongodb://127.0.0.1:27017/wanderlust';
async function connectDB() {
    await mongoose.connect(mongo_url, {});
}
connectDB().then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB', err);
});

const initDb = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({ ...obj, owner: '69b5c295511' }));
    await Listing.insertMany(initData.data);
}
initDb();
