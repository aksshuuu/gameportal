const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(express.json());

// CORS configuration to allow your live Vercel frontend and local development
app.use(cors({
  origin: [
    "https://gameportal-sable.vercel.app", 
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected successfully"))
.catch((err) => console.error("MongoDB connection error:", err));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tournaments', require('./routes/tournaments'));

// Health check route (used by UptimeRobot to keep the server awake)
app.get('/', (req, res) => {
  res.status(200).send("GamePortal Backend is running live!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});