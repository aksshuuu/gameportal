
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  useGetTournamentsQuery,
  useGetProfileQuery,
  useCreateTournamentMutation,
  useJoinTournamentMutation,
} from "../services/apiSlice";

import PageHeader from "../components/PageHeader";
import FeedbackState from "../components/FeedbackState";

// FORMAT DATE FOR DISPLAY
const dateLabel = (value) => {
  if (!value) return "Date to be announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date to be announced";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
};

// FORMAT PRIZE
const prizeLabel = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

// DEFAULT CREATE TOURNAMENT FORM
const initialForm = {
  name: "",
  game: "",
  description: "",
  date: "",
  prize: "10000",
  maxPlayers: "40",
  playersPerTeam: "5",
};

export default function Tournaments() {
  const [searchParams, setSearchParams] = useSearchParams();

  // TRACK CURRENT LOGIN
  const [token, setToken] = useState(
    () => localStorage.getItem("token")
  );

  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem("token"));
    };

    window.addEventListener(
      "gameportal-auth-change",
      syncAuth
    );

    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener(
        "gameportal-auth-change",
        syncAuth
      );

      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  // LOAD TOURNAMENTS
  const {
    data: tournamentData = [],
    isLoading: loadingTourneys,
    isError: tournamentError,
    error: tournamentRequestError,
    refetch,
  } = useGetTournamentsQuery();

  const tournaments = Array.isArray(tournamentData)
    ? tournamentData
    : [];

  // GET AUTHENTICATED USER
  // Use the token as the query cache key so a new
  // account does not reuse the previous account's profile.
  const {
    data: apiUser,
    isLoading: loadingProfile,
    isFetching: fetchingProfile,
    isError: profileError,
  } = useGetProfileQuery(token, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  const user =
    token && !profileError && !fetchingProfile
      ? apiUser
      : null;

  const checkingAccount =
    Boolean(token) &&
    (loadingProfile || fetchingProfile);

  // MUTATIONS
  const [createTourney, { isLoading: creating }] =
    useCreateTournamentMutation();

  const [joinTourney] = useJoinTournamentMutation();

  // COMPONENT STATE
  const [filter, setFilter] = useState("All games");
  const [pendingId, setPendingId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);

  // CREATE FORM CONTROLLED BY URL
  const showForm = searchParams.get("create") === "1";

  const toggleCreateForm = () => {
    const next = new URLSearchParams(searchParams);

    if (showForm) {
      next.delete("create");
    } else {
      next.set("create", "1");
    }

    setSearchParams(next);
    setError("");
    setNotice("");
  };

  // LOADING / ERROR STATES
  let state = "ready";

  if (loadingTourneys) {
    state = "loading";
  }

  if (tournamentError) {
    state = "error";
  }

  // AVAILABLE GAME FILTERS
  const games = useMemo(
    () => [
      "All games",
      ...new Set(
        tournaments
          .map((tournament) => tournament.game)
          .filter(Boolean)
      ),
    ],
    [tournamentData]
  );

  const visibleTournaments =
    filter === "All games"
      ? tournaments
      : tournaments.filter(
          (tournament) => tournament.game === filter
        );

  // IDENTIFY CURRENT USER
  const userId = String(
    user?._id || user?.id || ""
  );

  // CHECK IF USER HAS REGISTERED
  const isRegistered = (tournament) =>
    Boolean(
      userId &&
      tournament.registeredPlayers?.some((player) => {
        const playerId =
          player?._id || player?.id || player;

        return String(playerId) === userId;
      })
    );

  // GET REGISTERED PLAYER COUNT
  const getRegisteredCount = (tournament) =>
    tournament.registeredCount ??
    tournament.registeredPlayers?.length ??
    0;

  // CHECK IF REGISTRATION IS CLOSED
  const registrationClosed = (tournament) => {
    const date = new Date(tournament.date);

    return (
      tournament.status !== "UPCOMING" ||
      !Number.isFinite(date.getTime()) ||
      date <= new Date()
    );
  };

  // JOIN TOURNAMENT
  const joinTournament = async (id) => {
    if (!token || !user || pendingId) return;

    setPendingId(id);
    setError("");
    setNotice("");

    try {
      await joinTourney(id).unwrap();

      setNotice(
        "You're registered. The tournament is now listed in your dashboard."
      );
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setPendingId("");
    }
  };

  // CREATE TOURNAMENT
  const createTournament = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");

    if (user?.role !== "organizer") {
      setError(
        "Only organizers can create tournaments."
      );
      return;
    }

    const tournamentDate = new Date(form.date);

    if (
      !Number.isFinite(tournamentDate.getTime()) ||
      tournamentDate <= new Date()
    ) {
      setError(
        "Choose a valid future tournament date and time."
      );
      return;
    }

    const prize = Number(form.prize || 0);
    const maxPlayers = Number(form.maxPlayers);
    const playersPerTeam = Number(form.playersPerTeam);

    if (
      !Number.isFinite(prize) ||
      prize < 0
    ) {
      setError("Enter a valid prize amount.");
      return;
    }

    if (
      !Number.isInteger(maxPlayers) ||
      maxPlayers < 2 ||
      maxPlayers > 10000
    ) {
      setError(
        "Entrant capacity must be between 2 and 10000."
      );
      return;
    }

    if (
      !Number.isInteger(playersPerTeam) ||
      playersPerTeam < 1 ||
      playersPerTeam > 20 ||
      playersPerTeam > maxPlayers
    ) {
      setError(
        "Enter a valid team size that does not exceed capacity."
      );
      return;
    }

    try {
      await createTourney({
        name: form.name.trim(),
        game: form.game.trim(),
        description: form.description.trim(),
        date: tournamentDate.toISOString(),
        prize,
        maxPlayers,
        playersPerTeam,
      }).unwrap();

      setForm(initialForm);

      const next = new URLSearchParams(searchParams);
      next.delete("create");
      setSearchParams(next);

      setNotice("Tournament published successfully.");
    } catch (requestError) {
      setError(
        requestError.data?.message ||
          "Could not publish tournament."
      );
    }
  };

  return (
    <div className="content-width page-content">
      <PageHeader
        eyebrow="THE OPEN CIRCUIT"
        title="Find your next game."
        description="Community events and their current entry details, in one place."
        actions={
          user?.role === "organizer" ? (
            <button
              className="button"
              type="button"
              onClick={toggleCreateForm}
            >
              {showForm
                ? "Close form"
                : "＋ Create tournament"}
            </button>
          ) : null
        }
      />

      {/* ACCOUNT STATUS */}
      {checkingAccount && (
        <p className="inline-notice" role="status">
          Verifying your account...
        </p>
      )}

      {token && profileError && (
        <p className="inline-error" role="alert">
          Could not verify your account. Please check
          your connection or sign in again.
        </p>
      )}

      {/* ORGANIZER CREATE FORM */}
      {showForm && user?.role === "organizer" && (
        <form
          className="data-form create-tournament-form"
          onSubmit={createTournament}
        >
          <div className="form-heading">
            <div>
              <p className="eyebrow">ORGANIZER TOOLS</p>
              <h2>Publish an event</h2>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Event name
              <input
                name="name"
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                maxLength={80}
                required
              />
            </label>

            <label>
              Game
              <input
                name="game"
                value={form.game}
                onChange={(event) =>
                  setForm({
                    ...form,
                    game: event.target.value,
                  })
                }
                maxLength={40}
                required
              />
            </label>

            <label>
              Start date
              <input
                type="datetime-local"
                name="date"
                value={form.date}
                onChange={(event) =>
                  setForm({
                    ...form,
                    date: event.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Prize pool (₹)
              <input
                type="number"
                min="0"
                step="1"
                name="prize"
                value={form.prize}
                onChange={(event) =>
                  setForm({
                    ...form,
                    prize: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Entrant capacity
              <input
                type="number"
                min="2"
                max="10000"
                step="1"
                name="maxPlayers"
                value={form.maxPlayers}
                onChange={(event) =>
                  setForm({
                    ...form,
                    maxPlayers: event.target.value,
                  })
                }
                required
              />
            </label>

            <label>
              Players per team
              <input
                type="number"
                min="1"
                max="20"
                step="1"
                name="playersPerTeam"
                value={form.playersPerTeam}
                onChange={(event) =>
                  setForm({
                    ...form,
                    playersPerTeam: event.target.value,
                  })
                }
                required
              />
            </label>

            <label className="form-wide">
              Description
              <textarea
                name="description"
                rows="3"
                maxLength={500}
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
              />
            </label>
          </div>

          <button
            className="button"
            type="submit"
            disabled={creating}
          >
            {creating
              ? "Publishing…"
              : "Publish tournament"}
          </button>
        </form>
      )}

      {/* NOTICES */}
      {notice && (
        <p className="inline-notice" role="status">
          {notice}
        </p>
      )}

      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}

      {/* TOURNAMENT BOARD */}
      <section className="content-section">
        <div className="section-title-row list-toolbar">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-line" />
              Tournament board
            </p>

            <h2>All listings</h2>
          </div>

          {state === "ready" &&
            tournaments.length > 0 && (
              <label className="filter-label">
                Filter by game

                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value)
                  }
                >
                  {games.map((game) => (
                    <option key={game} value={game}>
                      {game}
                    </option>
                  ))}
                </select>
              </label>
            )}
        </div>

        {/* LOADING */}
        {state === "loading" && (
          <FeedbackState title="Loading the tournament board">
            Fetching current listings.
          </FeedbackState>
        )}

        {/* ERROR */}
        {state === "error" && (
          <FeedbackState
            title="Couldn't load tournaments"
            tone="error"
            action={
              <button
                className="button button-outline"
                onClick={refetch}
              >
                Try again
              </button>
            }
          >
            {tournamentRequestError?.data?.message ||
              "Your existing registrations remain safe. Please retry in a moment."}
          </FeedbackState>
        )}

        {/* EMPTY */}
        {state === "ready" &&
          tournaments.length === 0 && (
            <>
              <FeedbackState title="No tournaments listed yet">
                There are no published events to join
                right now.
              </FeedbackState>

              <div className="next-steps-panel tournament-empty-next">
                <p className="eyebrow">
                  WHILE YOU WAIT
                </p>

                <h2>Keep your next match in sight.</h2>

                <div className="next-step-links">
                  <Link
                    to={user ? "/dashboard" : "/register"}
                  >
                    <span>01</span>
                    <strong>
                      {user
                        ? "Open your player dashboard"
                        : "Create a player account"}
                    </strong>
                    <i aria-hidden="true">↗</i>
                  </Link>

                  <Link to="/teams">
                    <span>02</span>
                    <strong>Explore the team space</strong>
                    <i aria-hidden="true">↗</i>
                  </Link>

                  <Link to="/matches">
                    <span>03</span>
                    <strong>
                      Review published event dates
                    </strong>
                    <i aria-hidden="true">↗</i>
                  </Link>
                </div>
              </div>
            </>
          )}

        {/* NO FILTER MATCHES */}
        {state === "ready" &&
          tournaments.length > 0 &&
          visibleTournaments.length === 0 && (
            <FeedbackState
              title={`No ${filter} events`}
            >
              Choose another game to see more listings.
            </FeedbackState>
          )}

        {/* TOURNAMENT LIST */}
        {state === "ready" &&
          visibleTournaments.length > 0 && (
            <div className="tournament-list">
              {visibleTournaments.map(
                (tournament, index) => {
                  const registered =
                    isRegistered(tournament);

                  const registeredCount =
                    getRegisteredCount(tournament);

                  const full =
                    registeredCount >=
                    (tournament.maxPlayers ?? Infinity);

                  const closed =
                    registrationClosed(tournament);

                  return (
                    <article
                      className="tournament-row tournament-full-row"
                      key={tournament._id}
                    >
                      <span className="row-index">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <div className="tournament-row-main">
                        <span className="row-overline">
                          {tournament.game}
                          <span> · </span>
                          {tournament.status}
                        </span>

                        <h3>{tournament.name}</h3>

                        {tournament.description && (
                          <p className="tournament-description">
                            {tournament.description}
                          </p>
                        )}
                      </div>

                      <div className="tournament-meta">
                        <div>
                          <span>Scheduled</span>
                          <strong>
                            {dateLabel(tournament.date)}
                          </strong>
                        </div>

                        <div>
                          <span>Prize pool</span>
                          <strong>
                            {prizeLabel(tournament.prize)}
                          </strong>
                        </div>

                        <div>
                          <span>Entrants</span>
                          <strong>
                            {registeredCount}
                            {" / "}
                            {tournament.maxPlayers ?? "Open"}
                          </strong>
                        </div>

                        <div>
                          <span>Team size</span>
                          <strong>
                            {tournament.playersPerTeam
                              ? `${tournament.playersPerTeam} players`
                              : "Not set"}
                          </strong>
                        </div>
                      </div>

                      <div className="tournament-join">
                        {registered ? (
                          <span className="status-label">
                            Registered
                          </span>
                        ) : !token ? (
                          <Link
                            className="button button-outline button-small"
                            to="/login"
                          >
                            Sign in to join
                          </Link>
                        ) : (
                          <button
                            className="button button-outline button-small"
                            onClick={() =>
                              joinTournament(tournament._id)
                            }
                            disabled={
                              !user ||
                              Boolean(pendingId) ||
                              full ||
                              closed
                            }
                          >
                            {pendingId === tournament._id
                              ? "Joining…"
                              : closed
                              ? "Closed"
                              : full
                              ? "Full"
                              : !user
                              ? "Checking account…"
                              : "Register"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
      </section>
    </div>
  );
}
