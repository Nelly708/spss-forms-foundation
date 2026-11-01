// Basic descriptive-statistics helpers — the seed of the SPSS-style analysis layer.

export function mean(nums) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function median(nums) {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mode(values) {
  if (!values.length) return null;
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  let best = null;
  let bestCount = -1;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

export function stdDev(nums) {
  if (nums.length < 2) return null;
  const m = mean(nums);
  const variance =
    nums.reduce((acc, n) => acc + (n - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

export function frequencyTable(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  const total = values.length;
  return [...counts.entries()]
    .map(([value, count]) => ({
      value,
      count,
      percent: total ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// A matrix row can be a plain string (legacy data) or an object
// { label, freeText }. Always returns the object shape.
function normalizeRow(row) {
  if (row && typeof row === "object") return { freeText: false, ...row };
  return { label: row ?? "", freeText: false };
}

// Matrix / grid questions: rawValues is an array of objects, one per
// response, each shaped like { "<rowIndex>": "<selected column, or typed
// free text for a freeText row>" }. This is the cross-tabulation seed —
// extend here for chi-square, row-vs-column comparisons across two matrix
// questions, etc.
export function computeMatrixStats(question, rawValues) {
  const rows = (question.config?.rows || []).map(normalizeRow);
  const answeredResponses = rawValues.filter(
    (v) => v && typeof v === "object" && Object.keys(v).length > 0
  );

  const rowStats = rows.map((row, rowIndex) => {
    const colValues = rawValues
      .map((v) => v && v[String(rowIndex)])
      .filter((v) => v !== undefined && v !== null && v !== "");

    if (row.freeText) {
      const wordCounts = colValues.map(
        (v) => String(v).trim().split(/\s+/).filter(Boolean).length
      );
      return {
        row: row.label,
        freeText: true,
        responseCount: colValues.length,
        avgWordCount: mean(wordCounts),
        sampleAnswers: colValues.slice(0, 10),
      };
    }

    return {
      row: row.label,
      freeText: false,
      responseCount: colValues.length,
      mode: mode(colValues),
      frequency: frequencyTable(colValues),
    };
  });

  return {
    questionId: question.id,
    title: question.title,
    type: question.type,
    responseCount: answeredResponses.length,
    skippedCount: rawValues.length - answeredResponses.length,
    rows: rowStats,
  };
}

// Computes appropriate stats for a question given its type and the raw
// answer values already parsed from JSON (string | number | string[] | object).
export function computeQuestionStats(question, rawValues) {
  if (question.type === "matrix") {
    return computeMatrixStats(question, rawValues);
  }

  const answered = rawValues.filter(
    (v) => v !== null && v !== undefined && v !== ""
  );
  const base = {
    questionId: question.id,
    title: question.title,
    type: question.type,
    responseCount: answered.length,
    skippedCount: rawValues.length - answered.length,
  };

  if (question.type === "number" || question.type === "linear_scale") {
    const nums = answered.map(Number).filter((n) => !Number.isNaN(n));
    return {
      ...base,
      mean: mean(nums),
      median: median(nums),
      mode: mode(nums),
      stdDev: stdDev(nums),
      min: nums.length ? Math.min(...nums) : null,
      max: nums.length ? Math.max(...nums) : null,
    };
  }

  if (
    question.type === "multiple_choice" ||
    question.type === "dropdown" ||
    question.type === "checkbox"
  ) {
    // checkbox answers are arrays of selected options -> flatten.
    // Free-text "Other" answers (when config.allowOther is set) show up
    // here as regular values and simply get their own frequency row.
    const flat = answered.flatMap((v) => (Array.isArray(v) ? v : [v]));
    return {
      ...base,
      mode: mode(flat),
      frequency: frequencyTable(flat),
    };
  }

  if (question.type === "date") {
    const dates = answered.map((v) => new Date(v)).filter((d) => !isNaN(d));
    const sorted = dates.sort((a, b) => a - b);
    return {
      ...base,
      earliest: sorted[0] ? sorted[0].toISOString() : null,
      latest: sorted.length ? sorted[sorted.length - 1].toISOString() : null,
    };
  }

  // short_text, paragraph, and any other free-text type
  const wordCounts = answered.map(
    (v) => String(v).trim().split(/\s+/).filter(Boolean).length
  );
  return {
    ...base,
    avgWordCount: mean(wordCounts),
    sampleAnswers: answered.slice(0, 5),
  };
}
