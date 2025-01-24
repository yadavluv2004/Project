const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const wrapAsync = require("./utils/wrapAsync.js");
const Expresserror = require("./utils/Expresserror.js");
const { listingSchema } = require("./Schemavalidate.js");

// Middleware Setup
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// View Engine Setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Database Connection
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderLust";

async function main() {
    await mongoose.connect(MONGO_URL);
}

main()
    .then(() => {
        console.log("Connected to the database.");
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });

// Validation Middleware
const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        throw new Expresserror(400, error.details.map((e) => e.message).join(", "));
    } else {
        next();
    }
};

// Routes
// Root Route
app.get("/", (req, res) => {
    res.send("Hi, I am the root route.");
});

// Index Route
app.get(
    "/listings",
    wrapAsync(async (req, res) => {
        const alllisting = await Listing.find({});
        res.render("./listings/index.ejs", { alllisting });
    })
);

// New Listing Form Route
app.get("/listings/new", (req, res) => {
    res.render("./listings/new.ejs");
});

// Show Route
app.get(
    "/listings/:id",
    wrapAsync(async (req, res, next) => {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            throw new Expresserror(404, "Listing not found");
        }
        res.render("./listings/show.ejs", { listing });
    })
);

// Create Route
app.post(
    "/listings",
    validateListing,
    wrapAsync(async (req, res) => {
        const newListing = new Listing({
            ...req.body.listing,
            image: req.body.listing.image
                ? { url: req.body.listing.image, filename: "listingimage" }
                : null,
        });
        await newListing.save();
        res.redirect("/listings");
    })
);

// Edit Listing Form Route
app.get(
    "/listings/:id/edit",
    wrapAsync(async (req, res, next) => {
        const { id } = req.params;
        const editlisting = await Listing.findById(id);
        if (!editlisting) {
            throw new Expresserror(404, "Listing not found");
        }
        res.render("./listings/edit.ejs", { editlisting });
    })
);

// Update Route
app.put(
    "/listings/:id",
    validateListing,
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        if (req.body.listing.image) {
            req.body.listing.image = {
                url: req.body.listing.image,
                filename: "listingimage",
            };
        }
        const updatedListing = await Listing.findByIdAndUpdate(id, {
            ...req.body.listing,
        });
        if (!updatedListing) {
            throw new Expresserror(404, "Listing not found");
        }
        res.redirect(`/listings/${id}`);
    })
);

// Delete Route
app.delete(
    "/listings/:id",
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        const deletedListing = await Listing.findByIdAndDelete(id);
        if (!deletedListing) {
            throw new Expresserror(404, "Listing not found");
        }
        res.redirect("/listings");
    })
);

// Catch-All Route
app.get("*", (req, res, next) => {
    next(new Expresserror(404, "Page not found"));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    console.error(err.stack); // Log stack trace for debugging
    res.status(statusCode).render("error.ejs", { statusCode, message });
});

// Start Server
app.listen(8080, () => {
    console.log("Listening on port 8080.");
});



