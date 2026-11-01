import { Router } from "express";
import { nanoid } from "nanoid";
import { db } from "../db.js";

const router = Router();

function parseSettings(raw) {
  try {
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// Form-level settings: an optional time limit (whole minutes) and whether
// respondents see a completion percentage. Anything else is ignored.
function sanitizeSettings(raw) {
  const out = {};
  const minutes = Number(raw?.timeLimitMinutes);
  if (Number.isFinite(minutes) && minutes >= 1) out.timeLimitMinutes = Math.min(Math.floor(minutes), 1440);
  if (raw?.showProgress) out.showProgress = true;
  return out;
}

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
  return { ...form, settings: parseSettings(form.settings), questions };
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
  const settings =
    req.body?.settings !== undefined
      ? JSON.stringify(sanitizeSettings(req.body.settings))
      : form.settings || "{}";
  db.prepare(
    "UPDATE forms SET title = ?, description = ?, settings = ?, updated_at = ? WHERE id = ?"
  ).run(title, description, settings, new Date().toISOString(), req.params.id);
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
    // Questions created in the builder have temporary ids; give them real
    // ones first so show/hide rules can be re-pointed at the new ids.
    const idMap = {};
    const prepared = questions.map((q) => {
      const isTemp = !q.id || String(q.id).startsWith("tmp_");
      const newId = isTemp ? nanoid(10) : q.id;
      if (q.id) idMap[q.id] = newId;
      return { q, newId };
    });
    prepared.forEach(({ q, newId }, index) => {
      const config = { ...(q.config || {}) };
      if (config.condition) {
        const target = idMap[config.condition.questionId];
        if (target) config.condition = { ...config.condition, questionId: target };
        else delete config.condition; // source question no longer exists
      }
      insert.run(
        newId,
        req.params.id,
        q.type || "short_text",
        q.title || "",
        q.description || "",
        q.required ? 1 : 0,
        JSON.stringify(q.options || []),
        JSON.stringify(config),
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
