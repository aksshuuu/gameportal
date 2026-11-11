const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");

dotenv.config({ path: path.join(__dirname, ".env") });

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is required in backend/.env");
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in backend/.env");
}

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = new Set([
  FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

app.use(
  cors({
    origin: [...allowedOrigins],
  })
);

app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const tournamentRoutes = require("./routes/tournaments");
app.use("/api/tournaments", tournamentRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "ArenaX API is running",
  });
});

async function startServer() {
  let mongoUri = process.env.MONGO_URI;

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.warn("Primary MongoDB connection failed; starting temporary local database...");
    const mongoMemoryServer = await MongoMemoryServer.create();
    mongoUri = mongoMemoryServer.getUri();
    await mongoose.connect(mongoUri);
    console.log("Connected to in-memory MongoDB for local development");
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Application startup failed");
  console.error(error);
  process.exitCode = 1;
});