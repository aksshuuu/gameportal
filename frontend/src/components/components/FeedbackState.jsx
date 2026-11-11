export default function FeedbackState({ title, children, action, tone = "neutral" }) {
  return (
    <section className={`feedback-state feedback-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <span className="feedback-mark" aria-hidden="true">{tone === "error" ? "!" : "—"}</span>
      <div>
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {action && <div className="feedback-action">{action}</div>}
    </section>
  );
}
