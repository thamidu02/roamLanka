import Place from "../models/Place.js";

// GET /api/places
export const getPlaces = async (req, res) => {
  try {
    const places = await Place.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: places.length,
      data: places,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch places.",
      error: error.message,
    });
  }
};

// POST /api/places
export const createPlace = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      category,
      estimatedCost,
      estimatedDuration,
      imageUrl,
      address,
    } = req.body;

    if (
      !name ||
      !description ||
      !location ||
      !category ||
      estimatedCost === undefined ||
      estimatedDuration === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required place fields.",
      });
    }

    const place = await Place.create({
      name,
      description,
      location,
      category,
      estimatedCost,
      estimatedDuration,
      imageUrl,
      address,
    });

    res.status(201).json({
      success: true,
      message: "Place created successfully.",
      data: place,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to create place.",
      error: error.message,
    });
  }
};

// PUT /api/places/:id
export const updatePlace = async (req, res) => {
  try {
    const place = await Place.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Place not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Place updated successfully.",
      data: place,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update place.",
      error: error.message,
    });
  }
};

// DELETE /api/places/:id
export const deletePlace = async (req, res) => {
  try {
    const place = await Place.findByIdAndDelete(req.params.id);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Place not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Place deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete place.",
      error: error.message,
    });
  }
};