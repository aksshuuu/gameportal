
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // USERNAME
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [2, "Username must be at least 2 characters"],
      maxlength: [40, "Username cannot exceed 40 characters"],
    },

    // EMAIL ADDRESS
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    // PASSWORD
    // Optional because Discord users do not have passwords
    password: {
      type: String,
      required: false,
      default: undefined,
    },

    // DISCORD ACCOUNT ID
    discordId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },

    // ACCOUNT ROLE
    role: {
      type: String,
      enum: ["player", "organizer", "admin"],
      default: "player",
    },

    // PROFILE AVATAR
    avatar: {
      type: String,
      default: "🎮",
    },

    // PLAYER POINTS
    points: {
      type: Number,
      default: 0,
    },

    // PLAYER WINS
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
