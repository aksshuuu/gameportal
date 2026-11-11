function MatchCard({ match, onUpdateStatus }) {
  return (
    <div className="match-card">

      <div className="match-header">
        <span>{match.round}</span>
        <span className={`match-status ${match.status.toLowerCase()}`}>
          {match.status}
        </span>
      </div>

      <h2>{match.team1} <span>VS</span> {match.team2}</h2>

      <div className="match-details">
        <p>📅 {match.date}</p>
        <p>⏰ {match.time}</p>
        <p>🎮 {match.game}</p>
      </div>

      {match.status === "Upcoming" && (
        <button
          className="primary-btn full"
          onClick={() => onUpdateStatus(match.id)}
        >
          Start Match
        </button>
      )}

      {match.status === "Live" && (
        <button
          className="secondary-btn full"
          onClick={() => onUpdateStatus(match.id)}
        >
          Complete Match
        </button>
      )}

    </div>
  );
}

export default MatchCard;