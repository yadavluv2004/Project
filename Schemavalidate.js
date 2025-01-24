const Joi = require("joi");

const listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        price: Joi.number().required().min(0),
        description: Joi.string().required(),
        location: Joi.string().required(),
        image: Joi.object({
            url: Joi.string().uri().allow("").optional(), // Optional URL field
            filename: Joi.string().allow("").optional(),  // Optional filename field
        }).optional(),
        country: Joi.string().allow("").optional(),
    }).required(),
});

module.exports = { listingSchema };


