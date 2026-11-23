
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import PageHeader from "../components/PageHeader";
import FeedbackState from "../components/FeedbackState";

// Format tournament dates in Indian Standard Time
const dateLabel = (value) => {
  if (!value) {
    return "Date pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date pending";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
};

export default function Matches() {
  const [tournaments, setTournaments] = useState([]);
  const [state, setState] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch tournaments from Render / MongoDB
  const load = useCallback(async (signal) => {
    setState("loading");
    setErrorMessage("");

    try {
      const response = await api.get("/tournaments", {
        signal,
      });

      const data = response.data;

      if (!Array.isArray(data)) {
        throw new Error("Invalid tournament response");
      }

      // Sort tournaments by date
      const sortedTournaments = [...data].sort(
        (a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();

          const validA = Number.isNaN(dateA)
            ? Infinity
            : dateA;

          const validB = Number.isNaN(dateB)
            ? Infinity
            : dateB;

          return validA - validB;
        }
      );

      if (signal?.aborted) return;

      setTournaments(sortedTournaments);
      setState("ready");

    } catch (error) {
      if (
        signal?.aborted ||
        error.code === "ERR_CANCELED"
      ) {
        return;
      }

      console.error(
        "Tournament dates loading error:",
        error
      );

      if (error.response?.status === 500) {
        setErrorMessage(
          "The tournament server encountered an error. Check Render logs."
        );
      } else if (error.code === "ECONNABORTED") {
        setErrorMessage(
          "The server took too long to respond. Please try again."
        );
      } else if (
        error.code === "ERR_NETWORK" ||
        error.message === "Network Error"
      ) {
        setErrorMessage(
          "Cannot connect to the tournament server. Check the backend connection."
        );
      } else {
        setErrorMessage(
          error.response?.data?.message ||
          "Could not load tournament dates. Please try again."
        );
      }

      setState("error");
    }
  }, []);

  // Load automatically when the page opens
  useEffect(() => {
    const controller = new AbortController();

    load(controller.signal);

    return () => {
      controller.abort();
    };
  }, [load]);

  // Retry button
  const retryLoad = () => {
    load();
  };

  return (
    <div className="content-width page-content">

      <PageHeader
        eyebrow="SCHEDULE & LIVE PLAY"
        title="The match board."
        description="Tournament start dates are shown below. Individual match fixtures and live scores are not stored yet."
        actions={
          <Link
            className="button button-outline"
            to="/tournaments"
          >
            Tournament listings
            <span aria-hidden="true">↗</span>
          </Link>
        }
      />

      <section className="content-section">

        <div className="section-title-row">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-line" />
              Event calendar
            </p>

            <h2>Tournament dates</h2>
          </div>
        </div>

        {/* LOADING */}
        {state === "loading" && (
          <FeedbackState title="Loading tournament dates">
            Checking current listings.
          </FeedbackState>
        )}

        {/* ERROR */}
        {state === "error" && (
          <FeedbackState
            title="Couldn't load tournament dates"
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
            {errorMessage}
          </FeedbackState>
        )}

        {/* EMPTY */}
        {state === "ready" &&
          tournaments.length === 0 && (
            <FeedbackState title="No tournament dates published">
              When an organizer lists an event,
              its start date appears here.
            </FeedbackState>
          )}

        {/* TOURNAMENT LIST */}
        {state === "ready" &&
          tournaments.length > 0 && (
            <>
              <p className="data-disclaimer">
                These are event start dates,
                not individual match times or fixtures.
              </p>

              <div className="tournament-list">
                {tournaments.map(
                  (tournament, index) => (
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
                          {tournament.status || "UPCOMING"}
                        </span>

                        <h3>{tournament.name}</h3>
                      </div>

                      <div className="tournament-row-date">
                        <span>Event begins</span>

                        <strong>
                          {dateLabel(tournament.date)}
                        </strong>
                      </div>

                      <Link
                        className="row-arrow"
                        to="/tournaments"
                        aria-label={`View ${tournament.name}`}
                      >
                        ↗
                      </Link>
                    </article>
                  )
                )}
              </div>
            </>
          )}
      </section>
    </div>
  );
}
