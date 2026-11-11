import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import FeedbackState from "../components/FeedbackState";

export default function Teams() {
  return (
    <div className="content-width page-content">
      <PageHeader eyebrow="PLAYER SQUADS" title="Find your people." description="A home for the players you want beside you in the next round." />
      <section className="team-intro">
        <div className="team-monogram" aria-hidden="true">T</div>
        <div>
          <p className="eyebrow">TEAM ROSTERS</p>
          <h2>Squad management is on the way.</h2>
          <p>Teams and rosters are not currently stored in GamePortal. We won't show example squads as if they were real. You can still find current events and register your player account for a tournament.</p>
          <Link className="button button-outline" to="/tournaments">Browse tournaments <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
      <FeedbackState title="No saved teams to show">Team creation, roster invitations and membership need a saved team service before those actions can be offered here.</FeedbackState>
    </div>
  );
}
