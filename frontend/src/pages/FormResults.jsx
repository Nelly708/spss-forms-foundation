import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import StatBar from "../components/StatBar.jsx";
import { useLanguage } from "../i18n.jsx";

function round(n) {
  return n === null || n === undefined ? "—" : Math.round(n * 100) / 100;
}

export default function FormResults() {
  const { id } = useParams();
  const { t, tn } = useLanguage();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getStats(id).then(setStats).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="container"><p style={{ color: "var(--danger)" }}>{error}</p></div>;
  if (!stats) return <div className="container"><p>{t("loading")}</p></div>;

  return (
    <div className="container">
      <div className="top-tabs">
        <Link to={`/forms/${id}/edit`}>{t("tabQuestions")}</Link>
        <span className="active" style={{ padding: "10px 16px" }}>{t("tabResponses")}</span>
        <Link to={`/forms/${id}/view`} target="_blank">{t("tabPreview")}</Link>
      </div>

      <div className="card header-card">
        <h2 style={{ margin: 0 }}>{stats.title}</h2>
        <p style={{ color: "var(--text-secondary)" }}>{tn("responsesCount", stats.totalResponses)}</p>
      </div>

      {stats.totalResponses === 0 && (
        <div className="card empty-state">{t("noResponsesYet")}</div>
      )}

      {stats.questions.map((q) => (
        <div className="card" key={q.questionId}>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{q.title}</div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 10 }}>
            {t("answeredSkipped", { answered: q.responseCount, skipped: q.skippedCount })}
          </div>

          {/* Numeric / scale questions */}
          {"mean" in q && (
            <div className="stat-grid">
              <div className="stat-tile"><div className="label">{t("mean")}</div><div className="value">{round(q.mean)}</div></div>
              <div className="stat-tile"><div className="label">{t("median")}</div><div className="value">{round(q.median)}</div></div>
              <div className="stat-tile"><div className="label">{t("mode")}</div><div className="value">{round(q.mode)}</div></div>
              <div className="stat-tile"><div className="label">{t("stdDev")}</div><div className="value">{round(q.stdDev)}</div></div>
              <div className="stat-tile"><div className="label">{t("min")}</div><div className="value">{round(q.min)}</div></div>
              <div className="stat-tile"><div className="label">{t("max")}</div><div className="value">{round(q.max)}</div></div>
            </div>
          )}

          {/* Matrix / grid (cross-tab) questions: one frequency table per row,
              or (for a row marked as free-text) sample answers instead */}
          {q.rows && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 16 }}>
              {q.rows.map((r) => (
                <div key={r.row}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{r.row}</div>
                  {r.freeText ? (
                    <div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                        {t("avgWordCount", { n: round(r.avgWordCount) })}
                      </div>
                      {r.sampleAnswers.map((a, i) => (
                        <div key={i} style={{ padding: "4px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none", fontSize: 13 }}>
                          {String(a)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    r.frequency.map((row) => (
                      <StatBar
                        key={row.value}
                        label={String(row.value)}
                        count={row.count}
                        percent={row.percent}
                        maxPercent={r.frequency[0]?.percent || 100}
                      />
                    ))
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Categorical questions */}
          {q.frequency && (
            <div style={{ marginTop: 10 }}>
              {q.frequency.map((row) => (
                <StatBar
                  key={row.value}
                  label={String(row.value)}
                  count={row.count}
                  percent={row.percent}
                  maxPercent={q.frequency[0]?.percent || 100}
                />
              ))}
            </div>
          )}

          {/* Date questions */}
          {"earliest" in q && (
            <div className="stat-grid">
              <div className="stat-tile"><div className="label">{t("earliest")}</div><div className="value" style={{ fontSize: 13 }}>{q.earliest ? new Date(q.earliest).toLocaleDateString() : "—"}</div></div>
              <div className="stat-tile"><div className="label">{t("latest")}</div><div className="value" style={{ fontSize: 13 }}>{q.latest ? new Date(q.latest).toLocaleDateString() : "—"}</div></div>
            </div>
          )}

          {/* Free text questions */}
          {q.sampleAnswers && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                {t("avgWordCount", { n: round(q.avgWordCount) })}
              </div>
              {q.sampleAnswers.map((a, i) => (
                <div key={i} style={{ padding: "8px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none", fontSize: 14 }}>
                  {String(a)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
