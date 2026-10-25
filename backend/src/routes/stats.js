import { Router } from "express";
import { db } from "../db.js";
import { computeQuestionStats } from "../utils/statistics.js";

const router = Router();

// Descriptive statistics per question, computed on the fly from raw answers.
// This is the seed of the SPSS-style analysis layer — extend here with
// cross-tabulations between two questions, correlations, chi-square tests, etc.
router.get("/:formId/stats", (req, res) => {
  const form = db.prepare("SELECT * FROM forms WHERE id = ?").get(req.params.formId);
  if (!form) return res.status(404).json({ error: "Form not found" });

  const questions = db
    .prepare("SELECT * FROM questions WHERE form_id = ? ORDER BY position ASC")
    .all(req.params.formId)
    .map((q) => ({ ...q, config: JSON.parse(q.config || "{}") }));

  const totalResponses = db
    .prepare("SELECT COUNT(*) as c FROM responses WHERE form_id = ?")
    .get(req.params.formId).c;

  const answerStmt = db.prepare("SELECT value FROM answers WHERE question_id = ?");

  const questionStats = questions.map((q) => {
    const rawValues = answerStmt
      .all(q.id)
      .map((row) => JSON.parse(row.value ?? "null"));
    return computeQuestionStats(q, rawValues);
  });

  res.json({
    formId: form.id,
    title: form.title,
    totalResponses,
    questions: questionStats,
  });
});

export default router;
