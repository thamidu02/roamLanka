import express from "express";

import {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
} from "../controllers/hotelController.js";

const router = express.Router();

/*
 * GET /api/hotels
 * Get all hotels
 *
 * Examples:
 * /api/hotels
 * /api/hotels?location=Kandy
 * /api/hotels?search=Queen
 * /api/hotels?minPrice=5000&maxPrice=15000
 */
router.get("/", getHotels);

/*
 * GET /api/hotels/:id
 * Get one hotel
 */
router.get("/:id", getHotelById);

/*
 * POST /api/hotels
 * Create a hotel
 */
router.post("/", createHotel);

/*
 * PUT /api/hotels/:id
 * Update a hotel
 */
router.put("/:id", updateHotel);

/*
 * DELETE /api/hotels/:id
 * Delete a hotel
 */
router.delete("/:id", deleteHotel);

export default router;