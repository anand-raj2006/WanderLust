if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const Listing = require('./models/listing');
const Review = require('./models/review');
const path = require('path');
const wrapAsync = require('./utils/wrapAsync');
const ExpressError = require('./utils/ExpreessError');
const { listingSchema, reviewSchema } = require('./schema');
const methodoverride = require('method-override');
const ejsmate = require('ejs-mate');
app.engine('ejs', ejsmate);
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


app.use(methodoverride('_method'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const mongoose = require('mongoose');
const atlasUri = process.env.ATLAS_URI;

async function connectDB() {
    if (!atlasUri) {
        throw new Error('ATLAS_URI is not defined in environment variables');
    }

    await mongoose.connect(atlasUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB Atlas');
}

const store = MongoStore.create({
    mongoUrl: atlasUri,
    secret: process.env.SECRET_KEY,
    touchAfter: 24 * 3600 // time period in seconds
});

store.on("error", function (e) {
    console.log("Session store error", e);
});

const sessionConfig = {
    store: store,
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.get('/', (req, res) => {
    res.redirect('/listings');
});

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/fakeUser', async (req, res) => {
    const user = new User({ email: 'test@example.com' });
    const registeredUser = await User.register(user, 'password');
    res.send('Created user: ' + registeredUser.username);
});


app.use(async (req, res, next) => {
    try {
        res.locals.allCountries = await Listing.distinct('country');
    } catch (e) {
        res.locals.allCountries = [];
    }
    next();
});

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next();
});

const listingRoutes = require('./routes/listing');
app.use("/listings", listingRoutes);
const reviewRoutes = require('./routes/reviews');
app.use("/listings/:id/reviews", reviewRoutes);
const userRoutes = require('./routes/user');
app.use("/", userRoutes);

app.all('/{*any}', wrapAsync(async (req, res, next) => {
    next(new ExpressError('Page Not Found!', 404));
}));

app.use((err, req, res, next) => {
    let { statusCode = 500, message = 'Something went wrong!' } = err;
    res.render('error.ejs', { err, statusCode, message });
    // res.status(statusCode).send(message);
});

connectDB().then(() => {
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}).catch((err) => {
    console.error('Error connecting to MongoDB', err);
});
