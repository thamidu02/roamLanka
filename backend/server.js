import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import placeRoutes from "./routes/placeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import tripItemRoutes from "./routes/tripItemRoutes.js";

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
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://roam-lanka-b6dl.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
};

// Ensure DB is connected for serverless invocations
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

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

// Only listen on port when running locally (not on Vercel)
if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`LankaExplore API is running on http://localhost:${PORT}`);
    });
  });
}

startServer();

export default app;
