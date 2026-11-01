import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import QuestionRenderer from "../components/QuestionRenderer.jsx";
import { useLanguage } from "../i18n.jsx";
import {
  computeVisibility, isAnswered, isFilterQuestion, isInvalidNumber,
  numberErrorText, formatTime,
} from "../questionLogic.js";

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
  const [submittedByTimer, setSubmittedByTimer] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({}); // { [questionId]: message }
  const [formError, setFormError] = useState("");
  // "filter" (screening step) -> "intro" (timer start screen) -> "form" | "disqualified"
  const [stage, setStage] = useState("form");
  const [disqualifyMessage, setDisqualifyMessage] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(null);
  const autoSubmitted = useRef(false);

  const settings = form?.settings || {};
  const timeLimitMinutes = Number(settings.timeLimitMinutes) || 0;
  const timeLimitSec = timeLimitMinutes * 60;
  const showProgress = !!settings.showProgress;

  useEffect(() => {
    api.getForm(id).then((f) => {
      setForm(f);
      const hasFilters = f.questions.some(isFilterQuestion);
      const limit = Number(f.settings?.timeLimitMinutes) || 0;
      setStage(hasFilters ? "filter" : limit > 0 ? "intro" : "form");
    }).catch((e) => setError(e.message));
  }, [id]);

  // Which questions this respondent currently sees (show/hide rules).
  const visible = useMemo(
    () => (form ? computeVisibility(form.questions, answers) : {}),
    [form, answers]
  );
  const visibleQuestions = useMemo(
    () => (form ? form.questions.filter((q) => visible[q.id]) : []),
    [form, visible]
  );

  // Completion percentage = answered visible questions / all visible questions.
  const percent = useMemo(() => {
    if (visibleQuestions.length === 0) return 0;
    const done = visibleQuestions.filter((q) => isAnswered(q, answers[q.id])).length;
    return Math.round((done / visibleQuestions.length) * 100);
  }, [visibleQuestions, answers]);

  // Countdown: starts when the full form appears, based on the clock (not on
  // counting ticks) so a background tab can't slow it down.
  useEffect(() => {
    if (stage !== "form" || !timeLimitSec || submitted) return undefined;
    const startedAt = Date.now();
    setSecondsLeft(timeLimitSec);
    const timer = setInterval(() => {
      const left = timeLimitSec - Math.floor((Date.now() - startedAt) / 1000);
      setSecondsLeft(Math.max(0, left));
      if (left <= 0) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [stage, timeLimitSec, submitted]);

  // When the time is up, send whatever has been filled in (once).
  useEffect(() => {
    if (secondsLeft !== 0 || stage !== "form" || submitted || !form || autoSubmitted.current) return;
    autoSubmitted.current = true;
    sendAnswers(true);
  });

  function setAnswer(qid, value) {
    setAnswers((a) => ({ ...a, [qid]: value }));
    setErrors((e) => {
      if (!e[qid]) return e;
      const { [qid]: _removed, ...rest } = e;
      return rest;
    });
  }

  function continueFromFilter(e) {
    e.preventDefault();
    const active = form.questions.filter((q) => isFilterQuestion(q) && visible[q.id]);
    for (const q of active) {
      if (!questionQualifies(q, answers[q.id])) {
        setDisqualifyMessage(q.config?.disqualifyMessage || t("filterDefaultDisqualifyMessage"));
        setStage("disqualified");
        return;
      }
    }
    setStage(timeLimitSec > 0 ? "intro" : "form");
  }

  // Required questions must be answered and numbers must be inside their
  // limits — but only for questions the respondent can actually see.
  function validate() {
    const found = {};
    for (const q of form.questions) {
      if (!visible[q.id]) continue;
      const value = answers[q.id];
      if (q.required && !isAnswered(q, value)) {
        found[q.id] = t("requiredQuestionError");
        continue;
      }
      if (q.type === "number" && value !== undefined && value !== null && value !== "") {
        if (isInvalidNumber(q, value)) found[q.id] = numberErrorText(t, q);
      }
    }
    return found;
  }

  async function sendAnswers(timedOut) {
    const payload = form.questions
      .filter((q) => visible[q.id] && answers[q.id] !== undefined)
      .map((q) => ({ questionId: q.id, value: answers[q.id] }));
    try {
      await api.submitResponse(id, payload, timedOut);
      setSubmittedByTimer(timedOut);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setFormError(t("formHasErrors"));
      const first = form.questions.find((q) => found[q.id]);
      document.getElementById(`q-${first.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrors({});
    setFormError("");
    sendAnswers(false);
  }

  if (!form) {
    return (
      <div className="container">
        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : <p>{t("loading")}</p>}
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container">
        <div className="card header-card" style={{ textAlign: "center" }}>
          <h2>{t("responseRecorded")}</h2>
          <p>{t("thanksForFilling", { title: form.title })}</p>
          {submittedByTimer && <p style={{ color: "var(--text-secondary)" }}>{t("timeUpSubmitted")}</p>}
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

  if (stage === "intro") {
    return (
      <div className="container">
        <div className="card header-card" style={{ textAlign: "center" }}>
          <h2>{form.title}</h2>
          {form.description && <p style={{ color: "var(--text-secondary)" }}>{form.description}</p>}
          <p>{t("timerIntro", { minutes: timeLimitMinutes })}</p>
          <button className="btn" type="button" onClick={() => setStage("form")}>{t("startButton")}</button>
        </div>
      </div>
    );
  }

  function renderQuestionCard(q) {
    return (
      <div className={`card${errors[q.id] ? " invalid" : ""}`} key={q.id} id={`q-${q.id}`}>
        {q.config?.imageUrl && (
          <img
            src={q.config.imageUrl}
            alt=""
            style={{ maxWidth: "100%", maxHeight: 320, borderRadius: 6, display: "block", marginBottom: 12 }}
          />
        )}
        <div style={{ fontWeight: 500, marginBottom: 4, fontFamily: q.config?.titleFont || "inherit" }}>
          {q.title} {q.required && <span className="required-star">*</span>}
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
        {errors[q.id] && <div className="error-text">{errors[q.id]}</div>}
      </div>
    );
  }

  if (stage === "filter") {
    const filterQuestions = form.questions.filter((q) => isFilterQuestion(q) && visible[q.id]);
    return (
      <form className="container" onSubmit={continueFromFilter} noValidate>
        <div className="card header-card">
          <h2 style={{ margin: 0 }}>{form.title}</h2>
        </div>
        {filterQuestions.map(renderQuestionCard)}
        <button className="btn" type="submit">{t("filterContinueButton")}</button>
      </form>
    );
  }

  return (
    <form className="container" onSubmit={handleSubmit} noValidate>
      {(showProgress || timeLimitSec > 0) && (
        <div className="status-bar">
          {showProgress && (
            <div className="progress-wrap">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${percent}%` }} />
              </div>
              <span className="progress-label">{t("progressLabel", { percent })}</span>
            </div>
          )}
          {timeLimitSec > 0 && secondsLeft !== null && (
            <span className={`timer${secondsLeft <= 60 ? " danger" : ""}`}>
              ⏱ {t("timeLeft", { time: formatTime(secondsLeft) })}
            </span>
          )}
        </div>
      )}

      <div className="card header-card">
        <h2 style={{ margin: 0 }}>{form.title}</h2>
        {form.description && <p style={{ color: "var(--text-secondary)" }}>{form.description}</p>}
      </div>

      {visibleQuestions.map(renderQuestionCard)}

      {formError && <p className="error-text">{formError}</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <button className="btn" type="submit">{t("submit")}</button>
    </form>
  );
}
