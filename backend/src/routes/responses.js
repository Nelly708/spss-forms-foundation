import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";

const router = Router();

// Submit a response to a form
// body: { answers: [{ questionId, value }] }
router.post("/:formId/responses", (req, res) => {
  const form = db.prepare("SELECT * FROM forms WHERE id = ?").get(req.params.formId);
  if (!form) return res.status(404).json({ error: "Form not found" });

  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const questions = db
    .prepare("SELECT id, required FROM questions WHERE form_id = ?")
    .all(req.params.formId);

  const answeredIds = new Set(answers.map((a) => a.questionId));
  const missingRequired = questions.filter(
    (q) => q.required && !answeredIds.has(q.id)
  );
  if (missingRequired.length) {
    return res.status(400).json({
      error: "Missing required answers",
      questionIds: missingRequired.map((q) => q.id),
    });
  }

  const responseId = nanoid(12);
  db.exec("BEGIN");
  try {
    db.prepare(
      "INSERT INTO responses (id, form_id, submitted_at) VALUES (?, ?, ?)"
    ).run(responseId, req.params.formId, new Date().toISOString());

    const insertAnswer = db.prepare(
      "INSERT INTO answers (id, response_id, question_id, value) VALUES (?, ?, ?, ?)"
    );
    for (const a of answers) {
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
    answers: answerStmt.all(r.id).map((a) => ({
      questionId: a.question_id,
      value: JSON.parse(a.value ?? "null"),
    })),
  }));

  res.json(full);
});

export default router;
