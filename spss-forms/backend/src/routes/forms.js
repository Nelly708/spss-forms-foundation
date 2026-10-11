import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";

const router = Router();

function serializeForm(form) {
  const questions = db
    .prepare("SELECT * FROM questions WHERE form_id = ? ORDER BY position ASC")
    .all(form.id)
    .map((q) => ({
      ...q,
      required: !!q.required,
      options: JSON.parse(q.options || "[]"),
      config: JSON.parse(q.config || "{}"),
    }));
  return { ...form, questions };
}

// List all forms (summary only)
router.get("/", (req, res) => {
  const forms = db
    .prepare(
      `SELECT f.*,
        (SELECT COUNT(*) FROM questions q WHERE q.form_id = f.id) as questionCount,
        (SELECT COUNT(*) FROM responses r WHERE r.form_id = f.id) as responseCount
       FROM forms f ORDER BY updated_at DESC`
    )
    .all();
  res.json(forms);
});

// Create a new form
router.post("/", (req, res) => {
  const id = nanoid(10);
  const now = new Date().toISOString();
  const title = req.body?.title || "Untitled form";
  const description = req.body?.description || "";
  db.prepare(
    "INSERT INTO forms (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, title, description, now, now);
  res.status(201).json(serializeForm(db.prepare("SELECT * FROM forms WHERE id = ?").get(id)));
});

// Get one form with its questions
router.get("/:id", (req, res) => {
  const form = db.prepare("SELECT * FROM forms WHERE id = ?").get(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  res.json(serializeForm(form));
});

// Update form title/description
router.patch("/:id", (req, res) => {
  const form = db.prepare("SELECT * FROM forms WHERE id = ?").get(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });
  const title = req.body?.title ?? form.title;
  const description = req.body?.description ?? form.description;
  db.prepare(
    "UPDATE forms SET title = ?, description = ?, updated_at = ? WHERE id = ?"
  ).run(title, description, new Date().toISOString(), req.params.id);
  res.json(serializeForm(db.prepare("SELECT * FROM forms WHERE id = ?").get(req.params.id)));
});

// Delete a form and everything under it
router.delete("/:id", (req, res) => {
  const form = db.prepare("SELECT * FROM forms WHERE id = ?").get(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });

  db.exec("BEGIN");
  try {
    const responseIds = db
      .prepare("SELECT id FROM responses WHERE form_id = ?")
      .all(req.params.id)
      .map((r) => r.id);
    const deleteAnswers = db.prepare("DELETE FROM answers WHERE response_id = ?");
    for (const rid of responseIds) deleteAnswers.run(rid);
    db.prepare("DELETE FROM responses WHERE form_id = ?").run(req.params.id);
    db.prepare("DELETE FROM questions WHERE form_id = ?").run(req.params.id);
    db.prepare("DELETE FROM forms WHERE id = ?").run(req.params.id);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }

  res.status(204).end();
});

// Replace the full question list for a form (simplest sync strategy for the builder)
router.put("/:id/questions", (req, res) => {
  const form = db.prepare("SELECT * FROM forms WHERE id = ?").get(req.params.id);
  if (!form) return res.status(404).json({ error: "Form not found" });

  const questions = Array.isArray(req.body?.questions) ? req.body.questions : [];

  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM questions WHERE form_id = ?").run(req.params.id);
    const insert = db.prepare(
      `INSERT INTO questions (id, form_id, type, title, description, required, options, config, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    questions.forEach((q, index) => {
      const isTemp = !q.id || String(q.id).startsWith("tmp_");
      insert.run(
        isTemp ? nanoid(10) : q.id,
        req.params.id,
        q.type || "short_text",
        q.title || "",
        q.description || "",
        q.required ? 1 : 0,
        JSON.stringify(q.options || []),
        JSON.stringify(q.config || {}),
        index
      );
    });
    db.prepare("UPDATE forms SET updated_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      req.params.id
    );
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }

  res.json(serializeForm(db.prepare("SELECT * FROM forms WHERE id = ?").get(req.params.id)));
});

export default router;
