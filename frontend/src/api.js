// In local dev (and in the "single combined app" deployment, e.g. Railway),
// the frontend and backend share an origin, so a relative "/api/forms" path
// works. When the frontend is deployed SEPARATELY from the backend (e.g.
// backend on one Render service, frontend as its own Render Static Site),
// there's no shared origin to be relative to — set VITE_API_BASE to the
// backend's full URL (e.g. https://spss-forms-backend1.onrender.com) as an
// environment variable on the frontend's Render service, and rebuild.
const API_ROOT = import.meta.env.VITE_API_BASE || "";
const BASE = "https://spss-forms-backend1.onrender.com/api/forms";

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
  submitResponse: (formId, answers) =>
    fetch(`${BASE}/${formId}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }).then(handle),
  listResponses: (formId) => fetch(`${BASE}/${formId}/responses`).then(handle),
  getStats: (formId) => fetch(`${BASE}/${formId}/stats`).then(handle),
};
