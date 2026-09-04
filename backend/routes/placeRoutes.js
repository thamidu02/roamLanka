import express from "express";
import {
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace,
} from "../controllers/placeController.js";

import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getPlaces)
  .post(protect, adminOnly, createPlace);

router.route("/:id")
  .put(protect, adminOnly, updatePlace)
  .delete(protect, adminOnly, deletePlace);

export default router;