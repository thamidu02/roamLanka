const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      enum: ["Kandy", "Anuradhapura"],
    },

    category: {
      type: String,
      required: true,
      enum: [
        "History",
        "Culture",
        "Nature",
        "Religious",
        "Adventure",
      ],
    },

    estimatedCost: {
      type: Number,
      required: true,
      min: 0,
    },

    estimatedDuration: {
      type: Number,
      required: true,
      min: 0,
    },

    imageUrl: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Place", placeSchema);
