const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  game: { type: String, required: true, trim: true, maxlength: 40 },
  description: { type: String, trim: true, maxlength: 500 },
  date: { type: Date, required: true },
  prize: { type: Number, default: 0, min: 0 },
  maxPlayers: { type: Number, required: true, min: 2, max: 10000 },
  playersPerTeam: { type: Number, required: true, min: 1, max: 20 },
  status: { type: String, default: "UPCOMING" },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  registeredPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

module.exports = mongoose.model("Tournament", tournamentSchema);