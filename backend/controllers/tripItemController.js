import mongoose from "mongoose";
import TripItem from "../models/TripItem.js";
import Trip from "../models/Trip.js";

import Place from "../models/Place.js";
import Hotel from "../models/Hotel.js";
import Event from "../models/Event.js";

/*
|--------------------------------------------------------------------------
| Helper: Check whether trip belongs to user
|--------------------------------------------------------------------------
*/

const checkTripOwnership = async (tripId, userId) => {
  const trip = await Trip.findById(tripId);

  if (!trip) {
    return {
      exists: false,
      authorized: false,
      trip: null,
    };
  }

  return {
    exists: true,
    authorized: Boolean(userId) && trip.userId.toString() === userId.toString(),
    trip,
  };
};

/*
|--------------------------------------------------------------------------
| Helper: Check item exists
|--------------------------------------------------------------------------
*/

const checkItemExists = async (type, itemId) => {
  switch (type) {
    case "place":
      return await Place.findById(itemId);

    case "hotel":
      return await Hotel.findById(itemId);

    case "event":
      return await Event.findById(itemId);

    default:
      return null;
  }
};

/*
|--------------------------------------------------------------------------
| CREATE TRIP ITEM
| POST /api/trip-items
|--------------------------------------------------------------------------
*/

export const createTripItem = async (req, res) => {
  try {
    const {
      tripId,
      type,
      itemId,
      note,
      quantity,
      estimatedCost,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Required fields
    |--------------------------------------------------------------------------
    */

    if (!tripId || !type || !itemId || estimatedCost === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "tripId, type, itemId, and estimatedCost are required.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate IDs
    |--------------------------------------------------------------------------
    */

    if (
      !mongoose.Types.ObjectId.isValid(tripId) ||
      !mongoose.Types.ObjectId.isValid(itemId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip ID or item ID.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate type
    |--------------------------------------------------------------------------
    */

    if (!["place", "event", "hotel"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be place, event, or hotel.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate estimated cost
    |--------------------------------------------------------------------------
    */

    if (Number.isNaN(Number(estimatedCost)) || Number(estimatedCost) < 0) {
      return res.status(400).json({
        success: false,
        message: "Estimated cost must be a valid number greater than or equal to 0.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate quantity
    |--------------------------------------------------------------------------
    */

    const finalQuantity =
      quantity === undefined ? 1 : Number(quantity);

    if (
      Number.isNaN(finalQuantity) ||
      finalQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check trip
    |--------------------------------------------------------------------------
    */

    const ownership = await checkTripOwnership(
      tripId,
      req.user?.userId || req.user?.id || req.user?._id
    );

    if (!ownership.exists) {
      return res.status(404).json({
        success: false,
        message: "Trip not found.",
      });
    }

    if (!ownership.authorized) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to modify this trip.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check referenced item
    |--------------------------------------------------------------------------
    */

    const item = await checkItemExists(type, itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${type} not found.`,
      });
    }

    const existingTripItem = await TripItem.findOne({ tripId, type, itemId });
    if (existingTripItem) {
      return res.status(409).json({
        success: false,
        message: "This item is already in your trip.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create Trip Item
    |--------------------------------------------------------------------------
    */

    const tripItem = await TripItem.create({
      tripId,
      type,
      itemId,
      note,
      quantity: finalQuantity,
      estimatedCost: Number(estimatedCost),
    });

    return res.status(201).json({
      success: true,
      message: "Trip item added successfully.",
      data: tripItem,
    });
  } catch (error) {
    console.error("Create trip item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add trip item.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET TRIP ITEMS
| GET /api/trip-items/trip/:tripId
|--------------------------------------------------------------------------
*/

export const getTripItems = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip ID.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check trip ownership
    |--------------------------------------------------------------------------
    */

    const ownership = await checkTripOwnership(
      tripId,
      req.user?.userId || req.user?.id || req.user?._id
    );

    if (!ownership.exists) {
      return res.status(404).json({
        success: false,
        message: "Trip not found.",
      });
    }

    if (!ownership.authorized) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this trip.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Get items
    |--------------------------------------------------------------------------
    */

    const tripItems = await TripItem.find({
      tripId,
    }).sort({
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      count: tripItems.length,
      data: tripItems,
    });
  } catch (error) {
    console.error("Get trip items error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trip items.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE TRIP ITEM
| GET /api/trip-items/:id
|--------------------------------------------------------------------------
*/

export const getTripItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip item ID.",
      });
    }

    const tripItem = await TripItem.findById(id);

    if (!tripItem) {
      return res.status(404).json({
        success: false,
        message: "Trip item not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check trip ownership
    |--------------------------------------------------------------------------
    */

    const ownership = await checkTripOwnership(
      tripItem.tripId,
      req.user?.userId || req.user?.id || req.user?._id
    );

    if (!ownership.exists) {
      return res.status(404).json({
        success: false,
        message: "Trip not found.",
      });
    }

    if (!ownership.authorized) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this trip item.",
      });
    }

    return res.status(200).json({
      success: true,
      data: tripItem,
    });
  } catch (error) {
    console.error("Get trip item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trip item.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE TRIP ITEM
| PUT /api/trip-items/:id
|--------------------------------------------------------------------------
*/

export const updateTripItem = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      note,
      quantity,
      estimatedCost,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip item ID.",
      });
    }

    const tripItem = await TripItem.findById(id);

    if (!tripItem) {
      return res.status(404).json({
        success: false,
        message: "Trip item not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check ownership
    |--------------------------------------------------------------------------
    */

    const ownership = await checkTripOwnership(
      tripItem.tripId,
      req.user?.userId || req.user?.id || req.user?._id
    );

    if (!ownership.exists) {
      return res.status(404).json({
        success: false,
        message: "Trip not found.",
      });
    }

    if (!ownership.authorized) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to modify this trip item.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate quantity
    |--------------------------------------------------------------------------
    */

    if (quantity !== undefined) {
      const finalQuantity = Number(quantity);

      if (
        Number.isNaN(finalQuantity) ||
        finalQuantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1.",
        });
      }

      tripItem.quantity = finalQuantity;
    }

    /*
    |--------------------------------------------------------------------------
    | Validate estimated cost
    |--------------------------------------------------------------------------
    */

    if (estimatedCost !== undefined) {
      const finalCost = Number(estimatedCost);

      if (
        Number.isNaN(finalCost) ||
        finalCost < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Estimated cost must be greater than or equal to 0.",
        });
      }

      tripItem.estimatedCost = finalCost;
    }

    if (note !== undefined) {
      tripItem.note = note;
    }

    await tripItem.save();

    return res.status(200).json({
      success: true,
      message: "Trip item updated successfully.",
      data: tripItem,
    });
  } catch (error) {
    console.error("Update trip item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update trip item.",
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE TRIP ITEM
| DELETE /api/trip-items/:id
|--------------------------------------------------------------------------
*/

export const deleteTripItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip item ID.",
      });
    }

    const tripItem = await TripItem.findById(id);

    if (!tripItem) {
      return res.status(404).json({
        success: false,
        message: "Trip item not found.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check ownership
    |--------------------------------------------------------------------------
    */

    const ownership = await checkTripOwnership(
      tripItem.tripId,
      req.user?.userId || req.user?.id || req.user?._id
    );

    if (!ownership.exists) {
      return res.status(404).json({
        success: false,
        message: "Trip not found.",
      });
    }

    if (!ownership.authorized) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this trip item.",
      });
    }

    await TripItem.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Trip item deleted successfully.",
    });
  } catch (error) {
    console.error("Delete trip item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete trip item.",
      error: error.message,
    });
  }
};
