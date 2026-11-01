// Rules shared by the form viewer and the builder: which questions a
// respondent sees, what counts as "answered", number limits, and the
// helpers for timer/progress text. The backend has its own copy of the
// visibility/answered/number rules (backend/src/utils/questionLogic.js) —
// keep the two in sync.
import { normalizeRow, CAN_BE_FILTER } from "./questionTypes.js";

// A filter question screens respondents before the rest of the form is
// shown. It only counts if it is a choice question AND at least one
// qualifying answer is ticked (otherwise everybody would be screened out).
export function isFilterQuestion(q) {
  return (
    !!q.config?.isFilter &&
    CAN_BE_FILTER.has(q.type) &&
    (q.config?.qualifyingOptions || []).length > 0
  );
}

// A question can carry config.condition = { questionId, mode: "show"|"hide", options: [...] }.
// The source question must come EARLIER in the form; otherwise the rule is
// ignored (this also rules out circular rules). A question whose source is
// itself hidden is hidden too.
export function computeVisibility(questions, answers) {
  const indexById = {};
  questions.forEach((q, i) => {
    indexById[q.id] = i;
  });
  const visible = {};
  questions.forEach((q, i) => {
    let show = true;
    const cond = q.config?.condition;
    if (cond && cond.questionId && Array.isArray(cond.options) && cond.options.length > 0) {
      const sourceIndex = indexById[cond.questionId];
      if (sourceIndex !== undefined && sourceIndex < i) {
        const source = questions[sourceIndex];
        if (visible[source.id] === false) {
          show = false;
        } else {
          const raw = answers[source.id];
          const values = Array.isArray(raw)
            ? raw
            : raw === undefined || raw === null || raw === ""
            ? []
            : [raw];
          const matches = values.some((v) => cond.options.includes(v));
          show = cond.mode === "show" ? matches : !matches;
        }
      }
    }
    visible[q.id] = show;
  });
  return visible;
}

export function isAnswered(question, value) {
  if (value === undefined || value === null) return false;
  if (question.type === "checkbox") {
    return Array.isArray(value)
      ? value.some((v) => String(v).trim() !== "")
      : String(value).trim() !== "";
  }
  if (question.type === "matrix") {
    if (typeof value !== "object") return false;
    const rows = (question.config?.rows || []).map(normalizeRow);
    const filled = (i) => String(value[String(i)] ?? "").trim() !== "";
    const choiceRows = rows.map((r, i) => ({ r, i })).filter((x) => !x.r.freeText);
    if (choiceRows.length === 0) return rows.some((_, i) => filled(i));
    return choiceRows.every((x) => filled(x.i));
  }
  return String(value).trim() !== "";
}

// ---- number limits ----
export function numberLimits(question) {
  const toNum = (v) =>
    v === undefined || v === null || v === "" || Number.isNaN(Number(v)) ? null : Number(v);
  return { min: toNum(question.config?.min), max: toNum(question.config?.max) };
}

export function isInvalidNumber(question, value) {
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) return true;
  const { min, max } = numberLimits(question);
  if (min !== null && n < min) return true;
  if (max !== null && n > max) return true;
  return false;
}

// Short hint like "Number from 14 to 100" ("" when there are no limits).
export function numberRangeText(t, question) {
  const { min, max } = numberLimits(question);
  if (min !== null && max !== null) return t("numberPreviewBoth", { min, max });
  if (min !== null) return t("numberPreviewMin", { min });
  if (max !== null) return t("numberPreviewMax", { max });
  return "";
}

export function numberErrorText(t, question) {
  const { min, max } = numberLimits(question);
  if (min !== null && max !== null) return t("numberErrorBoth", { min, max });
  if (min !== null) return t("numberErrorMin", { min });
  if (max !== null) return t("numberErrorMax", { max });
  return t("numberErrorInvalid");
}

// 125 -> "2:05", 3725 -> "1:02:05"
export function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
