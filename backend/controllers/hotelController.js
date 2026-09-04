import Hotel from "../models/Hotel.js";

/**
 * CREATE HOTEL
 * POST /api/hotels
 */
export const createHotel = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      pricePerNight,
      rating,
      address,
      imageUrl,
    } = req.body;

    // Required field validation
    if (!name || !description || !location || pricePerNight === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "Name, description, location, and price per night are required.",
      });
    }

    // Validate location
    if (!["Kandy", "Anuradhapura"].includes(location)) {
      return res.status(400).json({
        success: false,
        message: "Location must be Kandy or Anuradhapura.",
      });
    }

    // Validate price
    if (Number(pricePerNight) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price per night cannot be negative.",
      });
    }

    // Validate rating if provided
    if (
      rating !== undefined &&
      rating !== null &&
      (Number(rating) < 0 || Number(rating) > 5)
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 0 and 5.",
      });
    }

    const hotel = await Hotel.create({
      name,
      description,
      location,
      pricePerNight: Number(pricePerNight),
      rating: rating !== undefined && rating !== "" ? Number(rating) : undefined,
      address,
      imageUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Hotel created successfully.",
      data: hotel,
    });
  } catch (error) {
    console.error("Create hotel error:", error);

    // Mongoose validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create hotel.",
      error: error.message,
    });
  }
};

/**
 * GET ALL HOTELS
 * GET /api/hotels
 *
 * Optional query parameters:
 * ?location=Kandy
 * ?search=Queen
 * ?minPrice=5000
 * ?maxPrice=20000
 */
export const getHotels = async (req, res) => {
  try {
    const { location, search, minPrice, maxPrice } = req.query;

    const filter = {};

    // Filter by location
    if (location) {
      if (!["Kandy", "Anuradhapura"].includes(location)) {
        return res.status(400).json({
          success: false,
          message: "Location must be Kandy or Anuradhapura.",
        });
      }

      filter.location = location;
    }

    // Search by hotel name
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    // Price filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.pricePerNight = {};

      if (minPrice !== undefined) {
        const minimum = Number(minPrice);

        if (Number.isNaN(minimum)) {
          return res.status(400).json({
            success: false,
            message: "Minimum price must be a valid number.",
          });
        }

        filter.pricePerNight.$gte = minimum;
      }

      if (maxPrice !== undefined) {
        const maximum = Number(maxPrice);

        if (Number.isNaN(maximum)) {
          return res.status(400).json({
            success: false,
            message: "Maximum price must be a valid number.",
          });
        }

        filter.pricePerNight.$lte = maximum;
      }
    }

    const hotels = await Hotel.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels,
    });
  } catch (error) {
    console.error("Get hotels error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hotels.",
      error: error.message,
    });
  }
};

/**
 * GET SINGLE HOTEL
 * GET /api/hotels/:id
 */
export const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error("Get hotel error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hotel.",
      error: error.message,
    });
  }
};

/**
 * UPDATE HOTEL
 * PUT /api/hotels/:id
 */
export const updateHotel = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      pricePerNight,
      rating,
      address,
      imageUrl,
    } = req.body;

    // Validate location if provided
    if (
      location !== undefined &&
      !["Kandy", "Anuradhapura"].includes(location)
    ) {
      return res.status(400).json({
        success: false,
        message: "Location must be Kandy or Anuradhapura.",
      });
    }

    // Validate price if provided
    if (
      pricePerNight !== undefined &&
      (Number.isNaN(Number(pricePerNight)) || Number(pricePerNight) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Price per night must be a valid positive number.",
      });
    }

    // Validate rating if provided
    if (
      rating !== undefined &&
      rating !== null &&
      rating !== "" &&
      (Number.isNaN(Number(rating)) ||
        Number(rating) < 0 ||
        Number(rating) > 5)
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 0 and 5.",
      });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;

    if (pricePerNight !== undefined) {
      updateData.pricePerNight = Number(pricePerNight);
    }

    if (rating !== undefined) {
      updateData.rating =
        rating === "" || rating === null ? undefined : Number(rating);
    }

    if (address !== undefined) updateData.address = address;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully.",
      data: hotel,
    });
  } catch (error) {
    console.error("Update hotel error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update hotel.",
      error: error.message,
    });
  }
};

/**
 * DELETE HOTEL
 * DELETE /api/hotels/:id
 */
export const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hotel deleted successfully.",
    });
  } catch (error) {
    console.error("Delete hotel error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid hotel ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete hotel.",
      error: error.message,
    });
  }
};