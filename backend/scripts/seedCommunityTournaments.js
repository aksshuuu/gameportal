const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Tournament = require("../models/Tournment");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const legacyKeys = [
  "gameportal-review-valorant-01",
  "gameportal-review-bgmi-02",
  "gameportal-review-rocketleague-03",
  "gameportal-review-apex-04",
];

const communityEvents = [
  {
    seedKey: "gameportal-community-valorant-open-01",
    name: "Valorant Community Open",
    game: "Valorant",
    description: "An open community bracket for teams looking for their next challenge.",
    date: new Date("2026-12-05T16:00:00.000Z"),
    prize: 15000,
    maxPlayers: 40,
    playersPerTeam: 5,
    seededEntrants: 15,
  },
  {
    seedKey: "gameportal-community-bgmi-series-02",
    name: "BGMI Squad Series",
    game: "BGMI",
    description: "A community squad event for coordinated teams.",
    date: new Date("2026-12-12T10:00:00.000Z"),
    prize: 20000,
    maxPlayers: 64,
    playersPerTeam: 4,
    seededEntrants: 28,
  },
  {
    seedKey: "gameportal-community-rocket-league-cup-03",
    name: "Rocket League Winter Cup",
    game: "Rocket League",
    description: "A seasonal community cup with room for new contenders.",
    date: new Date("2026-12-19T17:00:00.000Z"),
    prize: 12000,
    maxPlayers: 32,
    playersPerTeam: 3,
    seededEntrants: 12,
  },
  {
    seedKey: "gameportal-community-apex-clash-04",
    name: "Apex Community Clash",
    game: "Apex Legends",
    description: "Bring your squad for an open community competition.",
    date: new Date("2026-12-27T14:00:00.000Z"),
    prize: 18000,
    maxPlayers: 60,
    playersPerTeam: 3,
    seededEntrants: 24,
  },
];

async function seedCommunityTournaments() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const migration = await Tournament.deleteMany({ demoKey: { $in: legacyKeys } });
  let inserted = 0;
  for (const event of communityEvents) {
    const result = await Tournament.updateOne(
      { seedKey: event.seedKey },
      {
        $set: {
          ...event,
          status: "UPCOMING",
        },
        $setOnInsert: {
          registeredPlayers: [],
        },
      },
      { upsert: true, runValidators: true }
    );
    if (result.upsertedCount) inserted += 1;
  }

  const migrated = await Tournament.updateMany(
    { seedKey: { $in: communityEvents.map(({ seedKey }) => seedKey) }, demoKey: { $exists: true } },
    { $unset: { demoKey: 1 } }
  );
  const total = await Tournament.countDocuments({
    seedKey: { $in: communityEvents.map(({ seedKey }) => seedKey) },
  });
  console.log(
    `Community tournament seed complete: ${total} listings; ${inserted} added, ${migration.deletedCount} old review listings removed.`
  );
  if (migrated.modifiedCount) {
    console.log("Legacy review markers removed from community listings.");
  }
}

seedCommunityTournaments()
  .catch(() => {
    console.error("Community tournament seed failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
