import Event from "../models/Event.js";

const isValidLocation = (location) => ["Kandy", "Anuradhapura"].includes(location);

export const getEvents = async (req, res) => {
  try {
    const { location, startDate, endDate } = req.query;
    const filter = {};
    if (location) {
      if (!isValidLocation(location)) return res.status(400).json({ message: "Location must be Kandy or Anuradhapura." });
      filter.location = location;
    }
    if (startDate && endDate) filter.$and = [{ startDate: { $lte: new Date(endDate) } }, { endDate: { $gte: new Date(startDate) } }];
    const events = await Event.find(filter).sort({ startDate: 1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to fetch events.", error: error.message }); }
};

export const createEvent = async (req, res) => {
  try {
    const { name, description, location, category, startDate, endDate, estimatedCost = 0, imageUrl } = req.body;
    if (!name || !description || !location || !category || !startDate || !endDate) return res.status(400).json({ success: false, message: "Name, description, location, category, start date and end date are required." });
    if (!isValidLocation(location)) return res.status(400).json({ success: false, message: "Location must be Kandy or Anuradhapura." });
    if (new Date(endDate) < new Date(startDate)) return res.status(400).json({ success: false, message: "End date cannot be before start date." });
    const event = await Event.create({ name, description, location, category, startDate, endDate, estimatedCost, imageUrl });
    res.status(201).json({ success: true, message: "Event created successfully.", data: event });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to create event.", error: error.message }); }
};

export const updateEvent = async (req, res) => {
  try {
    if (req.body.location && !isValidLocation(req.body.location)) return res.status(400).json({ message: "Location must be Kandy or Anuradhapura." });
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });
    res.json({ success: true, message: "Event updated successfully.", data: event });
  } catch (error) { res.status(error.name === "CastError" ? 400 : 500).json({ success: false, message: error.name === "CastError" ? "Invalid event ID." : "Failed to update event." }); }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });
    res.json({ success: true, message: "Event deleted successfully." });
  } catch (error) { res.status(error.name === "CastError" ? 400 : 500).json({ success: false, message: error.name === "CastError" ? "Invalid event ID." : "Failed to delete event." }); }
};
