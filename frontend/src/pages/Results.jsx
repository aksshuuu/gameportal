import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import FeedbackState from "../components/FeedbackState";

export default function Results() {
  return (
    <div className="content-width page-content">
      <PageHeader eyebrow="OFFICIAL MATCH RECORD" title="Results, recorded." description="Scores and outcomes belong to the people who played them. This portal doesn't store individual match results yet." actions={<Link className="button button-outline" to="/matches">View event dates <span aria-hidden="true">↗</span></Link>} />
      <section className="content-section">
        <div className="section-title-row"><div><p className="eyebrow"><span className="eyebrow-line" /> Final scores</p><h2>Recent results</h2></div></div>
        <FeedbackState title="No official results available">
          Result entry and verification aren't connected to a saved match record yet. No sample scores are shown.
        </FeedbackState>
      </section>
    </div>
  );
}
