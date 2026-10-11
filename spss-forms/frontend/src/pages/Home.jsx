import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api.js";

export default function Home() {
  const [forms, setForms] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.listForms().then(setForms).catch((e) => setError(e.message));
  }, []);

  async function createForm() {
    const form = await api.createForm({ title: "Untitled form" });
    navigate(`/forms/${form.id}/edit`);
  }

  async function removeForm(id, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this form and all its responses?")) return;
    await api.deleteForm(id);
    setForms((f) => f.filter((x) => x.id !== id));
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>Your forms</h2>
        <button className="btn" onClick={createForm}>+ New form</button>
      </div>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      {!forms && !error && <p>Loading…</p>}

      {forms && forms.length === 0 && (
        <div className="card empty-state">
          <p>No forms yet. Create your first one to get started.</p>
        </div>
      )}

      {forms && forms.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {forms.map((f, i) => (
            <Link
              key={f.id}
              to={`/forms/${f.id}/edit`}
              className="form-list-item"
              style={{ borderBottom: i < forms.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{f.title}</div>
                <div className="meta">
                  {f.questionCount} question{f.questionCount === 1 ? "" : "s"} · {f.responseCount} response{f.responseCount === 1 ? "" : "s"}
                </div>
              </div>
              <button className="btn text" onClick={(e) => removeForm(f.id, e)}>Delete</button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
