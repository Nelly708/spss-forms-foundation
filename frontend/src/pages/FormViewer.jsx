import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import QuestionRenderer from "../components/QuestionRenderer.jsx";
import { useLanguage } from "../i18n.jsx";

function questionQualifies(question, value) {
  const qualifying = question.config?.qualifyingOptions || [];
  if (Array.isArray(value)) return value.some((v) => qualifying.includes(v));
  return qualifying.includes(value);
}

export default function FormViewer() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  // "filter" (screening step first) | "form" (full form) | "disqualified"
  const [stage, setStage] = useState("form");
  const [disqualifyMessage, setDisqualifyMessage] = useState("");

  useEffect(() => {
    api.getForm(id).then((f) => {
      setForm(f);
      const hasFilters = f.questions.some((q) => q.config?.isFilter);
      setStage(hasFilters ? "filter" : "form");
    }).catch((e) => setError(e.message));
  }, [id]);

  const filterQuestions = useMemo(
    () => (form ? form.questions.filter((q) => q.config?.isFilter) : []),
    [form]
  );

  function setAnswer(qid, value) {
    setAnswers((a) => ({ ...a, [qid]: value }));
  }

  function continueFromFilter(e) {
    e.preventDefault();
    for (const q of filterQuestions) {
      if (!questionQualifies(q, answers[q.id])) {
        setDisqualifyMessage(q.config?.disqualifyMessage || t("filterDefaultDisqualifyMessage"));
        setStage("disqualified");
        return;
      }
    }
    setStage("form");
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

  if (!form) return <div className="container"><p>{t("loading")}</p></div>;

  if (submitted) {
    return (
      <div className="container">
        <div className="card header-card" style={{ textAlign: "center" }}>
          <h2>{t("responseRecorded")}</h2>
          <p>{t("thanksForFilling", { title: form.title })}</p>
        </div>
      </div>
    );
  }

  if (stage === "disqualified") {
    return (
      <div className="container">
        <div className="card header-card" style={{ textAlign: "center" }}>
          <p>{disqualifyMessage}</p>
        </div>
      </div>
    );
  }

  function renderQuestionCard(q) {
    return (
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
    );
  }

  if (stage === "filter") {
    return (
      <form className="container" onSubmit={continueFromFilter}>
        <div className="card header-card">
          <h2 style={{ margin: 0 }}>{form.title}</h2>
        </div>
        {filterQuestions.map(renderQuestionCard)}
        <button className="btn" type="submit">{t("filterContinueButton")}</button>
      </form>
    );
  }

  return (
    <form className="container" onSubmit={submit}>
      <div className="card header-card">
        <h2 style={{ margin: 0 }}>{form.title}</h2>
        {form.description && <p style={{ color: "var(--text-secondary)" }}>{form.description}</p>}
      </div>

      {form.questions.map(renderQuestionCard)}

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <button className="btn" type="submit">{t("submit")}</button>
    </form>
  );
}
