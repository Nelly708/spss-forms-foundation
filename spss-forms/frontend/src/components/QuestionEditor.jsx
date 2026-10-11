import { QUESTION_TYPES, HAS_OPTIONS, CAN_HAVE_OTHER, FONT_OPTIONS, blankMatrixConfig, arrayMove } from "../questionTypes.js";

function MoveButtons({ onUp, onDown, disabledUp, disabledDown, size = "small" }) {
  const style = size === "small" ? { padding: "2px 6px", fontSize: 11 } : {};
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      <button type="button" className="btn text" style={style} onClick={onUp} disabled={disabledUp} title="Move up">▲</button>
      <button type="button" className="btn text" style={style} onClick={onDown} disabled={disabledDown} title="Move down">▼</button>
    </span>
  );
}

export default function QuestionEditor({
  question, focused, onFocus, onChange, onDuplicate, onDelete,
  onMoveUp, onMoveDown, isFirst, isLast,
}) {
  function update(patch) {
    onChange({ ...question, ...patch });
  }
  function updateConfig(patch) {
    update({ config: { ...question.config, ...patch } });
  }

  function updateOption(index, value) {
    const options = [...question.options];
    options[index] = value;
    update({ options });
  }
  function addOption() {
    update({ options: [...question.options, `Option ${question.options.length + 1}`] });
  }
  function removeOption(index) {
    update({ options: question.options.filter((_, i) => i !== index) });
  }
  function moveOption(i, dir) {
    update({ options: arrayMove(question.options, i, i + dir) });
  }

  function changeType(newType) {
    const patch = { type: newType };
    if (HAS_OPTIONS.has(newType) && newType !== "matrix") {
      patch.options = question.options.length ? question.options : ["Option 1"];
    }
    if (newType === "matrix" && !question.config?.rows) {
      patch.config = blankMatrixConfig();
    }
    update(patch);
  }

  // --- Matrix (grid / cross-tab) helpers ---
  const rows = question.config?.rows || [];
  const columns = question.config?.columns || [];
  function updateRow(i, value) {
    const next = [...rows]; next[i] = value; updateConfig({ rows: next });
  }
  function addRow() { updateConfig({ rows: [...rows, `Row ${rows.length + 1}`] }); }
  function removeRow(i) { updateConfig({ rows: rows.filter((_, idx) => idx !== i) }); }
  function moveRow(i, dir) { updateConfig({ rows: arrayMove(rows, i, i + dir) }); }
  function updateColumn(i, value) {
    const next = [...columns]; next[i] = value; updateConfig({ columns: next });
  }
  function addColumn() { updateConfig({ columns: [...columns, `Column ${columns.length + 1}`] }); }
  function removeColumn(i) { updateConfig({ columns: columns.filter((_, idx) => idx !== i) }); }
  function moveColumn(i, dir) { updateConfig({ columns: arrayMove(columns, i, i + dir) }); }

  // --- Image upload (stored as a data URL directly on the question) ---
  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateConfig({ imageUrl: reader.result });
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  function removeImage() {
    const { imageUrl, ...rest } = question.config || {};
    update({ config: rest });
  }

  const titleFont = question.config?.titleFont || "";
  const descriptionFont = question.config?.descriptionFont || "";

  return (
    <div
      className={`card question-card ${focused ? "focused" : ""}`}
      onClick={onFocus}
    >
      {focused && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <MoveButtons onUp={onMoveUp} onDown={onMoveDown} disabledUp={isFirst} disabledDown={isLast} />
        </div>
      )}

      {question.config?.imageUrl && (
        <div style={{ position: "relative", marginBottom: 12 }}>
          <img src={question.config.imageUrl} alt="" style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 6, display: "block" }} />
          {focused && (
            <button type="button" className="btn text" style={{ position: "absolute", top: 6, right: 6, background: "#fff" }} onClick={removeImage}>✕ Remove image</button>
          )}
        </div>
      )}

      <input
        type="text"
        placeholder="Question"
        value={question.title}
        onChange={(e) => update({ title: e.target.value })}
        style={{ fontSize: 16, marginBottom: 10, fontFamily: titleFont || "inherit" }}
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={question.description}
        onChange={(e) => update({ description: e.target.value })}
        style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, fontFamily: descriptionFont || "inherit" }}
      />

      {focused && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Title font<br />
            <select value={titleFont} onChange={(e) => updateConfig({ titleFont: e.target.value })} style={{ marginTop: 2 }}>
              {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Description font<br />
            <select value={descriptionFont} onChange={(e) => updateConfig({ descriptionFont: e.target.value })} style={{ marginTop: 2 }}>
              {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            Image<br />
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginTop: 2, fontSize: 12 }} />
          </label>
        </div>
      )}

      {focused && (
        <select
          value={question.type}
          onChange={(e) => changeType(e.target.value)}
          style={{ width: "auto", marginBottom: 14, border: "1px solid var(--border)", borderRadius: 4, padding: "6px 10px" }}
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      )}
      {!focused && (
        <div className="pill">{QUESTION_TYPES.find((t) => t.value === question.type)?.label}</div>
      )}

      {/* Preview / editable options for choice-based questions */}
      {HAS_OPTIONS.has(question.type) && (
        <div style={{ marginTop: 12 }}>
          {question.options.map((opt, i) => (
            <div className={`option-row ${question.type === "checkbox" ? "checkbox" : ""}`} key={i}>
              <span className="bullet" />
              {focused ? (
                <>
                  <input type="text" value={opt} onChange={(e) => updateOption(i, e.target.value)} />
                  <MoveButtons onUp={() => moveOption(i, -1)} onDown={() => moveOption(i, 1)} disabledUp={i === 0} disabledDown={i === question.options.length - 1} />
                  <button className="btn text" onClick={() => removeOption(i)}>✕</button>
                </>
              ) : (
                <span>{opt}</span>
              )}
            </div>
          ))}
          {focused && (
            <button className="btn text" onClick={addOption}>+ Add option</button>
          )}

          {focused && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={!!question.config?.shuffleOptions}
                onChange={(e) => updateConfig({ shuffleOptions: e.target.checked })}
              />
              Shuffle answer order for each respondent
            </label>
          )}
          {!focused && question.config?.shuffleOptions && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>🔀 Shuffled per respondent</div>
          )}

          {CAN_HAVE_OTHER.has(question.type) && (
            focused ? (
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={!!question.config?.allowOther}
                  onChange={(e) => updateConfig({ allowOther: e.target.checked })}
                />
                Add "Other" — lets respondents type their own answer instead of picking an option
              </label>
            ) : (
              question.config?.allowOther && (
                <div className="option-row">
                  <span className="bullet" />
                  <span style={{ color: "var(--text-secondary)" }}>Other: <em>free text</em></span>
                </div>
              )
            )
          )}
        </div>
      )}

      {/* Matrix / grid editor */}
      {question.type === "matrix" && focused && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Rows (statements)</div>
          {rows.map((row, i) => (
            <div className="option-row" key={i}>
              <input type="text" value={row} onChange={(e) => updateRow(i, e.target.value)} />
              <MoveButtons onUp={() => moveRow(i, -1)} onDown={() => moveRow(i, 1)} disabledUp={i === 0} disabledDown={i === rows.length - 1} />
              <button className="btn text" onClick={() => removeRow(i)}>✕</button>
            </div>
          ))}
          <button className="btn text" onClick={addRow}>+ Add row</button>

          <div style={{ fontSize: 13, fontWeight: 500, margin: "14px 0 6px" }}>Columns (answer choices)</div>
          {columns.map((col, i) => (
            <div className="option-row" key={i}>
              <input type="text" value={col} onChange={(e) => updateColumn(i, e.target.value)} />
              <MoveButtons onUp={() => moveColumn(i, -1)} onDown={() => moveColumn(i, 1)} disabledUp={i === 0} disabledDown={i === columns.length - 1} />
              <button className="btn text" onClick={() => removeColumn(i)}>✕</button>
            </div>
          ))}
          <button className="btn text" onClick={addColumn}>+ Add column</button>
        </div>
      )}
      {question.type === "matrix" && !focused && (
        <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          {rows.length} row{rows.length === 1 ? "" : "s"} × {columns.length} column{columns.length === 1 ? "" : "s"}
          {rows.length > 0 && <> — e.g. "{rows[0]}"</>}
        </div>
      )}

      {question.type === "linear_scale" && focused && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
          <label>From
            <input type="number" style={{ width: 60, marginLeft: 6 }} value={question.config.min ?? 1}
              onChange={(e) => updateConfig({ min: Number(e.target.value) })} />
          </label>
          <label>To
            <input type="number" style={{ width: 60, marginLeft: 6 }} value={question.config.max ?? 5}
              onChange={(e) => updateConfig({ max: Number(e.target.value) })} />
          </label>
        </div>
      )}
      {question.type === "linear_scale" && !focused && (
        <div className="meta" style={{ color: "var(--text-secondary)" }}>
          Scale {question.config.min ?? 1} – {question.config.max ?? 5}
        </div>
      )}

      {question.type === "paragraph" && (
        <textarea disabled placeholder="Long answer text" style={{ marginTop: 8, opacity: 0.6 }} />
      )}
      {question.type === "short_text" && (
        <input disabled type="text" placeholder="Short answer text" style={{ marginTop: 8, opacity: 0.6 }} />
      )}

      {focused && (
        <div className="question-toolbar">
          <div className="spacer" />
          <button className="btn text" onClick={onDuplicate} title="Duplicate">⧉ Duplicate</button>
          <button className="btn text" onClick={onDelete} title="Delete">🗑 Delete</button>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            Required
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => update({ required: e.target.checked })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
