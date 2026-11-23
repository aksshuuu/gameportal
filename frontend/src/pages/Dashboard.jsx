
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  useGetTournamentsQuery,
  useDeleteTournamentMutation,
  useUnregisterTournamentMutation,
} from "../services/apiSlice";

import api from "../services/api";
import PageHeader from "../components/PageHeader";
import FeedbackState from "../components/FeedbackState";

// FORMAT TOURNAMENT DATE
const formatDate = (value) => {
  if (!value) return "Date pending";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date pending";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
};

// FORMAT PRIZE MONEY
const prizeLabel = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

// TOURNAMENT INFORMATION
const TournamentMetrics = ({ tournament }) => (
  <div className="home-tournament-meta dashboard-tournament-meta">
    <span>
      <small>Prize</small>
      <strong>{prizeLabel(tournament.prize)}</strong>
    </span>

    <span>
      <small>Entrants</small>
      <strong>
        {tournament.registeredCount ??
          tournament.registeredPlayers?.length ??
          0}
        {" / "}
        {tournament.maxPlayers ?? "Open"}
      </strong>
    </span>

    <span>
      <small>Team size</small>
      <strong>
        {tournament.playersPerTeam
          ? `${tournament.playersPerTeam} players`
          : "Not set"}
      </strong>
    </span>
  </div>
);

