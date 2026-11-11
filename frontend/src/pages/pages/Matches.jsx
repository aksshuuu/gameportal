import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import PageHeader from "../components/PageHeader";
import FeedbackState from "../components/FeedbackState";

const dateLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date pending" : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export default function Matches() {
  const [tournaments, setTournaments] = useState([]);
  const [state, setState] = useState("loading");

  const load = () => {
    api.get("/tournaments")
      .then(({ data }) => {
        setTournaments(Array.isArray(data) ? data : []);
        setState("ready");
      })
      .catch(() => setState("error"));
  };

  useEffect(() => { load(); }, []);
  const retryLoad = () => {
    setState("loading");
    load();
  };

  return (
    <div className="content-width page-content">
      <PageHeader eyebrow="SCHEDULE & LIVE PLAY" title="The match board." description="Tournament start dates are shown below. Individual match fixtures and live scores are not stored yet." actions={<Link className="button button-outline" to="/tournaments">Tournament listings <span aria-hidden="true">↗</span></Link>} />
      <section className="content-section">
        <div className="section-title-row"><div><p className="eyebrow"><span className="eyebrow-line" /> Event calendar</p><h2>Tournament dates</h2></div></div>
        {state === "loading" && <FeedbackState title="Loading tournament dates">Checking current listings.</FeedbackState>}
        {state === "error" && <FeedbackState title="Couldn't load tournament dates" tone="error" action={<button className="button button-outline" onClick={retryLoad}>Try again</button>}>Please retry in a moment.</FeedbackState>}
        {state === "ready" && tournaments.length === 0 && <FeedbackState title="No tournament dates published">When an organizer lists an event, its start date appears here.</FeedbackState>}
        {state === "ready" && tournaments.length > 0 && (
          <>
            <p className="data-disclaimer">These are event start dates, not individual match times or fixtures.</p>
            <div className="tournament-list">
              {tournaments.map((tournament, index) => (
                <article className="tournament-row" key={tournament._id}>
                  <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="tournament-row-main"><span className="row-overline">{tournament.game} <span>·</span> {tournament.status}</span><h3>{tournament.name}</h3></div>
                  <div className="tournament-row-date"><span>Event begins</span><strong>{dateLabel(tournament.date)}</strong></div>
                  <Link className="row-arrow" to="/tournaments" aria-label={`View ${tournament.name}`}>↗</Link>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
