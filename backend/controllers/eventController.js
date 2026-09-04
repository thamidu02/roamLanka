import mongoose from "mongoose";
import Event from "../models/Event.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns true if the string is a syntactically valid Mongoose ObjectId.
 * Avoids CastError exceptions when a caller passes a garbage :id.
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── GET /api/events ─────────────────────────────────────────────────────────
// Public.
// Supports optional query params:
//   location   – "Kandy" | "Anuradhapura"
//   category   – any string
//   startDate  – ISO date string  (trip start)
//   endDate    – ISO date string  (trip end)
//
// When BOTH startDate and endDate are supplied the response is limited to
// events that OVERLAP the travel window:
//   event.startDate <= tripEndDate  AND  event.endDate >= tripStartDate
export const getEvents = async (req, res) => {
  try {
    const { location, category, startDate, endDate } = req.query;

    const filter = {};

    // ── Location filter ──────────────────────────────────────────────────────
    if (location) {
      if (!["Kandy", "Anuradhapura"].includes(location)) {
        return res.status(400).json({
          success: false,
          message: "Location must be either Kandy or Anuradhapura.",
        });
      }
      filter.location = location;
    }

    // ── Category filter ──────────────────────────────────────────────────────
    if (category) {
      // Case-insensitive prefix match so "cultural" still finds "Cultural"
      filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    // ── Travel-date overlap filter ───────────────────────────────────────────
    if (startDate || endDate) {
      // Require both dates for the overlap search
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message:
            "Both startDate and endDate are required for travel-date filtering.",
        });
      }

      const parsedStart = new Date(startDate);
      const parsedEnd = new Date(endDate);

      if (isNaN(parsedStart.getTime())) {
        return res.status(400).json({
          success: false,
          message: "startDate is not a valid date.",
        });
      }

      if (isNaN(parsedEnd.getTime())) {
        return res.status(400).json({
          success: false,
          message: "endDate is not a valid date.",
        });
      }

      if (parsedStart > parsedEnd) {
        return res.status(400).json({
          success: false,
          message: "Start date must be before or equal to end date.",
        });
      }

      // Correct overlap condition:
      //   event starts on or before the trip ends
      //   AND event ends on or after the trip starts
      filter.startDate = { $lte: parsedEnd };
      filter.endDate = { $gte: parsedStart };
    }

    const events = await Event.find(filter).sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch events.",
      error: error.message,
    });
  }
};

// ─── GET /api/events/:id ──────────────────────────────────────────────────────
// Public.
export const getEventById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch event.",
      error: error.message,
    });
  }
};

// ─── POST /api/events ─────────────────────────────────────────────────────────
// Admin only.
export const createEvent = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      category,
      startDate,
      endDate,
      estimatedCost,
      imageUrl,
    } = req.body;

    // ── Required-field check ─────────────────────────────────────────────────
    if (!name || !description || !location || !category || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: name, description, location, category, startDate, endDate.",
      });
    }

    // ── Blank-string guards ──────────────────────────────────────────────────
    if (!name.trim() || !description.trim() || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "name, description, and category must not be blank.",
      });
    }

    // ── Location validation ──────────────────────────────────────────────────
    if (!["Kandy", "Anuradhapura"].includes(location)) {
      return res.status(400).json({
        success: false,
        message: "Location must be either Kandy or Anuradhapura.",
      });
    }

    // ── Date validation ──────────────────────────────────────────────────────
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);

    if (isNaN(parsedStart.getTime())) {
      return res.status(400).json({
        success: false,
        message: "startDate is not a valid date.",
      });
    }

    if (isNaN(parsedEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: "endDate is not a valid date.",
      });
    }

    if (parsedEnd < parsedStart) {
      return res.status(400).json({
        success: false,
        message: "endDate must be on or after startDate.",
      });
    }

    // ── estimatedCost validation ─────────────────────────────────────────────
    if (estimatedCost !== undefined && estimatedCost !== null) {
      if (typeof estimatedCost !== "number" || isNaN(estimatedCost)) {
        return res.status(400).json({
          success: false,
          message: "estimatedCost must be a number.",
        });
      }
      if (estimatedCost < 0) {
        return res.status(400).json({
          success: false,
          message: "estimatedCost cannot be negative.",
        });
      }
    }

    const event = await Event.create({
      name: name.trim(),
      description: description.trim(),
      location,
      category: category.trim(),
      startDate: parsedStart,
      endDate: parsedEnd,
      ...(estimatedCost !== undefined && estimatedCost !== null && { estimatedCost }),
      ...(imageUrl && { imageUrl: imageUrl.trim() }),
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully.",
      data: event,
    });
  } catch (error) {
    // Catch Mongoose validation errors (enum, min, required) and return 400
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(" "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to create event.",
      error: error.message,
    });
  }
};

