const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Dynamic CORS configuration supporting all Vercel deployments and local development
app.use(cors({
  origin: [
    /\.vercel\.app$/, // Automatically allows any Vercel preview or production URL
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

// Health check route
app.get('/', (req, res) => {
  res.status(200).send("GamePortal Backend is running live!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});