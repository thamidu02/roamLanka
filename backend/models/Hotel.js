import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hotel name is required"],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Hotel description is required"],
      trim: true,
    },

    location: {
      type: String,
      required: [true, "Hotel location is required"],
      enum: {
        values: ["Kandy", "Anuradhapura"],
        message: "Location must be Kandy or Anuradhapura",
      },
      trim: true,
    },

    pricePerNight: {
      type: Number,
      required: [true, "Price per night is required"],
      min: [0, "Price cannot be negative"],
    },

    rating: {
      type: Number,
      min: [0, "Rating cannot be less than 0"],
      max: [5, "Rating cannot be greater than 5"],
    },

    address: {
      type: String,
      trim: true,
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

const Hotel = mongoose.model("Hotel", hotelSchema);

export default Hotel;