export default function Dashboard() {
  // Track the currently authenticated session
  const [token, setToken] = useState(
    () => localStorage.getItem("token")
  );

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [actionMessage, setActionMessage] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  // UPDATE SESSION AFTER LOGIN / LOGOUT
  useEffect(() => {
    const syncSession = () => {
      const currentToken = localStorage.getItem("token");

      setToken(currentToken);
      setUser(null);
      setActionMessage("");
      setRefreshKey((key) => key + 1);
    };

    window.addEventListener(
      "gameportal-auth-change",
      syncSession
    );

    window.addEventListener(
      "storage",
      syncSession
    );

    return () => {
      window.removeEventListener(
        "gameportal-auth-change",
        syncSession
      );

      window.removeEventListener(
        "storage",
        syncSession
      );
    };
  }, []);

  // ALWAYS VERIFY CURRENT USER WITH BACKEND
  // This avoids showing the previous account's cached profile.
  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadProfile() {
      if (!token) {
        setUser(null);
        setUserError("");
        setLoadingUser(false);
        return;
      }

      setLoadingUser(true);
      setUserError("");
      setUser(null);

      try {
        const response = await api.get("/auth/me", {
          signal: controller.signal,
        });

        if (
          !active ||
          localStorage.getItem("token") !== token
        ) {
          return;
        }

        setUser(response.data);

        localStorage.setItem(
          "user",
          JSON.stringify(response.data)
        );
      } catch (error) {
        if (
          !active ||
          error.code === "ERR_CANCELED"
        ) {
          return;
        }

        if (error.response?.status === 401) {
          // Expired or invalid JWT
          if (localStorage.getItem("token") === token) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setToken(null);

            window.dispatchEvent(
              new Event("gameportal-auth-change")
            );
          }

          setUserError("Your session expired. Please log in.");
        } else {
          setUserError(
            error.response?.data?.message ||
              "Could not load your profile. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoadingUser(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, refreshKey]);

  // LOAD TOURNAMENT DATA
  const {
    data: allTournaments = [],
    isLoading: loadingTourneys,
    isFetching: fetchingTourneys,
    isError: tourneyError,
    error: tournamentLoadError,
    refetch: refetchTourneys,
  } = useGetTournamentsQuery(undefined, {
    skip: !token || !user,
    refetchOnMountOrArgChange: true,
  });

  // MUTATIONS
  const [deleteTourney] = useDeleteTournamentMutation();
  const [unregisterTourney] =
    useUnregisterTournamentMutation();

  // RETRY DATA LOADING
  const retryLoad = () => {
    setUserError("");
    setRefreshKey((key) => key + 1);

    if (user) {
      refetchTourneys();
    }
  };

  // DELETE ORGANIZER TOURNAMENT
  const handleDelete = async (id) => {
    if (pendingAction) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this tournament?"
    );

    if (!confirmed) return;

    setPendingAction(id);
    setActionMessage("");

    try {
      await deleteTourney(id).unwrap();

      setActionMessage(
        "Tournament deleted successfully."
      );
    } catch (error) {
      setActionMessage(
        error.data?.message ||
          "Failed to delete tournament."
      );
    } finally {
      setPendingAction("");
    }
  };

  // CANCEL TOURNAMENT REGISTRATION
  const handleUnregister = async (id) => {
    if (pendingAction) return;

    setPendingAction(id);
    setActionMessage("");

    try {
      await unregisterTourney(id).unwrap();

      setActionMessage(
        "Successfully unregistered from tournament."
      );
    } catch (error) {
      setActionMessage(
        error.data?.message ||
          "Failed to unregister."
      );
    } finally {
      setPendingAction("");
    }
  };

  // NOT LOGGED IN
  if (!token) {
    return (
      <div className="content-width page-content">
        <PageHeader
          eyebrow="DASHBOARD"
          title="Your dashboard"
        />

        <FeedbackState
          title="Sign in to see your space"
          action={
            <Link className="button" to="/login">
              Sign in
            </Link>
          }
        >
          Your tournament registrations are tied to
          your account.
        </FeedbackState>
      </div>
    );
  }

  // LOADING STATE
  if (
    loadingUser ||
    (!userError && user &&
      (loadingTourneys || fetchingTourneys))
  ) {
    return (
      <div className="content-width page-content">
        <PageHeader
          eyebrow="DASHBOARD"
          title="Your dashboard"
        />

        <FeedbackState title="Loading your dashboard">
          Getting your account and tournament details.
        </FeedbackState>
      </div>
    );
  }

  // ERROR STATE
  if (userError || tourneyError || !user) {
    return (
      <div className="content-width page-content">
        <PageHeader
          eyebrow="DASHBOARD"
          title="Your dashboard"
        />

        <FeedbackState
          title="We couldn't load your account"
          tone="error"
          action={
            <button
              className="button button-outline"
              onClick={retryLoad}
            >
              Try again
            </button>
          }
        >
          {userError ||
            tournamentLoadError?.data?.message ||
            "Check your connection and try again."}
        </FeedbackState>
      </div>
    );
  }

  // Support both id and _id
  const userId = String(user._id || user.id || "");

  const tournaments = Array.isArray(allTournaments)
    ? allTournaments
    : [];

  // ORGANIZER OWNED TOURNAMENTS
  const owned = tournaments.filter((tournament) => {
    const organizerId =
      tournament.organizer?._id ||
      tournament.organizer?.id ||
      tournament.organizer;

    return (
      userId &&
      String(organizerId || "") === userId
    );
  });

  // PLAYER REGISTERED TOURNAMENTS
  const joined = tournaments.filter((tournament) =>
    tournament.registeredPlayers?.some((player) => {
      const playerId =
        player?._id || player?.id || player;

      return userId && String(playerId) === userId;
    })
  );

  return (
    <div className="content-width page-content">

      <PageHeader
        eyebrow={
          user.role === "organizer"
            ? "ORGANIZER WORKSPACE"
            : "PLAYER SPACE"
        }
        title={`Good to see you, ${
          user.username || "player"
        }.`}
        description={
          user.role === "organizer"
            ? "Your tournament listings and activity."
            : "Your competitions and registrations."
        }
        actions={
          user.role === "organizer" ? (
            <Link
              className="button"
              to="/tournaments?create=1"
            >
              ＋ Create tournament
            </Link>
          ) : (
            <Link
              className="button button-outline"
              to="/tournaments"
            >
              Find a tournament
              <span aria-hidden="true">↗</span>
            </Link>
          )
        }
      />

      {/* ACTION NOTICES */}
      {actionMessage && (
        <p
          className="inline-notice"
          role="status"
          style={{ margin: "1rem 0" }}
        >
          {actionMessage}
        </p>
      )}

      {/* USER PROFILE */}
      <section className="profile-strip">
        <div className="profile-initial">
          {(user.username || "P")
            .slice(0, 1)
            .toUpperCase()}
        </div>

        <div className="profile-id">
          <span className="eyebrow">
            ACCOUNT
          </span>

          <strong>{user.username}</strong>
          <span>{user.email}</span>
        </div>

        <div className="profile-role">
          <span>Account type</span>
          <strong>{user.role || "player"}</strong>
        </div>
      </section>

      {/* ORGANIZER TOURNAMENT LISTINGS */}
      {user.role === "organizer" && (
        <section className="content-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">
                <span className="eyebrow-line" />
                Organizer tools
              </p>

              <h2>Your tournament listings</h2>
            </div>

            <span className="section-count">
              {owned.length} events
            </span>
          </div>

          {owned.length === 0 ? (
            <FeedbackState
              title="Your first event starts here"
              action={
                <Link
                  className="button"
                  to="/tournaments?create=1"
                >
                  Create tournament
                </Link>
              }
            >
              Publish an event to make it visible
              on the board.
            </FeedbackState>
          ) : (
            <div className="tournament-list">
              {owned.map((tournament, index) => (
                <article
                  className="tournament-row"
                  key={tournament._id}
                >
                  <span className="row-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="tournament-row-main">
                    <span className="row-overline">
                      {tournament.game}
                      <span> · </span>
                      {tournament.status}
                    </span>

                    <h3>{tournament.name}</h3>

                    <TournamentMetrics
                      tournament={tournament}
                    />
                  </div>

                  <div className="tournament-row-date">
                    <span>Event date</span>
                    <strong>
                      {formatDate(tournament.date)}
                    </strong>
                  </div>

                  <button
                    className="button button-outline button-small"
                    style={{
                      color: "#ff4444",
                      borderColor: "#ff4444",
                    }}
                    disabled={Boolean(pendingAction)}
                    onClick={() =>
                      handleDelete(tournament._id)
                    }
                  >
                    {pendingAction === tournament._id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* REGISTERED TOURNAMENTS */}
      <section className="content-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-line" />
              YOUR ACTIVITY
            </p>

            <h2>Registered tournaments</h2>
          </div>

          <span className="section-count">
            {joined.length} entries
          </span>
        </div>

        {joined.length === 0 ? (
          <FeedbackState
            title="No registrations yet"
            action={
              <Link
                className="button"
                to="/tournaments"
              >
                Browse tournaments
              </Link>
            }
          >
            You haven't registered for any tournaments yet.
          </FeedbackState>
        ) : (
          <div className="tournament-list">
            {joined.map((tournament, index) => (
              <article
                className="tournament-row"
                key={tournament._id}
              >
                <span className="row-index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="tournament-row-main">
                  <span className="row-overline">
                    {tournament.game}
                    <span> · </span>
                    {tournament.status}
                  </span>

                  <h3>{tournament.name}</h3>

                  <TournamentMetrics
                    tournament={tournament}
                  />
                </div>

                <div className="tournament-row-date">
                  <span>Event date</span>
                  <strong>
                    {formatDate(tournament.date)}
                  </strong>
                </div>

                <button
                  className="button button-outline button-small"
                  disabled={Boolean(pendingAction)}
                  onClick={() =>
                    handleUnregister(tournament._id)
                  }
                >
                  {pendingAction === tournament._id
                    ? "Cancelling..."
                    : "Cancel Registration"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
