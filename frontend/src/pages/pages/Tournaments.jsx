import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import FeedbackState from "../components/FeedbackState";

const dateLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date to be announced"
    : new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(date);
};

const initialForm = { name: "", game: "", description: "", date: "", prize: "10000", maxPlayers: "40", playersPerTeam: "5" };

export default function Tournaments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tournaments, setTournaments] = useState([]);
  const [user, setUser] = useState(null);
  const [state, setState] = useState("loading");
  const [filter, setFilter] = useState("All games");
  const [pendingId, setPendingId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(() => searchParams.get("create") === "1");
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);

  const load = () => {
    const profileRequest = localStorage.getItem("token") ? api.get("/auth/me") : Promise.resolve({ data: null });
    const optionalProfile = profileRequest.catch((requestError) => {
      if (requestError.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      return { data: null };
    });
    Promise.all([api.get("/tournaments"), optionalProfile])
      .then(([response, profile]) => {
        setTournaments(Array.isArray(response.data) ? response.data : []);
        setUser(profile.data);
        setState("ready");
      })
      .catch(() => setState("error"));
  };

  useEffect(() => { load(); }, []);
  const retryLoad = () => {
    setState("loading");
    load();
  };

  const games = useMemo(() => ["All games", ...new Set(tournaments.map(({ game }) => game).filter(Boolean))], [tournaments]);
  const visibleTournaments = filter === "All games"
    ? tournaments
    : tournaments.filter((tournament) => tournament.game === filter);

  const joinTournament = async (id) => {
    if (!user) return;
    setPendingId(id);
    setError("");
    setNotice("");
    try {
      const { data } = await api.post(`/tournaments/${id}/register`);
      setTournaments((current) => current.map((item) => item._id === id ? data.tournament : item));
      setNotice("You're registered. The tournament is now listed in your dashboard.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setPendingId("");
    }
  };

  const createTournament = async (event) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    setNotice("");
    try {
      const { data } = await api.post("/tournaments", {
        ...form,
        prize: Number(form.prize),
        maxPlayers: Number(form.maxPlayers),
        playersPerTeam: Number(form.playersPerTeam),
      });
      setTournaments((current) => [data.tournament, ...current]);
      setForm(initialForm);
      setShowForm(false);
      setNotice("Tournament published.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not publish tournament.");
    } finally {
      setCreating(false);
    }
  };

  const isRegistered = (tournament) =>
    Boolean(user && tournament.registeredPlayers?.some((player) =>
      String(player?._id || player) === String(user._id)
    ));

  return (
    <div className="content-width page-content">
      <PageHeader
        eyebrow="THE OPEN CIRCUIT"
        title="Find your next game."
        description="Community events and their current entry details, in one place."
        actions={user?.role === "organizer" ? (
          <button className="button" onClick={() => {
            const next = !showForm;
            setShowForm(next);
            setSearchParams(next ? { create: "1" } : {});
          }}>
            {showForm ? "Close form" : "＋ Create tournament"}
          </button>
        ) : null}
      />

      {showForm && user?.role === "organizer" && (
        <form className="data-form create-tournament-form" onSubmit={createTournament}>
          <div className="form-heading"><div><p className="eyebrow">ORGANIZER TOOLS</p><h2>Publish an event</h2></div></div>
          <div className="form-grid">
            <label>Event name<input name="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength="80" required /></label>
            <label>Game<input name="game" value={form.game} onChange={(event) => setForm({ ...form, game: event.target.value })} maxLength="40" required /></label>
            <label>Start date<input type="datetime-local" name="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label>
            <label>Prize pool (₹)<input type="number" min="0" step="1" name="prize" value={form.prize} onChange={(event) => setForm({ ...form, prize: event.target.value })} /></label>
            <label>Entrant capacity<input type="number" min="2" max="10000" name="maxPlayers" value={form.maxPlayers} onChange={(event) => setForm({ ...form, maxPlayers: event.target.value })} required /></label>
            <label>Players per team<input type="number" min="1" max="20" name="playersPerTeam" value={form.playersPerTeam} onChange={(event) => setForm({ ...form, playersPerTeam: event.target.value })} required /></label>
            <label className="form-wide">Description<textarea name="description" rows="3" maxLength="500" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          </div>
          <button className="button" type="submit" disabled={creating}>{creating ? "Publishing…" : "Publish tournament"}</button>
        </form>
      )}

      {notice && <p className="inline-notice" role="status">{notice}</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}

      <section className="content-section">
        <div className="section-title-row list-toolbar">
          <div><p className="eyebrow"><span className="eyebrow-line" /> Tournament board</p><h2>All listings</h2></div>
          {state === "ready" && tournaments.length > 0 && (
            <label className="filter-label">Filter by game
              <select value={filter} onChange={(event) => setFilter(event.target.value)}>{games.map((game) => <option key={game}>{game}</option>)}</select>
            </label>
          )}
        </div>
        {state === "loading" && <FeedbackState title="Loading the tournament board">Fetching current listings.</FeedbackState>}
        {state === "error" && <FeedbackState title="Couldn't load tournaments" tone="error" action={<button className="button button-outline" onClick={retryLoad}>Try again</button>}>Your existing registrations remain safe. Please retry in a moment.</FeedbackState>}
        {state === "ready" && tournaments.length === 0 && (
          <>
            <FeedbackState title="No tournaments listed yet">
              There are no published events to join right now. Listings appear here after an authorized organizer creates one.
            </FeedbackState>
            <div className="next-steps-panel tournament-empty-next">
              <p className="eyebrow">WHILE YOU WAIT</p>
              <h2>Keep your next match in sight.</h2>
              <div className="next-step-links">
                <Link to={user ? "/dashboard" : "/register"}><span>01</span><strong>{user ? "Open your player dashboard" : "Create a player account"}</strong><i aria-hidden="true">↗</i></Link>
                <Link to="/teams"><span>02</span><strong>Explore the team space</strong><i aria-hidden="true">↗</i></Link>
                <Link to="/matches"><span>03</span><strong>Review published event dates</strong><i aria-hidden="true">↗</i></Link>
              </div>
            </div>
          </>
        )}
        {state === "ready" && tournaments.length > 0 && visibleTournaments.length === 0 && <FeedbackState title={`No ${filter} events`}>Choose another game to see more listings.</FeedbackState>}
        {state === "ready" && visibleTournaments.length > 0 && (
          <div className="tournament-list">
            {visibleTournaments.map((tournament, index) => {
              const registered = isRegistered(tournament);
              const full = (tournament.registeredPlayers?.length || 0) >= (tournament.maxPlayers || Infinity);
              return (
                <article className="tournament-row tournament-full-row" key={tournament._id}>
                  <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="tournament-row-main">
                    <span className="row-overline">{tournament.game} <span>·</span> {tournament.status}</span>
                    <h3>{tournament.name}</h3>
                    {tournament.description && <p className="tournament-description">{tournament.description}</p>}
                  </div>
                  <div className="tournament-meta">
                    <div><span>Scheduled</span><strong>{dateLabel(tournament.date)}</strong></div>
                    <div><span>Prize pool</span><strong>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(tournament.prize ?? 0)}</strong></div>
                    <div><span>Entrants</span><strong>{tournament.registeredCount ?? tournament.registeredPlayers?.length ?? 0} / {tournament.maxPlayers ?? "Open"}</strong></div>
                    <div><span>Team size</span><strong>{tournament.playersPerTeam ? `${tournament.playersPerTeam} players` : "Not set"}</strong></div>
                  </div>
                  <div className="tournament-join">
                    {registered ? <span className="status-label">Registered</span>
                      : !user ? <Link className="button button-outline button-small" to="/login">Sign in to join</Link>
                        : <button className="button button-outline button-small" onClick={() => joinTournament(tournament._id)} disabled={pendingId === tournament._id || full || tournament.status !== "UPCOMING"}>
                          {pendingId === tournament._id ? "Joining…" : full ? "Full" : tournament.status !== "UPCOMING" ? "Closed" : "Register"}
                        </button>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
