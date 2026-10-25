import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";
import QuestionEditor from "../components/QuestionEditor.jsx";
import { blankQuestion, arrayMove } from "../questionTypes.js";
import { useLanguage } from "../i18n.jsx";

let idCounter = 0;
function tempId() {
  idCounter += 1;
  return `tmp_${Date.now()}_${idCounter}`;
}

export default function FormBuilder() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [form, setForm] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    api.getForm(id).then((f) => {
      setForm(f);
      setQuestions(f.questions.length ? f.questions : [blankQuestion(tempId())]);
    });
  }, [id]);

  const persistTitle = useCallback(
    (patch) => {
      setForm((f) => ({ ...f, ...patch }));
      api.updateForm(id, patch);
    },
    [id]
  );

  function updateQuestion(qid, updated) {
    setQuestions((qs) => qs.map((q) => (q.id === qid ? updated : q)));
  }

  function addQuestion() {
    const q = blankQuestion(tempId());
    setQuestions((qs) => [...qs, q]);
    setFocusedId(q.id);
  }

  function duplicateQuestion(qid) {
    setQuestions((qs) => {
      const idx = qs.findIndex((q) => q.id === qid);
      const copy = { ...qs[idx], id: tempId() };
      return [...qs.slice(0, idx + 1), copy, ...qs.slice(idx + 1)];
    });
  }

  function deleteQuestion(qid) {
    setQuestions((qs) => qs.filter((q) => q.id !== qid));
  }

  function moveQuestion(index, direction) {
    setQuestions((qs) => arrayMove(qs, index, index + direction));
  }

  async function saveAll() {
    setSaving(true);
    try {
      const updated = await api.saveQuestions(id, questions);
      setQuestions(updated.questions);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <div className="container"><p>{t("loading")}</p></div>;

  return (
    <div className="container">
      <div className="top-tabs">
        <span className="active" style={{ padding: "10px 16px" }}>{t("tabQuestions")}</span>
        <Link to={`/forms/${id}/results`}>{t("tabResponses")}</Link>
        <Link to={`/forms/${id}/view`} target="_blank">{t("tabPreview")}</Link>
      </div>

      <div className="card header-card">
        <input
          className="title-input"
          type="text"
          placeholder={t("untitledForm")}
          value={form.title}
          onChange={(e) => persistTitle({ title: e.target.value })}
        />
        <input
          type="text"
          placeholder={t("formDescriptionPlaceholder")}
          value={form.description}
          onChange={(e) => persistTitle({ description: e.target.value })}
          style={{ marginTop: 10 }}
        />
      </div>

      {questions.map((q, index) => (
        <QuestionEditor
          key={q.id}
          question={q}
          focused={focusedId === q.id}
          onFocus={() => setFocusedId(q.id)}
          onChange={(updated) => updateQuestion(q.id, updated)}
          onDuplicate={() => duplicateQuestion(q.id)}
          onDelete={() => deleteQuestion(q.id)}
          onMoveUp={() => moveQuestion(index, -1)}
          onMoveDown={() => moveQuestion(index, 1)}
          isFirst={index === 0}
          isLast={index === questions.length - 1}
        />
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
        <button className="btn secondary" onClick={addQuestion}>{t("addQuestion")}</button>
        <button className="btn" onClick={saveAll} disabled={saving}>
          {saving ? t("saving") : t("saveForm")}
        </button>
        {savedAt && !saving && (
          <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            {t("savedAt", { time: savedAt.toLocaleTimeString() })}
          </span>
        )}
      </div>
    </div>
  );
}
