const BASE = "/api/forms";

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
