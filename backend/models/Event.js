import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required."],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Event description is required."],
      trim: true,
    },

    location: {
      type: String,
      required: [true, "Location is required."],
      enum: {
        values: ["Kandy", "Anuradhapura"],
        message: "Location must be either Kandy or Anuradhapura.",
      },
    },

    category: {
      type: String,
      required: [true, "Category is required."],
      trim: true,
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required."],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required."],
    },

    estimatedCost: {
      type: Number,
      min: [0, "Estimated cost cannot be negative."],
      default: 0,
    },

    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Event", eventSchema);
