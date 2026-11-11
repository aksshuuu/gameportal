const express = require("express");
const router = express.Router();
const Tournament = require("../models/Tournament");
const authenticate = require("../middleware/authenticate");

// GET all tournaments
router.get("/", async (req, res) => {
  try {
    const tournaments = await Tournament.find().populate("organizer", "username email");
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching tournaments" });
  }
});

// CREATE tournament (Organizer only)
router.post("/", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "organizer") {
      return res.status(403).json({ message: "Only organizers can create tournaments" });
    }

    const newTournament = new Tournament({
      ...req.body,
      organizer: req.user._id,
    });

    const savedTournament = await newTournament.save();
    res.status(201).json(savedTournament);
  } catch (error) {
    res.status(500).json({ message: "Server error creating tournament" });
  }
});

// JOIN / REGISTER for a tournament
router.post("/:id/join", authenticate, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const alreadyRegistered = tournament.registeredPlayers.some(
      (id) => String(id) === String(req.user._id)
    );

    if (alreadyRegistered) {
      return res.status(400).json({ message: "You are already registered for this tournament" });
    }

    tournament.registeredPlayers.push(req.user._id);
    await tournament.save();
    res.json({ message: "Successfully registered", tournament });
  } catch (error) {
    res.status(500).json({ message: "Server error joining tournament" });
  }
});

// UNREGISTER from a tournament
router.post("/:id/unregister", authenticate, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    tournament.registeredPlayers = tournament.registeredPlayers.filter(
      (playerId) => String(playerId) !== String(req.user._id)
    );

    await tournament.save();
    res.json({ message: "Successfully unregistered from tournament", tournament });
  } catch (error) {
    res.status(500).json({ message: "Server error unregistering" });
  }
});

// DELETE tournament (Organizer only)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (String(tournament.organizer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to delete this tournament" });
    }

    await tournament.deleteOne();
    res.json({ message: "Tournament deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting tournament" });
  }
});

module.exports = router;