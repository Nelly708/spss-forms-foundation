// Builds the CSV export of a form's responses (one row per response).
import { normalizeRow } from "./questionLogic.js";

const LABELS = {
  ru: {
    id: "ID ответа",
    time: "Дата и время ответа (UTC)",
    timedOut: "Завершено по таймеру (1 — да)",
    text: "текст",
    choice: "выбор",
  },
  en: {
    id: "Response ID",
    time: "Submitted at (UTC)",
    timedOut: "Ended by timer (1 = yes)",
    text: "text",
    choice: "choice",
  },
};

// One CSV cell. Quotes the value when needed and neutralises text that
// Excel/Sheets would run as a formula (starts with = + - @). Genuine
// numbers are left alone so negative numbers stay numbers.
function cell(value, sep, { numeric = false } = {}) {
  let s = value === undefined || value === null ? "" : String(value);
  const isNumber = numeric && s.trim() !== "" && Number.isFinite(Number(s));
  if (!isNumber && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (s.includes('"') || s.includes(sep) || /[\r\n]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// The columns for one form: [{ header, numeric, get(answersByQuestionId) }]
function buildColumns(questions, L) {
  const cols = [];
  questions.forEach((q, index) => {
    if (q.type === "info") return; // text-only blocks have no answers
    const base = `${index + 1}. ${q.title || ""}`.trim();

    if (q.type === "matrix") {
      (q.config?.rows || []).map(normalizeRow).forEach((row, i) => {
        const cellOf = (answers) => answers[q.id]?.[String(i)];
        if (row.freeText) {
          cols.push({
            header: `${base} — ${row.label} (${L.text})`,
            numeric: false,
            get: (a) => {
              const c = cellOf(a);
              return typeof c === "string" ? c : c?.label;
            },
          });
          cols.push({
            header: `${base} — ${row.label} (${L.choice})`,
            numeric: false,
            get: (a) => {
              const c = cellOf(a);
              return c && typeof c === "object" ? c.column : "";
            },
          });
        } else {
          cols.push({ header: `${base} — ${row.label}`, numeric: false, get: cellOf });
        }
      });
      return;
    }

    cols.push({
      header: base,
      numeric: q.type === "number" || q.type === "linear_scale",
      get: (a) => {
        const v = a[q.id];
        return Array.isArray(v) ? v.join("; ") : v;
      },
    });
  });
  return cols;
}

// questions: form questions in order; responses: [{ id, submittedAt, timedOut, answers: {questionId: value} }]
// sep: ";" (opens correctly in Russian-locale Excel) or ","
export function buildCsv(questions, responses, { sep = ";", lang = "ru" } = {}) {
  const L = LABELS[lang] || LABELS.ru;
  const cols = buildColumns(questions, L);
  const header = [L.id, L.time, L.timedOut, ...cols.map((c) => c.header)];
  const lines = [header.map((h) => cell(h, sep)).join(sep)];

  for (const r of responses) {
    const time = String(r.submittedAt).replace("T", " ").slice(0, 19);
    const row = [
      cell(r.id, sep),
      cell(time, sep),
      cell(r.timedOut ? 1 : 0, sep, { numeric: true }),
      ...cols.map((c) => cell(c.get(r.answers), sep, { numeric: c.numeric })),
    ];
    lines.push(row.join(sep));
  }
  // The BOM makes Excel read the file as UTF-8 (otherwise Cyrillic breaks).
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}
