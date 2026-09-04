import express from "express";
import { createTrip, deleteMyTrip, getMyTrip, updateMyTrip } from "../controllers/tripController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createTrip);
router.get("/my-trip", protect, getMyTrip);
router.put("/:id", protect, updateMyTrip);
router.delete("/:id", protect, deleteMyTrip);

export default router;
