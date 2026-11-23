
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');

const User = require('../models/User');
const authenticate = require('../middleware/authenticate');

// FRONTEND URL
const FRONTEND_URL = (
  process.env.FRONTEND_URL || 'http://localhost:5173'
).replace(/\/$/, '');

// Send consistent user information
const formatUser = (user) => ({
  id: user._id,
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  points: user.points,
  wins: user.wins
});

// Create JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// GET CURRENT USER PROFILE
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json(formatUser(req.user));
  } catch (err) {
    console.error('Profile Error:', err);
    res.status(500).json({
      message: 'Server error fetching profile'
    });
  }
});

// REGISTER PLAYER OR ORGANIZER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body || {};

    // Validate username
    if (
      typeof username !== 'string' ||
      username.trim().length < 2 ||
      username.trim().length > 40
    ) {
      return res.status(400).json({
        message: 'Username must contain 2 to 40 characters'
      });
    }

    // Validate email
    if (
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      });
    }

    // Validate password
    if (
      typeof password !== 'string' ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: 'Password must contain at least 8 characters'
      });
    }

    // Validate role
    if (
      role !== undefined &&
      !['player', 'organizer'].includes(role)
    ) {
      return res.status(400).json({
        message: 'Invalid account type'
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existingEmail = await User.findOne({
      email: cleanEmail
    });

    if (existingEmail) {
      return res.status(409).json({
        message: 'Email already registered. Please log in.'
      });
    }

    // Check duplicate username
    const existingUsername = await User.findOne({
      username: cleanUsername
    });

    if (existingUsername) {
      return res.status(409).json({
        message: 'Username already taken. Try another.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create account
    const newUser = new User({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'player'
    });

    await newUser.save();

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: formatUser(newUser)
    });

  } catch (err) {
    console.error('Registration Error:', err);

    // MongoDB duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];

      return res.status(409).json({
        message: field === 'username'
          ? 'Username already taken. Try another.'
          : field === 'email'
            ? 'Email already registered.'
            : 'Account already exists.'
      });
    }

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Please check your registration details'
      });
    }

    return res.status(500).json({
      message: 'Server error during registration'
    });
  }
});

// LOGIN WITH EMAIL AND PASSWORD
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: cleanEmail
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message: 'Please log in using Discord for this account.'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: formatUser(user)
    });

  } catch (err) {
    console.error('Login Error:', err);

    return res.status(500).json({
      message: 'Server error during login'
    });
  }
});

// START DISCORD LOGIN / REGISTRATION
router.get('/discord', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(503).json({
      message: 'Discord authentication is not configured'
    });
  }

  const state = crypto.randomBytes(24).toString('hex');

  res.cookie('gp_discord_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/api/auth/discord'
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email',
    state
  });

  const discordAuthUrl =
    `https://discord.com/oauth2/authorize?${params.toString()}`;

  return res.redirect(discordAuthUrl);
});

// DISCORD CALLBACK
router.get('/discord/callback', async (req, res) => {
  const { code, state } = req.query;

  const cookies = (req.headers.cookie || '')
    .split(';')
    .map(cookie => cookie.trim());

  const stateCookie = cookies.find(cookie =>
    cookie.startsWith('gp_discord_state=')
  );

  const savedState = stateCookie
    ? stateCookie.substring('gp_discord_state='.length)
    : null;

  res.clearCookie('gp_discord_state', {
    path: '/api/auth/discord'
  });

  const validState =
    typeof state === 'string' &&
    typeof savedState === 'string' &&
    state.length === savedState.length &&
    crypto.timingSafeEqual(
      Buffer.from(state),
      Buffer.from(savedState)
    );

  if (!code || !validState) {
    return res.redirect(
      `${FRONTEND_URL}/login?error=discord_failed`
    );
  }

  try {
    const params = new URLSearchParams();

    params.append(
      'client_id',
      process.env.DISCORD_CLIENT_ID
    );

    params.append(
      'client_secret',
      process.env.DISCORD_CLIENT_SECRET
    );

    params.append('grant_type', 'authorization_code');
    params.append('code', String(code));

    params.append(
      'redirect_uri',
      process.env.DISCORD_REDIRECT_URI
    );

    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get(
      'https://discord.com/api/users/@me',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        timeout: 15000
      }
    );

    const discordUser = userResponse.data;

    if (
      !discordUser.id ||
      !discordUser.email ||
      discordUser.verified !== true
    ) {
      return res.redirect(
        `${FRONTEND_URL}/login?error=discord_failed`
      );
    }

    const discordEmail = discordUser.email
      .trim()
      .toLowerCase();

    // First find an existing linked Discord account
    let user = await User.findOne({
      discordId: discordUser.id
    });

    // Then check whether the email belongs to another account
    if (!user) {
      const emailUser = await User.findOne({
        email: discordEmail
      });

      if (emailUser) {
        // Prevent linking to an account already using another Discord ID
        if (
          emailUser.discordId &&
          emailUser.discordId !== discordUser.id
        ) {
          return res.redirect(
            `${FRONTEND_URL}/login?error=discord_failed`
          );
        }

        // Existing email/password accounts must be linked
        // through an authenticated account settings flow.
        // Do not silently link using only an email match.
        return res.redirect(
          `${FRONTEND_URL}/login?error=discord_link_required`
        );
      }
    }

    const avatar = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : '';

    // Create a player account if Discord user is new
    if (!user) {
      const baseUsername = String(
        discordUser.username || 'DiscordPlayer'
      ).slice(0, 30);

      let username = baseUsername;
      let counter = 1;

      while (await User.exists({ username })) {
        username = `${baseUsername}_${counter}`;
        counter++;
      }

      user = new User({
        username,
        email: discordEmail,
        discordId: discordUser.id,
        avatar,
        role: 'player'
      });

      await user.save();
    } else {
      // Update Discord avatar
      if (avatar) {
        user.avatar = avatar;
        await user.save();
      }
    }

    const token = generateToken(user);

    // Redirect to deployed frontend, not localhost
    return res.redirect(
      `${FRONTEND_URL}/oauth-callback#token=${encodeURIComponent(token)}`
    );

  } catch (error) {
    console.error(
      'Discord OAuth Error:',
      error.response?.data || error.message
    );

    return res.redirect(
      `${FRONTEND_URL}/login?error=discord_failed`
    );
  }
});

module.exports = router;
