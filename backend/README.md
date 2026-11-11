# Backend setup

1. Install dependencies with `npm install` in this folder.
2. Set `MONGO_URI` and `JWT_SECRET` in `.env` (see `.env.example`). The JWT secret must be at least 32 characters. The provided MongoDB URI uses a local MongoDB instance; replace it with your MongoDB Atlas connection string if needed.
3. Start the API with `npm run dev` or `npm start`.

The API waits for MongoDB to connect before listening on `PORT`. User registrations are stored in MongoDB with bcrypt-hashed passwords; the frontend accesses the API through `VITE_API_URL` (defaults to `http://localhost:5000/api`).

Public registration accepts `player` or `organizer` account types (omitting the type defaults to `player`). Admin accounts cannot be created through public registration. Tournament creation requires an authenticated organizer; tournament ownership is still required for deletion.

For local review, run `npm run seed:community-tournaments` to add four community tournament listings with sample entrant baselines. The seed uses stable internal keys and is safe to rerun. It replaces only its own earlier review entries and does not create user accounts or fabricated member IDs.

Tournament entrant counts are computed as `seededEntrants + registeredPlayers.length`. `seededEntrants` is an explicit aggregate baseline for imported/community listings whose existing entrants do not have GamePortal accounts; it is never a set of fake users. New organizer-created tournaments start at zero, and actual joins add a real account to `registeredPlayers`, increasing the displayed count. Registration capacity checks include both values atomically. Team size (`playersPerTeam`) is required for new tournaments and defaults to five for older records; missing entrant counts are treated as zero.
