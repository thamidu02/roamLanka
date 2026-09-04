import Trip from "../models/Trip.js";


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