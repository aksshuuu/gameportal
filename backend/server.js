
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Frontend URL from Render environment variables
const FRONTEND_URL = (
  process.env.FRONTEND_URL || 'http://localhost:5173'
).replace(/\/$/, '');

// Security: hide Express identification
app.disable('x-powered-by');

// Parse JSON requests
app.use(express.json({ limit: '32kb' }));

// CORS configuration
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests and direct browser navigation
    if (!origin) {
      return callback(null, true);
    }

    // Allow configured frontend origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ]
}));

// HEALTH CHECK
// Visit /health to check Render and MongoDB
app.get('/health', (req, res) => {
  const databaseConnected =
    mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'error',
    server: 'GamePortal Backend',
    database: databaseConnected
      ? 'connected'
      : 'disconnected'
  });
});

// AUTHENTICATION ROUTES
app.use('/api/auth', require('./routes/auth'));

// TOURNAMENT ROUTES
app.use('/api/tournaments', require('./routes/tournaments'));

// ROOT ROUTE
app.get('/', (req, res) => {
  res.status(200).send(
    'GamePortal Backend is running live!'
  );
});

// MONGODB CONNECTION AND SERVER STARTUP
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error(
        'MONGO_URI is missing from environment variables'
      );
    }


if (!process.env.JWT_SECRET) {
  throw new Error(
    'my_super_secret_key_123_make_it_32_chars_long'
  );
}


    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    });

    console.log('MongoDB connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error(
      'Backend startup failed:',
      error.message
    );

    process.exit(1);
  }
}

startServer();
