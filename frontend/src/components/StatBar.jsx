export default function StatBar({ label, count, percent, maxPercent }) {
  const width = maxPercent ? (percent / maxPercent) * 100 : percent;
  return (
    <div className="stat-bar-row">
      <div className="stat-bar-label" title={label}>{label}</div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${width}%` }} />
      </div>
      <div className="stat-bar-value">{count} ({percent}%)</div>
    </div>
  );
}
