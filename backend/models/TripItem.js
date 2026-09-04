const mongoose = require("mongoose");

const tripItemSchema = new mongoose.Schema(
  {
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["place", "event", "hotel"],
    },

    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    note: {
      type: String,
      trim: true,
    },

    quantity: {
      type: Number,
      min: 1,
      default: 1,
    },

    estimatedCost: {
      type: Number,
      required: true,
      min: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    updatedAt: false,
  }
);

module.exports = mongoose.model("TripItem", tripItemSchema);
