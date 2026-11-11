import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import FeedbackState from "../components/FeedbackState";

export default function Leaderboard() {
  return (
    <div className="content-width page-content">
      <PageHeader eyebrow="COMPETITIVE STANDINGS" title="The leaderboard." description="Rankings should reflect real games and verified outcomes — never placeholder numbers." />
      <section className="content-section">
        <div className="section-title-row"><div><p className="eyebrow"><span className="eyebrow-line" /> Match record</p><h2>Team standings</h2></div></div>
        <FeedbackState title="Standings are not available yet">
          Team results aren't stored in GamePortal, so there is no verified record to rank. <Link className="inline-text-link" to="/tournaments">Browse real tournaments</Link> instead.
        </FeedbackState>
      </section>
    </div>
  );
}