// ─── PUT /api/events/:id ──────────────────────────────────────────────────────
// Admin only.
export const updateEvent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    // Fetch the current document so we can validate the merged state
    const existing = await Event.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const {
      name,
      description,
      location,
      category,
      startDate,
      endDate,
      estimatedCost,
      imageUrl,
    } = req.body;

    // ── Blank-string guards for optional updates ─────────────────────────────
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "name must not be blank.",
      });
    }
    if (description !== undefined && !String(description).trim()) {
      return res.status(400).json({
        success: false,
        message: "description must not be blank.",
      });
    }
    if (category !== undefined && !String(category).trim()) {
      return res.status(400).json({
        success: false,
        message: "category must not be blank.",
      });
    }

    // ── Location validation ──────────────────────────────────────────────────
    if (location !== undefined && !["Kandy", "Anuradhapura"].includes(location)) {
      return res.status(400).json({
        success: false,
        message: "Location must be either Kandy or Anuradhapura.",
      });
    }

    // ── Date validation ──────────────────────────────────────────────────────
    // Resolve the effective start/end (incoming value or existing document value)
    const effectiveStart = startDate !== undefined ? new Date(startDate) : existing.startDate;
    const effectiveEnd = endDate !== undefined ? new Date(endDate) : existing.endDate;

    if (startDate !== undefined && isNaN(effectiveStart.getTime())) {
      return res.status(400).json({
        success: false,
        message: "startDate is not a valid date.",
      });
    }

    if (endDate !== undefined && isNaN(effectiveEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: "endDate is not a valid date.",
      });
    }

    if (effectiveEnd < effectiveStart) {
      return res.status(400).json({
        success: false,
        message: "endDate must be on or after startDate.",
      });
    }

    // ── estimatedCost validation ─────────────────────────────────────────────
    if (estimatedCost !== undefined && estimatedCost !== null) {
      if (typeof estimatedCost !== "number" || isNaN(estimatedCost)) {
        return res.status(400).json({
          success: false,
          message: "estimatedCost must be a number.",
        });
      }
      if (estimatedCost < 0) {
        return res.status(400).json({
          success: false,
          message: "estimatedCost cannot be negative.",
        });
      }
    }

    // Build update payload — only include fields that were actually sent
    const updatePayload = {};
    if (name !== undefined)          updatePayload.name          = String(name).trim();
    if (description !== undefined)   updatePayload.description   = String(description).trim();
    if (location !== undefined)      updatePayload.location      = location;
    if (category !== undefined)      updatePayload.category      = String(category).trim();
    if (startDate !== undefined)     updatePayload.startDate     = effectiveStart;
    if (endDate !== undefined)       updatePayload.endDate       = effectiveEnd;
    if (estimatedCost !== undefined) updatePayload.estimatedCost = estimatedCost;
    if (imageUrl !== undefined)      updatePayload.imageUrl      = imageUrl ? String(imageUrl).trim() : imageUrl;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Event updated successfully.",
      data: event,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(" "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to update event.",
      error: error.message,
    });
  }
};

// ─── DELETE /api/events/:id ───────────────────────────────────────────────────
// Admin only.
export const deleteEvent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID.",
      });
    }

    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete event.",
      error: error.message,
    });
  }
};
