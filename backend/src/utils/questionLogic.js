// Server-side copy of the rules the frontend uses (frontend/src/questionLogic.js):
// which questions a respondent actually sees, what counts as "answered",
// and whether a number is inside its allowed range. Keep the two in sync.

export function normalizeRow(row) {
  if (row && typeof row === "object") return { freeText: false, ...row };
  return { label: row ?? "", freeText: false };
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

// Checks a submitted response against the form definition.
// - answers to hidden questions are dropped;
// - required visible questions must be answered (unless the response was
//   auto-submitted when the timer ran out, which accepts partial answers);
// - number answers must be inside the allowed range (on a timed-out
//   submission an out-of-range number is just dropped).
export function validateSubmission(questions, rawAnswers, { timedOut = false } = {}) {
  const known = new Set(questions.map((q) => q.id));
  const answerMap = {};
  for (const a of rawAnswers) {
    if (a && known.has(a.questionId)) answerMap[a.questionId] = a.value;
  }
  const visible = computeVisibility(questions, answerMap);

  const missing = [];
  const badNumbers = [];
  const clean = [];
  for (const q of questions) {
    if (!visible[q.id]) continue;
    let value = answerMap[q.id];
    if (q.type === "number" && value !== undefined && value !== null && value !== "") {
      if (isInvalidNumber(q, value)) {
        if (timedOut) {
          value = undefined;
        } else {
          badNumbers.push(q.id);
          continue;
        }
      }
    }
    if (q.required && !timedOut && !isAnswered(q, value)) {
      missing.push(q.id);
      continue;
    }
    if (value !== undefined) clean.push({ questionId: q.id, value });
  }

  if (missing.length) return { ok: false, error: "Missing required answers", questionIds: missing };
  if (badNumbers.length) return { ok: false, error: "Number out of allowed range", questionIds: badNumbers };
  return { ok: true, answers: clean };
}
