const joi = require('joi');
const listingSchema = joi.object({
    listing: joi.object({
        title: joi.string().required(),
        price: joi.number().required().min(0),
        description: joi.string().required(),
        image: joi.alternatives().try(
            joi.object({
                url: joi.string().uri().allow('')
            }),
            joi.string().allow('')
        ).optional(),
        location: joi.string().required(),
        country: joi.string().required(),
        category: joi.string().valid('Trending', 'Rooms', 'Iconic cities', 'Mountains', 'Castles', 'Amazing pools', 'Camping', 'Farms', 'Arctic').optional(),
    }).required()
});
const reviewSchema = joi.object({
    review: joi.object({
        comment: joi.string().required(),
        rating: joi.number().required().min(1).max(5)
    }).required()
});
module.exports.listingSchema = listingSchema;
module.exports.reviewSchema = reviewSchema;
