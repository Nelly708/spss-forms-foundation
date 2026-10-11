import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import QuestionRenderer from "../components/QuestionRenderer.jsx";

export default function FormViewer() {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getForm(id).then(setForm).catch((e) => setError(e.message));
  }, [id]);

  function setAnswer(qid, value) {
    setAnswers((a) => ({ ...a, [qid]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const payload = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
    try {
      await api.submitResponse(id, payload);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!form) return <div className="container"><p>Loading…</p></div>;

  if (submitted) {
    return (
      <div className="container">
        <div className="card header-card" style={{ textAlign: "center" }}>
          <h2>Response recorded</h2>
          <p>Thanks for filling out "{form.title}".</p>
        </div>
      </div>
    );
  }

  return (
    <form className="container" onSubmit={submit}>
      <div className="card header-card">
        <h2 style={{ margin: 0 }}>{form.title}</h2>
        {form.description && <p style={{ color: "var(--text-secondary)" }}>{form.description}</p>}
      </div>

      {form.questions.map((q) => (
        <div className="card" key={q.id}>
          {q.config?.imageUrl && (
            <img
              src={q.config.imageUrl}
              alt=""
              style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 6, display: "block", marginBottom: 12 }}
            />
          )}
          <div style={{ fontWeight: 500, marginBottom: 4, fontFamily: q.config?.titleFont || "inherit" }}>
            {q.title} {q.required && <span style={{ color: "var(--danger)" }}>*</span>}
          </div>
          {q.description && (
            <div
              style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 10, fontFamily: q.config?.descriptionFont || "inherit" }}
            >
              {q.description}
            </div>
          )}
          <QuestionRenderer
            question={q}
            value={answers[q.id]}
            onChange={(v) => setAnswer(q.id, v)}
          />
        </div>
      ))}

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <button className="btn" type="submit">Submit</button>
    </form>
  );
}
