import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import placeRoutes from "./routes/placeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import tripItemRoutes from "./routes/tripItemRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://roam-lanka-b6dl.vercel.app",
];
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Alternatively allow all origins if preferred, or restrict
    },
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use("/api/places", placeRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/trip-items", tripItemRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "LankaExplore API is running.",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "LankaExplore backend is healthy.",
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(`LankaExplore API is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
