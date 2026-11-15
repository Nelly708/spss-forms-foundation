import { Router } from "express";
import { db } from "../db.js";
import { buildCsv } from "../utils/csv.js";

const router = Router();

// Download every response of a form as a CSV file.
//   ?sep=comma   -> comma-separated (default is ";", which opens correctly
//                   in Russian-locale Excel)
//   ?lang=en|ru  -> language of the fixed column headings (default ru)
router.get("/:formId/export.csv", (req, res) => {
  const form = db.prepare("SELECT * FROM forms WHERE id = ?").get(req.params.formId);
  if (!form) return res.status(404).json({ error: "Form not found" });

  const questions = db
    .prepare("SELECT * FROM questions WHERE form_id = ? ORDER BY position ASC")
    .all(form.id)
    .map((q) => ({ ...q, config: JSON.parse(q.config || "{}") }));

  const answerStmt = db.prepare("SELECT question_id, value FROM answers WHERE response_id = ?");
  const responses = db
    .prepare("SELECT * FROM responses WHERE form_id = ? ORDER BY submitted_at ASC")
    .all(form.id)
    .map((r) => {
      const answers = {};
      for (const a of answerStmt.all(r.id)) answers[a.question_id] = JSON.parse(a.value ?? "null");
      return { id: r.id, submittedAt: r.submitted_at, timedOut: !!r.timed_out, answers };
    });

  const sep = req.query.sep === "comma" ? "," : ";";
  const lang = req.query.lang === "en" ? "en" : "ru";

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="responses-${form.id}.csv"`);
  res.send(buildCsv(questions, responses, { sep, lang }));
});

export default router;
