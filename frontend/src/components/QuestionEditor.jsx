import {
  QUESTION_TYPE_VALUES, HAS_OPTIONS, CAN_HAVE_OTHER, CAN_BE_FILTER, FONT_OPTIONS,
  blankMatrixConfig, arrayMove, normalizeRow,
} from "../questionTypes.js";
import { numberLimits, numberRangeText } from "../questionLogic.js";
import { useLanguage } from "../i18n.jsx";

const selectStyle = {
  width: "auto",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "6px 10px",
};

function MoveButtons({ onUp, onDown, disabledUp, disabledDown, upLabel, downLabel, size = "small" }) {
  const style = size === "small" ? { padding: "2px 6px", fontSize: 11 } : {};
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      <button type="button" className="btn text" style={style} onClick={onUp} disabled={disabledUp} title={upLabel}>▲</button>
      <button type="button" className="btn text" style={style} onClick={onDown} disabled={disabledDown} title={downLabel}>▼</button>
    </span>
  );
}

export default function QuestionEditor({
  question, focused, onFocus, onChange, onDuplicate, onDelete,
  onMoveUp, onMoveDown, isFirst, isLast,
  previousQuestions = [], // choice questions above this one: { id, title, options, number }
  conditionAbove = null,  // the show/hide rule of the question right above (for "copy")
}) {
  const { t, tn } = useLanguage();

  function update(patch) {
    onChange({ ...question, ...patch });
  }
  function updateConfig(patch) {
    update({ config: { ...question.config, ...patch } });
  }
  function removeConfigKeys(...keys) {
    const next = { ...(question.config || {}) };
    keys.forEach((k) => delete next[k]);
    update({ config: next });
  }

  function updateOption(index, value) {
    const options = [...question.options];
    options[index] = value;
    update({ options });
  }
  function addOption() {
    update({ options: [...question.options, t("optionN", { n: question.options.length + 1 })] });
  }
  function removeOption(index) {
    update({ options: question.options.filter((_, i) => i !== index) });
  }
  function moveOption(i, dir) {
    update({ options: arrayMove(question.options, i, i + dir) });
  }

  function changeType(newType) {
    // Drop settings that belonged to the old type: number limits must not
    // turn into a scale's range, and a filter flag makes no sense on a text
    // question (it would screen everybody out).
    const { min, max, ...rest } = question.config || {};
    let config = rest;
    if (!CAN_BE_FILTER.has(newType)) {
      const { isFilter, qualifyingOptions, disqualifyMessage, ...withoutFilter } = config;
      config = withoutFilter;
    }
    if (newType === "matrix" && !config.rows) {
      config = { ...config, ...blankMatrixConfig(t) };
    }
    const patch = { type: newType, config };
    if (HAS_OPTIONS.has(newType)) {
      patch.options = question.options.length ? question.options : [t("optionN", { n: 1 })];
    }
    update(patch);
  }

  // --- Filter-question helpers (screen respondents in/out based on answer) ---
  const isFilter = !!question.config?.isFilter;
  const qualifyingOptions = question.config?.qualifyingOptions || [];
  function toggleQualifying(opt) {
    const next = qualifyingOptions.includes(opt)
      ? qualifyingOptions.filter((o) => o !== opt)
      : [...qualifyingOptions, opt];
    updateConfig({ qualifyingOptions: next });
  }

  // --- Show/hide rule (dynamic filter) ---
  const cond = question.config?.condition || null;
  const condSource = cond ? previousQuestions.find((p) => p.id === cond.questionId) : null;
  const condOptions = cond?.options || [];
  const condStale = condSource ? condOptions.filter((o) => !condSource.options.includes(o)) : [];
  function enableCondition() {
    const nearest = previousQuestions[previousQuestions.length - 1];
    updateConfig({ condition: { questionId: nearest.id, mode: "hide", options: [] } });
  }
  function patchCondition(patch) {
    updateConfig({ condition: { ...cond, ...patch } });
  }
  function toggleCondOption(opt) {
    patchCondition({
      options: condOptions.includes(opt) ? condOptions.filter((o) => o !== opt) : [...condOptions, opt],
    });
  }
  const sourceLabel = (p) => `${p.number}. ${(p.title || "").slice(0, 60) || "…"}`;

  // --- Number limits ---
  const limits = question.type === "number" ? numberLimits(question) : { min: null, max: null };
  const limitsInvalid = limits.min !== null && limits.max !== null && limits.min > limits.max;
  function setNumberLimit(key, raw) {
    const next = { ...(question.config || {}) };
    if (raw === "") delete next[key];
    else next[key] = Number(raw);
    update({ config: next });
  }

  // --- Matrix (grid / cross-tab) helpers ---
  const rows = (question.config?.rows || []).map(normalizeRow);
  const columns = question.config?.columns || [];
  function updateRowLabel(i, label) {
    const next = [...rows]; next[i] = { ...next[i], label }; updateConfig({ rows: next });
  }
  function toggleRowFreeText(i) {
    const next = [...rows]; next[i] = { ...next[i], freeText: !next[i].freeText }; updateConfig({ rows: next });
  }
  function addRow() { updateConfig({ rows: [...rows, { label: t("rowN", { n: rows.length + 1 }), freeText: false }] }); }
  function removeRow(i) { updateConfig({ rows: rows.filter((_, idx) => idx !== i) }); }
  function moveRow(i, dir) { updateConfig({ rows: arrayMove(rows, i, i + dir) }); }
  function updateColumn(i, value) {
    const next = [...columns]; next[i] = value; updateConfig({ columns: next });
  }
  function addColumn() { updateConfig({ columns: [...columns, t("columnN", { n: columns.length + 1 })] }); }
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
    removeConfigKeys("imageUrl");
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
          <MoveButtons
            onUp={onMoveUp} onDown={onMoveDown}
            disabledUp={isFirst} disabledDown={isLast}
            upLabel={t("moveUp")} downLabel={t("moveDown")}
          />
        </div>
      )}

      {question.config?.imageUrl && (
        <div style={{ position: "relative", marginBottom: 12 }}>
          <img src={question.config.imageUrl} alt="" style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 6, display: "block" }} />
          {focused && (
            <button type="button" className="btn text" style={{ position: "absolute", top: 6, right: 6, background: "#fff" }} onClick={removeImage}>{t("removeImage")}</button>
          )}
        </div>
      )}

      {!focused && isFilter && (
        <div className="pill" style={{ marginBottom: 8 }}>{t("filterBadge")}</div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
        {question.required && (
          <span className="required-star big" title={t("requiredLabel")}>*</span>
        )}
        <input
          type="text"
          placeholder={t("questionPlaceholder")}
          value={question.title}
          onChange={(e) => update({ title: e.target.value })}
          style={{ fontSize: 16, flex: 1, fontFamily: titleFont || "inherit" }}
        />
      </div>
      <input
        type="text"
        placeholder={t("descriptionOptionalPlaceholder")}
        value={question.description}
        onChange={(e) => update({ description: e.target.value })}
        style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14, fontFamily: descriptionFont || "inherit" }}
      />

      {focused && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {t("titleFont")}<br />
            <select value={titleFont} onChange={(e) => updateConfig({ titleFont: e.target.value })} style={{ marginTop: 2 }}>
              {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{t(`font.${f.key}`)}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {t("descriptionFont")}<br />
            <select value={descriptionFont} onChange={(e) => updateConfig({ descriptionFont: e.target.value })} style={{ marginTop: 2 }}>
              {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{t(`font.${f.key}`)}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {t("image")}<br />
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginTop: 2, fontSize: 12 }} />
          </label>
          <label className={`required-toggle ${question.required ? "on" : ""}`}>
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => update({ required: e.target.checked })}
            />
            <span className="required-star">*</span>
            {t("requiredLabel")}
          </label>
        </div>
      )}

      {focused && (
        <select
          value={question.type}
          onChange={(e) => changeType(e.target.value)}
          style={{ ...selectStyle, marginBottom: 14 }}
        >
          {QUESTION_TYPE_VALUES.map((value) => (
            <option key={value} value={value}>{t(`questionType.${value}`)}</option>
          ))}
        </select>
      )}
      {!focused && (
        <div className="pill">{t(`questionType.${question.type}`)}</div>
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
                  <MoveButtons
                    onUp={() => moveOption(i, -1)} onDown={() => moveOption(i, 1)}
                    disabledUp={i === 0} disabledDown={i === question.options.length - 1}
                    upLabel={t("moveUp")} downLabel={t("moveDown")}
                  />
                  <button className="btn text" onClick={() => removeOption(i)}>✕</button>
                </>
              ) : (
                <span>{opt}</span>
              )}
            </div>
          ))}
          {focused && (
            <button className="btn text" onClick={addOption}>{t("addOption")}</button>
          )}

          {focused && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={!!question.config?.shuffleOptions}
                onChange={(e) => updateConfig({ shuffleOptions: e.target.checked })}
              />
              {t("shuffleLabel")}
            </label>
          )}
          {!focused && question.config?.shuffleOptions && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>{t("shuffledBadge")}</div>
          )}

          {CAN_HAVE_OTHER.has(question.type) && (
            focused ? (
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={!!question.config?.allowOther}
                  onChange={(e) => updateConfig({ allowOther: e.target.checked })}
                />
                {t("addOtherLabel")}
              </label>
            ) : (
              question.config?.allowOther && (
                <div className="option-row">
                  <span className="bullet" />
                  <span style={{ color: "var(--text-secondary)" }}>{t("otherLabel")} <em>{t("freeText")}</em></span>
                </div>
              )
            )
          )}

          {CAN_BE_FILTER.has(question.type) && focused && (
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={isFilter}
                  onChange={(e) => updateConfig({ isFilter: e.target.checked })}
                />
                {t("filterToggleLabel")}
              </label>
              {isFilter && (
                <div style={{ marginTop: 8, marginLeft: 24 }}>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{t("filterQualifyingHint")}</div>
                  {question.options.map((opt, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 4 }}>
                      <input
                        type="checkbox"
                        checked={qualifyingOptions.includes(opt)}
                        onChange={() => toggleQualifying(opt)}
                      />
                      {opt}
                    </label>
                  ))}
                  {qualifyingOptions.length === 0 && (
                    <div className="warn-text">{t("filterNoQualifying")}</div>
                  )}
                  <input
                    type="text"
                    placeholder={t("filterDisqualifyMessagePlaceholder")}
                    value={question.config?.disqualifyMessage || ""}
                    onChange={(e) => updateConfig({ disqualifyMessage: e.target.value })}
                    style={{ marginTop: 8, fontSize: 13 }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Matrix / grid editor */}
      {question.type === "matrix" && focused && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{t("rowsLabel")}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>{t("rowsFreeTextHint")}</div>
          {rows.map((row, i) => (
            <div className="option-row" key={i}>
              <input type="text" value={row.label} onChange={(e) => updateRowLabel(i, e.target.value)} />
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }} title={t("rowFreeTextLabel")}>
                <input type="checkbox" checked={row.freeText} onChange={() => toggleRowFreeText(i)} />
                ✍️
              </label>
              <MoveButtons
                onUp={() => moveRow(i, -1)} onDown={() => moveRow(i, 1)}
                disabledUp={i === 0} disabledDown={i === rows.length - 1}
                upLabel={t("moveUp")} downLabel={t("moveDown")}
              />
              <button className="btn text" onClick={() => removeRow(i)}>✕</button>
            </div>
          ))}
          <button className="btn text" onClick={addRow}>{t("addRow")}</button>

          <div style={{ fontSize: 13, fontWeight: 500, margin: "14px 0 6px" }}>{t("columnsLabel")}</div>
          {columns.map((col, i) => (
            <div className="option-row" key={i}>
              <input type="text" value={col} onChange={(e) => updateColumn(i, e.target.value)} />
              <MoveButtons
                onUp={() => moveColumn(i, -1)} onDown={() => moveColumn(i, 1)}
                disabledUp={i === 0} disabledDown={i === columns.length - 1}
                upLabel={t("moveUp")} downLabel={t("moveDown")}
              />
              <button className="btn text" onClick={() => removeColumn(i)}>✕</button>
            </div>
          ))}
          <button className="btn text" onClick={addColumn}>{t("addColumn")}</button>
        </div>
      )}
      {question.type === "matrix" && !focused && (
        <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          {tn("rowsCount", rows.length)} × {tn("columnsCount", columns.length)}
          {rows.length > 0 && t("matrixExample", { row: rows[0].label })}
          {rows.some((r) => r.freeText) && <> · {t("someRowsFreeText")}</>}
        </div>
      )}

      {question.type === "linear_scale" && focused && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
          <label>{t("from")}
            <input type="number" style={{ width: 60, marginLeft: 6 }} value={question.config.min ?? 1}
              onChange={(e) => updateConfig({ min: Number(e.target.value) })} />
          </label>
          <label>{t("to")}
            <input type="number" style={{ width: 60, marginLeft: 6 }} value={question.config.max ?? 5}
              onChange={(e) => updateConfig({ max: Number(e.target.value) })} />
          </label>
        </div>
      )}
      {question.type === "linear_scale" && !focused && (
        <div className="meta" style={{ color: "var(--text-secondary)" }}>
          {t("scaleSummary", { min: question.config.min ?? 1, max: question.config.max ?? 5 })}
        </div>
      )}

      {/* Number question: author-defined allowed range */}
      {question.type === "number" && focused && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{t("numberLimitsLabel")}</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <label>{t("from")}
              <input type="number" step="any" style={{ width: 110, marginLeft: 6 }}
                value={question.config?.min ?? ""}
                onChange={(e) => setNumberLimit("min", e.target.value)} />
            </label>
            <label>{t("to")}
              <input type="number" step="any" style={{ width: 110, marginLeft: 6 }}
                value={question.config?.max ?? ""}
                onChange={(e) => setNumberLimit("max", e.target.value)} />
            </label>
          </div>
          {limitsInvalid && <div className="warn-text">{t("numberRangeInvalid")}</div>}
        </div>
      )}
      {question.type === "number" && !focused && (
        <div className="meta" style={{ color: "var(--text-secondary)", fontSize: 13 }}>
          {numberRangeText(t, question) || <input disabled type="number" style={{ opacity: 0.6 }} />}
        </div>
      )}

      {question.type === "paragraph" && (
        <textarea disabled placeholder={t("longAnswerPlaceholder")} style={{ marginTop: 8, opacity: 0.6 }} />
      )}
      {question.type === "short_text" && (
        <input disabled type="text" placeholder={t("shortAnswerPlaceholder")} style={{ marginTop: 8, opacity: 0.6 }} />
      )}

      {/* Show/hide rule (dynamic filter) — editing */}
      {focused && (
        <div className="condition-box">
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            <input
              type="checkbox"
              checked={!!cond}
              disabled={!cond && previousQuestions.length === 0}
              onChange={(e) => (e.target.checked ? enableCondition() : removeConfigKeys("condition"))}
            />
            {t("conditionToggleLabel")}
          </label>

          {!cond && previousQuestions.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, marginLeft: 24 }}>
              {t("conditionNoEligible")}
            </div>
          )}
          {!cond && conditionAbove && previousQuestions.some((p) => p.id === conditionAbove.questionId) && (
            <button
              type="button"
              className="btn text"
              style={{ marginLeft: 20, marginTop: 4 }}
              onClick={() => updateConfig({ condition: { ...conditionAbove } })}
            >
              ⧉ {t("conditionCopyAbove")}
            </button>
          )}

          {cond && (
            <div style={{ marginTop: 10, marginLeft: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <select
                value={cond.mode === "show" ? "show" : "hide"}
                onChange={(e) => patchCondition({ mode: e.target.value })}
                style={selectStyle}
              >
                <option value="hide">{t("conditionModeHide")}</option>
                <option value="show">{t("conditionModeShow")}</option>
              </select>

              <label style={{ fontSize: 13 }}>
                {t("conditionSourceLabel")}{" "}
                <select
                  value={condSource ? cond.questionId : ""}
                  onChange={(e) => patchCondition({ questionId: e.target.value, options: [] })}
                  style={selectStyle}
                >
                  {!condSource && <option value="">—</option>}
                  {previousQuestions.map((p) => (
                    <option key={p.id} value={p.id}>{sourceLabel(p)}</option>
                  ))}
                </select>
              </label>

              {!condSource && <div className="warn-text">{t("conditionBrokenWarning")}</div>}

              {condSource && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{t("conditionOptionsHint")}</div>
                  {condSource.options.map((opt, i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 4 }}>
                      <input type="checkbox" checked={condOptions.includes(opt)} onChange={() => toggleCondOption(opt)} />
                      {opt}
                    </label>
                  ))}
                  {condStale.map((opt) => (
                    <label key={`stale-${opt}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 4, color: "var(--danger)" }}>
                      <input type="checkbox" checked onChange={() => toggleCondOption(opt)} />
                      {opt} {t("conditionStaleOption")}
                    </label>
                  ))}
                  {condOptions.length === 0 && (
                    <div className="warn-text">{t("conditionNoOptionsSelected")}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Show/hide rule — summary when the card is collapsed */}
      {!focused && cond && (
        condSource && condOptions.length > 0 ? (
          <div className="condition-badge">
            {t(cond.mode === "show" ? "conditionBadgeShow" : "conditionBadgeHide", {
              n: condSource.number,
              options: condOptions.join(", "),
            })}
          </div>
        ) : (
          <div className="condition-badge warn">
            {condSource ? t("conditionNoOptionsSelected") : t("conditionBrokenWarning")}
          </div>
        )
      )}

      {focused && (
        <div className="question-toolbar">
          <div className="spacer" />
          <button className="btn text" onClick={onDuplicate} title={t("duplicate")}>⧉ {t("duplicate")}</button>
          <button className="btn text" onClick={onDelete} title={t("delete")}>🗑 {t("delete")}</button>
        </div>
      )}
    </div>
  );
}
