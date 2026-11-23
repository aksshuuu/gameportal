
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Tournament = require("../models/Tournament");
const authenticate = require("../middleware/authenticate");

// -----------------------------------------
// HELPER: HANDLE DATABASE ERRORS
// -----------------------------------------

function handleError(res, error, message) {
  console.error(message, error);

  if (error.name === "ValidationError") {
    const firstError = Object.values(error.errors)[0];

    return res.status(400).json({
      message: firstError?.message || "Invalid tournament details",
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid tournament information",
    });
  }

  return res.status(500).json({
    message,
  });
}

// -----------------------------------------
// GET ALL TOURNAMENTS
// -----------------------------------------

router.get("/", async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate("organizer", "username email")
      .sort({ date: 1 });

    return res.status(200).json(tournaments);
  } catch (error) {
    return handleError(
      res,
      error,
      "Server error fetching tournaments"
    );
  }
});

// -----------------------------------------
// CREATE TOURNAMENT
// ORGANIZER ONLY
// -----------------------------------------

router.post("/", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "organizer") {
      return res.status(403).json({
        message: "Only organizers can create tournaments",
      });
    }

    const {
      name,
      game,
      description,
      date,
      prize,
      maxPlayers,
      playersPerTeam,
    } = req.body || {};

    // Validate name
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 80
    ) {
      return res.status(400).json({
        message: "Enter a valid tournament name",
      });
    }

    // Validate game
    if (
      typeof game !== "string" ||
      !game.trim() ||
      game.trim().length > 40
    ) {
      return res.status(400).json({
        message: "Enter a valid game name",
      });
    }

    // Validate description
    if (
      description !== undefined &&
      (
        typeof description !== "string" ||
        description.length > 500
      )
    ) {
      return res.status(400).json({
        message: "Description must be 500 characters or fewer",
      });
    }

    // Validate date
    if (!date) {
      return res.status(400).json({
        message: "Tournament date is required",
      });
    }

    const tournamentDate = new Date(date);

    if (Number.isNaN(tournamentDate.getTime())) {
      return res.status(400).json({
        message: "Invalid tournament date",
      });
    }

    if (tournamentDate <= new Date()) {
      return res.status(400).json({
        message: "Tournament date must be in the future",
      });
    }

    // Validate maximum players
    const maximumPlayers = Number(maxPlayers);

    if (
      !Number.isInteger(maximumPlayers) ||
      maximumPlayers < 2 ||
      maximumPlayers > 10000
    ) {
      return res.status(400).json({
        message: "Maximum players must be between 2 and 10000",
      });
    }

    // Validate players per team
    const teamSize = Number(playersPerTeam);

    if (
      !Number.isInteger(teamSize) ||
      teamSize < 1 ||
      teamSize > 20 ||
      teamSize > maximumPlayers
    ) {
      return res.status(400).json({
        message: "Enter a valid players-per-team value",
      });
    }

    // Validate prize amount
    const prizeAmount =
      prize === undefined || prize === ""
        ? 0
        : Number(prize);

    if (
      !Number.isFinite(prizeAmount) ||
      prizeAmount < 0
    ) {
      return res.status(400).json({
        message: "Prize amount cannot be negative",
      });
    }

    // Create tournament using approved fields only
    const newTournament = new Tournament({
      name: name.trim(),
      game: game.trim(),
      description:
        typeof description === "string"
          ? description.trim()
          : "",
      date: tournamentDate,
      prize: prizeAmount,
      maxPlayers: maximumPlayers,
      playersPerTeam: teamSize,
      status: "UPCOMING",
      organizer: req.user._id,
      registeredPlayers: [],
    });

    const savedTournament = await newTournament.save();

    return res.status(201).json(savedTournament);
  } catch (error) {
    return handleError(
      res,
      error,
      "Server error creating tournament"
    );
  }
});

// -----------------------------------------
// JOIN / REGISTER FOR TOURNAMENT
// -----------------------------------------

router.post("/:id/join", authenticate, async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(tournamentId)) {
      return res.status(400).json({
        message: "Invalid tournament ID",
      });
    }

    const now = new Date();

    // Atomic update:
    // - Tournament must be upcoming
    // - Date must not have passed
    // - User must not already be registered
    // - Tournament must have available capacity
    const tournament = await Tournament.findOneAndUpdate(
      {
        _id: tournamentId,
        status: "UPCOMING",
        date: { $gt: now },
        registeredPlayers: { $ne: userId },

        $expr: {
          $lt: [
            {
              $size: {
                $ifNull: ["$registeredPlayers", []],
              },
            },
            "$maxPlayers",
          ],
        },
      },
      {
        $addToSet: {
          registeredPlayers: userId,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (tournament) {
      return res.status(200).json({
        message: "Successfully registered",
        tournament,
      });
    }

    // Explain why the registration was rejected
    const existingTournament = await Tournament.findById(
      tournamentId
    );

    if (!existingTournament) {
      return res.status(404).json({
        message: "Tournament not found",
      });
    }

    const alreadyRegistered =
      existingTournament.registeredPlayers.some(
        (id) => String(id) === String(userId)
      );

    if (alreadyRegistered) {
      return res.status(409).json({
        message: "You are already registered for this tournament",
      });
    }

    if (
      existingTournament.status !== "UPCOMING" ||
      new Date(existingTournament.date) <= now
    ) {
      return res.status(400).json({
        message: "Tournament registration is closed",
      });
    }

    if (
      existingTournament.registeredPlayers.length >=
      existingTournament.maxPlayers
    ) {
      return res.status(409).json({
        message: "Tournament is full",
      });
    }

    return res.status(409).json({
      message: "Could not register. Please try again.",
    });

  } catch (error) {
    return handleError(
      res,
      error,
      "Server error joining tournament"
    );
  }
});

// -----------------------------------------
// UNREGISTER FROM TOURNAMENT
// -----------------------------------------

router.post("/:id/unregister", authenticate, async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(tournamentId)) {
      return res.status(400).json({
        message: "Invalid tournament ID",
      });
    }

    const tournament = await Tournament.findByIdAndUpdate(
      tournamentId,
      {
        $pull: {
          registeredPlayers: userId,
        },
      },
      {
        new: true,
      }
    );

    if (!tournament) {
      return res.status(404).json({
        message: "Tournament not found",
      });
    }

    return res.status(200).json({
      message: "Successfully unregistered from tournament",
      tournament,
    });

  } catch (error) {
    return handleError(
      res,
      error,
      "Server error unregistering"
    );
  }
});

// -----------------------------------------
// DELETE TOURNAMENT
// ORGANIZER / OWNER ONLY
// -----------------------------------------

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const tournamentId = req.params.id;

    if (!mongoose.isValidObjectId(tournamentId)) {
      return res.status(400).json({
        message: "Invalid tournament ID",
      });
    }

    const tournament = await Tournament.findById(
      tournamentId
    );

    if (!tournament) {
      return res.status(404).json({
        message: "Tournament not found",
      });
    }

    if (
      String(tournament.organizer) !==
      String(req.user._id)
    ) {
      return res.status(403).json({
        message: "Not authorized to delete this tournament",
      });
    }

    await tournament.deleteOne();

    return res.status(200).json({
      message: "Tournament deleted successfully",
    });

  } catch (error) {
    return handleError(
      res,
      error,
      "Server error deleting tournament"
    );
  }
});

module.exports = router;
