// Where the backend lives.
// - Local development (npm run dev): empty, so the relative "/api/forms" path
//   goes through the Vite dev server's proxy to your local backend.
// - Production build (what Render builds for your frontend service): the
//   address of your backend service below. Change this line if your backend
//   address ever changes, or set VITE_API_BASE on the frontend service to
//   override it without editing code.
const PRODUCTION_BACKEND = "https://spss-forms-backend1.onrender.com";
const API_ROOT = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? PRODUCTION_BACKEND : "");
const BASE = `${API_ROOT}/api/forms`;

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  listForms: () => fetch(BASE).then(handle),
  createForm: (data) =>
    fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),
  getForm: (id) => fetch(`${BASE}/${id}`).then(handle),
  updateForm: (id, data) =>
    fetch(`${BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(handle),
  deleteForm: (id) => fetch(`${BASE}/${id}`, { method: "DELETE" }).then(handle),
  saveQuestions: (id, questions) =>
    fetch(`${BASE}/${id}/questions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions }),
    }).then(handle),
  // timedOut = true when the form's timer ran out and the answers filled in
  // so far were sent automatically.
  submitResponse: (formId, answers, timedOut = false) =>
    fetch(`${BASE}/${formId}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, timedOut }),
    }).then(handle),
  listResponses: (formId) => fetch(`${BASE}/${formId}/responses`).then(handle),
  getStats: (formId) => fetch(`${BASE}/${formId}/stats`).then(handle),
};
