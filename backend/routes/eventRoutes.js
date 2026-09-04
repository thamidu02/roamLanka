import express from "express";
import { createEvent, deleteEvent, getEvents, updateEvent } from "../controllers/eventController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/", getEvents);
router.post("/", protect, adminOnly, createEvent);
router.put("/:id", protect, adminOnly, updateEvent);
router.delete("/:id", protect, adminOnly, deleteEvent);
export default router;
