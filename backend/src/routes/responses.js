import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { validateSubmission } from "../utils/questionLogic.js";

const router = Router();

// Submit a response to a form
// body: { answers: [{ questionId, value }], timedOut?: boolean }
router.post("/:formId/responses", (req, res) => {
  const form = db.prepare("SELECT * FROM forms WHERE id = ?").get(req.params.formId);
  if (!form) return res.status(404).json({ error: "Form not found" });

  const rawAnswers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const timedOut = req.body?.timedOut === true;

  const questions = db
    .prepare("SELECT id, type, required, config FROM questions WHERE form_id = ? ORDER BY position ASC")
    .all(req.params.formId)
    .map((q) => ({ ...q, required: !!q.required, config: JSON.parse(q.config || "{}") }));

  const result = validateSubmission(questions, rawAnswers, { timedOut });
  if (!result.ok) {
    return res.status(400).json({ error: result.error, questionIds: result.questionIds });
  }

  const responseId = nanoid(12);
  db.exec("BEGIN");
  try {
    db.prepare(
      "INSERT INTO responses (id, form_id, submitted_at, timed_out) VALUES (?, ?, ?, ?)"
    ).run(responseId, req.params.formId, new Date().toISOString(), timedOut ? 1 : 0);

    const insertAnswer = db.prepare(
      "INSERT INTO answers (id, response_id, question_id, value) VALUES (?, ?, ?, ?)"
    );
    for (const a of result.answers) {
      insertAnswer.run(
        nanoid(12),
        responseId,
        a.questionId,
        JSON.stringify(a.value ?? null)
      );
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }

  res.status(201).json({ id: responseId });
});

// List raw responses for a form (each response with its answers)
router.get("/:formId/responses", (req, res) => {
  const form = db.prepare("SELECT * FROM forms WHERE id = ?").get(req.params.formId);
  if (!form) return res.status(404).json({ error: "Form not found" });

  const responses = db
    .prepare("SELECT * FROM responses WHERE form_id = ? ORDER BY submitted_at DESC")
    .all(req.params.formId);

  const answerStmt = db.prepare("SELECT question_id, value FROM answers WHERE response_id = ?");

  const full = responses.map((r) => ({
    id: r.id,
    submittedAt: r.submitted_at,
    timedOut: !!r.timed_out,
    answers: answerStmt.all(r.id).map((a) => ({
      questionId: a.question_id,
      value: JSON.parse(a.value ?? "null"),
    })),
  }));

  res.json(full);
});

export default router;
