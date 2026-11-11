const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: false, // Changed from true to false so Discord users don't need a password
    },

    discordId: {
      type: String, // Added to store the unique Discord user ID
      unique: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: ["player", "organizer", "admin"],
      default: "player",
    },

    avatar: {
      type: String,
      default: "🎮",
    },

    points: {
      type: Number,
      default: 0,
    },

    wins: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);