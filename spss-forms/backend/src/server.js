import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "./db.js"; // ensures tables exist on boot
import formsRouter from "./routes/forms.js";
import responsesRouter from "./routes/responses.js";
import statsRouter from "./routes/stats.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/forms", formsRouter);
app.use("/api/forms", responsesRouter);
app.use("/api/forms", statsRouter);

// In production (e.g. deployed to Railway), serve the built frontend so the
// whole app runs as one deployed service on one URL. Locally, you don't hit
// this — the Vite dev server handles the frontend instead and proxies /api
// to this server.
const FRONTEND_DIST = path.join(__dirname, "..", "..", "frontend", "dist");
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get("*", (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

app.listen(PORT, '0.0.0.0', () => { 
  console.log(`SPSS-Forms listening on port ${PORT}`);
});