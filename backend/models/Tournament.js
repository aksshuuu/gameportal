
const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    // TOURNAMENT NAME
    name: {
      type: String,
      required: [true, "Tournament name is required"],
      trim: true,
      maxlength: [80, "Tournament name cannot exceed 80 characters"],
    },

    // GAME NAME
    game: {
      type: String,
      required: [true, "Game name is required"],
      trim: true,
      maxlength: [40, "Game name cannot exceed 40 characters"],
    },

    // TOURNAMENT DESCRIPTION
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    // TOURNAMENT DATE AND TIME
    date: {
      type: Date,
      required: [true, "Tournament date is required"],
    },

    // PRIZE AMOUNT
    prize: {
      type: Number,
      default: 0,
      min: [0, "Prize cannot be negative"],
    },

    // MAXIMUM PLAYERS
    maxPlayers: {
      type: Number,
      required: [true, "Maximum players is required"],
      min: [2, "Minimum tournament capacity is 2"],
      max: [10000, "Maximum tournament capacity is 10000"],
      validate: {
        validator: Number.isInteger,
        message: "Maximum players must be a whole number",
      },
    },

    // PLAYERS PER TEAM
    playersPerTeam: {
      type: Number,
      required: [true, "Players per team is required"],
      min: [1, "Team size must be at least 1"],
      max: [20, "Team size cannot exceed 20"],
      validate: {
        validator: Number.isInteger,
        message: "Players per team must be a whole number",
      },
    },

    // TOURNAMENT STATUS
    status: {
      type: String,
      default: "UPCOMING",
      trim: true,
    },

    // TOURNAMENT ORGANIZER
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer is required"],
    },

    // REGISTERED PLAYERS
    registeredPlayers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Tournament",
  tournamentSchema
);
