import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import FeedbackState from "../components/FeedbackState";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date pending"
    : new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
};
const prizeLabel = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(value ?? 0);
const TournamentMetrics = ({ tournament }) => (
  <div className="home-tournament-meta dashboard-tournament-meta">
    <span><small>Prize</small><strong>{prizeLabel(tournament.prize)}</strong></span>
    <span><small>Entrants</small><strong>{tournament.registeredCount ?? tournament.registeredPlayers?.length ?? 0} / {tournament.maxPlayers ?? "Open"}</strong></span>
    <span><small>Team size</small><strong>{tournament.playersPerTeam ? `${tournament.playersPerTeam} players` : "Not set"}</strong></span>
  </div>
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [joined, setJoined] = useState([]);
  const [owned, setOwned] = useState([]);
  const [state, setState] = useState(() => localStorage.getItem("token") ? "loading" : "signed-out");

  const load = () => {
    if (!localStorage.getItem("token")) return;
    Promise.all([api.get("/auth/me"), api.get("/tournaments")])
      .then(([profile, response]) => {
        const currentUser = profile.data;
        const tournaments = Array.isArray(response.data) ? response.data : [];
        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
        setOwned(tournaments.filter((tournament) =>
          String(tournament.organizer?._id || tournament.organizer || "") === String(currentUser._id)
        ));
        setJoined(tournaments.filter((tournament) =>
          tournament.registeredPlayers?.some((player) =>
            String(player?._id || player) === String(currentUser._id)
          )
        ));
        setState("ready");
      })
      .catch(() => setState("error"));
  };

  useEffect(() => { load(); }, []);
  const retryLoad = () => {
    setState("loading");
    load();
  };

  if (state === "loading") {
    return <div className="content-width page-content"><PageHeader eyebrow="PLAYER SPACE" title="Your dashboard" description="A clear view of your GamePortal activity." /><FeedbackState title="Loading your dashboard">Getting your account and tournament details.</FeedbackState></div>;
  }
  if (state === "signed-out") {
    return (
      <div className="content-width page-content">
        <PageHeader eyebrow="PLAYER SPACE" title="Your dashboard" description="Your competitions, team and account — together." />
        <FeedbackState title="Sign in to see your player space" action={<Link className="button" to="/login">Sign in</Link>}>
          Your tournament registrations are tied to your account.
        </FeedbackState>
        <div className="next-steps-panel">
          <p className="eyebrow">GET STARTED</p>
          <h2>Your next move</h2>
          <div className="next-step-links">
            <Link to="/tournaments"><span>01</span><strong>Browse current tournaments</strong><i aria-hidden="true">↗</i></Link>
            <Link to="/teams"><span>02</span><strong>Explore the team space</strong><i aria-hidden="true">↗</i></Link>
          </div>
        </div>
      </div>
    );
  }
  if (state === "error") {
    return <div className="content-width page-content"><PageHeader eyebrow="PLAYER SPACE" title="Your dashboard" description="A clear view of your GamePortal activity." /><FeedbackState title="We couldn't load your account" tone="error" action={<button className="button button-outline" onClick={retryLoad}>Try again</button>}>Check your connection and sign in again if needed.</FeedbackState></div>;
  }

  return (
    <div className="content-width page-content">
      <PageHeader
        eyebrow={user?.role === "organizer" ? "ORGANIZER WORKSPACE" : "PLAYER SPACE"}
        title={`Good to see you, ${user?.username || "player"}.`}
        description={user?.role === "organizer" ? "Your tournament listings and player activity, together." : "Your competitions and account details, without the noise."}
        actions={user?.role === "organizer"
          ? <Link className="button" to="/tournaments?create=1">＋ Create tournament</Link>
          : <Link className="button button-outline" to="/tournaments">Find a tournament <span aria-hidden="true">↗</span></Link>}
      />
      <section className="profile-strip">
        <div className="profile-initial">{(user?.username || "P").slice(0, 1).toUpperCase()}</div>
        <div className="profile-id">
          <span className="eyebrow">PLAYER ACCOUNT</span>
          <strong>{user?.username}</strong>
          <span>{user?.email}</span>
        </div>
        <div className="profile-role">
          <span>Account type</span>
          <strong>{user?.role || "Player"}</strong>
        </div>
        <Link className="text-link profile-link" to="/teams">Explore teams <span aria-hidden="true">→</span></Link>
      </section>

      <section className="content-section">
        {user?.role === "organizer" && (
          <>
            <div className="section-title-row">
              <div><p className="eyebrow"><span className="eyebrow-line" /> Organizer tools</p><h2>Your tournament listings</h2></div>
              <span className="section-count">{owned.length} {owned.length === 1 ? "event" : "events"}</span>
            </div>
            {owned.length === 0 ? (
              <FeedbackState title="Your first event starts here" action={<Link className="button" to="/tournaments?create=1">Create tournament</Link>}>
                Publish an event to make it visible on the tournament board. Creation is available to organizer accounts only.
              </FeedbackState>
            ) : (
              <div className="tournament-list">
                {owned.map((tournament, index) => (
                  <article className="tournament-row" key={tournament._id}>
                    <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
                    <div className="tournament-row-main"><span className="row-overline">{tournament.game} <span>·</span> {tournament.status}</span><h3>{tournament.name}</h3><TournamentMetrics tournament={tournament} /></div>
                    <div className="tournament-row-date"><span>Event date</span><strong>{formatDate(tournament.date)}</strong></div>
                    <Link className="row-arrow" to="/tournaments" aria-label={`View ${tournament.name}`}>↗</Link>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section className="content-section">
        <div className="section-title-row">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> {user?.role === "organizer" ? "PLAYER ACTIVITY" : "YOUR ACTIVITY"}</p>
            <h2>{user?.role === "organizer" ? "Tournaments you joined" : "Registered tournaments"}</h2>
          </div>
          <span className="section-count">{joined.length} {joined.length === 1 ? "entry" : "entries"}</span>
        </div>
        {joined.length === 0 ? (
          <>
            <FeedbackState
              title="Your next tournament starts here"
              action={<Link className="button" to="/tournaments">Browse tournaments</Link>}
            >
              You haven't registered for any tournaments yet. Find an event that fits your game.
            </FeedbackState>
            <div className="next-steps-panel">
              <p className="eyebrow">A GOOD PLACE TO START</p>
              <div className="next-step-links">
                <Link to="/tournaments"><span>01</span><strong>Review open tournament listings</strong><i aria-hidden="true">↗</i></Link>
                <Link to="/teams"><span>02</span><strong>Explore teams and squad options</strong><i aria-hidden="true">↗</i></Link>
                <Link to="/matches"><span>03</span><strong>Check published event dates</strong><i aria-hidden="true">↗</i></Link>
              </div>
            </div>
          </>
        ) : (
          <div className="tournament-list">
            {joined.map((tournament, index) => (
              <article className="tournament-row" key={tournament._id}>
                <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="tournament-row-main">
                  <span className="row-overline">{tournament.game} <span>·</span> {tournament.status}</span>
                  <h3>{tournament.name}</h3>
                  <TournamentMetrics tournament={tournament} />
                </div>
                <div className="tournament-row-date"><span>Event date</span><strong>{formatDate(tournament.date)}</strong></div>
                <span className="status-label">Registered</span>
              </article>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
