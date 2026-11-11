import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import FeedbackState from "../components/FeedbackState";

const dateLabel = (value) => {
  if (!value) return "Date not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date not set"
    : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
};
const prizeLabel = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(value ?? 0);

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [state, setState] = useState("loading");

  const loadTournaments = () => {
    api.get("/tournaments")
      .then(({ data }) => {
        setTournaments(Array.isArray(data) ? data : []);
        setState("ready");
      })
      .catch(() => setState("error"));
  };

  useEffect(() => { loadTournaments(); }, []);
  const retryLoad = () => {
    setState("loading");
    loadTournaments();
  };

  return (
    <div className="home-page content-width">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> A place to compete</p>
          <h1>Play with<br /><span>purpose.</span></h1>
          <p className="hero-summary">
            Find your next tournament, gather your squad and follow every result — all in one place.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/tournaments">Explore tournaments <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" to="/teams">Find your team <span aria-hidden="true">→</span></Link>
          </div>
          <div className="hero-note">
            <span className="note-number">01</span>
            <span>Built for players. Ready for the next match.</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-grid" />
          <div className="art-ring art-ring-one" />
          <div className="art-ring art-ring-two" />
          <div className="art-center" />
          <div className="art-label art-label-top">GAME / COMMUNITY</div>
          <div className="art-label art-label-bottom">EST. FOR THE NEXT ROUND</div>
          <span className="art-index">G—01</span>
        </div>
      </section>

      <section className="home-data-section" aria-labelledby="tournament-preview-heading">
        <div className="section-title-row">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> The open circuit</p>
            <h2 id="tournament-preview-heading">Tournaments</h2>
          </div>
          <Link className="text-link" to="/tournaments">All tournaments <span aria-hidden="true">→</span></Link>
        </div>

        {state === "loading" && <FeedbackState title="Checking the tournament board">Loading current listings.</FeedbackState>}
        {state === "error" && (
          <FeedbackState
            title="Tournament listings are unavailable"
            tone="error"
            action={<button className="button button-outline" onClick={retryLoad}>Try again</button>}
          >
            Check back in a moment, or browse the rest of the portal.
          </FeedbackState>
        )}
        {state === "ready" && tournaments.length === 0 && (
          <FeedbackState
            title="No tournaments listed yet"
            action={<Link className="button button-outline" to="/tournaments">View tournament board</Link>}
          >
            When an organizer publishes an event, it will appear here.
          </FeedbackState>
        )}
        {state === "ready" && tournaments.length > 0 && (
          <div className="tournament-list home-tournament-list">
            {tournaments.slice(0, 3).map((tournament, index) => (
              <article className="tournament-row" key={tournament._id}>
                <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="tournament-row-main">
                  <span className="row-overline">{tournament.game || "Game"} <span>·</span> {tournament.status || "Listed"}</span>
                  <h3>{tournament.name}</h3>
                  <div className="home-tournament-meta" aria-label="Tournament details">
                    <span><small>Prize</small><strong>{prizeLabel(tournament.prize)}</strong></span>
                    <span><small>Entrants</small><strong>{tournament.registeredCount ?? tournament.registeredPlayers?.length ?? 0} / {tournament.maxPlayers ?? "Open"}</strong></span>
                    <span><small>Team size</small><strong>{tournament.playersPerTeam ? `${tournament.playersPerTeam} players` : "Not set"}</strong></span>
                  </div>
                </div>
                <div className="tournament-row-date">
                  <span>Event date</span>
                  <strong>{dateLabel(tournament.date)}</strong>
                </div>
                <Link className="row-arrow" to="/tournaments" aria-label={`View ${tournament.name}`}>↗</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="portal-guide">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> Find your next move</p>
          <h2>More than the<br />next queue.</h2>
        </div>
        <div className="guide-links">
          <Link to="/teams"><span>01</span><strong>Build a team</strong><i aria-hidden="true">↗</i></Link>
          <Link to="/matches"><span>02</span><strong>Follow match schedules</strong><i aria-hidden="true">↗</i></Link>
          <Link to="/leaderboard"><span>03</span><strong>See the standings</strong><i aria-hidden="true">↗</i></Link>
        </div>
      </section>
    </div>
  );
}
