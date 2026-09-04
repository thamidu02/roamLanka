import Trip from "../models/Trip.js";
import TripItem from "../models/TripItem.js";


export const createTrip = async (req, res) => {
  try {
    const {
      name,
      destination,
      startDate,
      endDate,
      transportCost,
      notes,
    } = req.body;

    // 1. Validate required fields
    if (!name || !destination) {
      return res.status(400).json({
        message: "Trip name and destination are required.",
      });
    }

    // 2. Check if the user already has an active trip
    const existingTrip = await Trip.findOne({
      userId: req.user.userId,
    });

    if (existingTrip) {
      return res.status(409).json({
        message: "You already have an active trip.",
      });
    }

    // 3. Validate dates
    if (startDate && endDate) {
      if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({
          message: "End date cannot be before start date.",
        });
      }
    }

    // 4. Validate transport cost
    if (transportCost !== undefined && transportCost < 0) {
      return res.status(400).json({
        message: "Transport cost cannot be negative.",
      });
    }

    // 5. Create trip
    const trip = await Trip.create({
      userId: req.user.userId,  //important part to check auth for trips
      name,
      destination,
      startDate,
      endDate,
      transportCost: transportCost || 0,
      notes,
    });

    // 6. Return created trip
    return res.status(201).json({
      message: "Trip created successfully.",
      trip,
    });
  } catch (error) {
    console.error("Create trip error:", error);

    return res.status(500).json({
      message: "Server error while creating trip.",
    });
  }
};

export const getMyTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ userId: req.user.userId });
    if (!trip) return res.status(404).json({ message: "No active trip found." });
    return res.status(200).json({ success: true, data: trip });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching trip." });
  }
};

export const updateMyTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    const { name, destination, startDate, endDate, transportCost, notes } = req.body;
    if (destination !== undefined && !["Kandy", "Anuradhapura", "Both"].includes(destination)) return res.status(400).json({ message: "Invalid destination." });
    const finalStart = startDate !== undefined ? new Date(startDate) : trip.startDate;
    const finalEnd = endDate !== undefined ? new Date(endDate) : trip.endDate;
    if (finalStart && finalEnd && finalEnd < finalStart) return res.status(400).json({ message: "End date cannot be before start date." });
    if (transportCost !== undefined && (Number.isNaN(Number(transportCost)) || Number(transportCost) < 0)) return res.status(400).json({ message: "Transport cost cannot be negative." });
    if (name !== undefined) trip.name = name;
    if (destination !== undefined) trip.destination = destination;
    if (startDate !== undefined) trip.startDate = finalStart;
    if (endDate !== undefined) trip.endDate = finalEnd;
    if (transportCost !== undefined) trip.transportCost = Number(transportCost);
    if (notes !== undefined) trip.notes = notes;
    await trip.save();
    return res.status(200).json({ success: true, message: "Trip updated successfully.", data: trip });
  } catch (error) {
    return res.status(500).json({ message: "Server error while updating trip." });
  }
};

export const deleteMyTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    await TripItem.deleteMany({ tripId: trip._id });
    return res.status(200).json({ success: true, message: "Trip deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error while deleting trip." });
  }
};
