import express from "express";

import {
  createTripItem,
  getTripItems,
  getTripItemById,
  updateTripItem,
  deleteTripItem,
} from "../controllers/tripItemController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All TripItem operations require authentication
router.use(protect);

// Add item to a trip
router.post("/", createTripItem);

// Get all items belonging to a trip
router.get("/trip/:tripId", getTripItems);

// Get one trip item
router.get("/:id", getTripItemById);

// Update trip item
router.put("/:id", updateTripItem);

// Delete trip item
router.delete("/:id", deleteTripItem);

export default router;