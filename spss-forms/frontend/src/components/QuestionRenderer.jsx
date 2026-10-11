import { useMemo } from "react";
import { shuffleArray } from "../questionTypes.js";

function OtherCapableChoice({ question, options, value, onChange, multi }) {
  const allowOther = !!question.config?.allowOther;

  if (!multi) {
    // Radio: "other" is active whenever the current value doesn't match a
    // predefined option (and isn't empty).
    const otherActive = allowOther && value && !options.includes(value);
    return (
      <div>
        {options.map((opt) => (
          <label className="option-row" key={opt} style={{ cursor: "pointer" }}>
            <input type="radio" name={question.id} checked={value === opt} onChange={() => onChange(opt)} />
            {opt}
          </label>
        ))}
        {allowOther && (
          <label className="option-row" style={{ cursor: "pointer" }}>
            <input type="radio" name={question.id} checked={otherActive} onChange={() => onChange(otherActive ? value : "")} />
            <span>Other:</span>
            <input
              type="text"
              style={{ marginLeft: 6 }}
              value={otherActive ? value : ""}
              onFocus={() => { if (!otherActive) onChange(""); }}
              onChange={(e) => onChange(e.target.value)}
            />
          </label>
        )}
      </div>
    );
  }

  // Checkbox: everything selected that isn't a predefined option is treated
  // as the single free-text "other" entry.
  const selected = Array.isArray(value) ? value : [];
  const standardSelected = selected.filter((v) => options.includes(v));
  const otherEntry = selected.find((v) => !options.includes(v));
  const otherActive = allowOther && otherEntry !== undefined;

  function toggle(opt) {
    onChange(
      standardSelected.includes(opt)
        ? [...standardSelected.filter((v) => v !== opt), ...(otherActive ? [otherEntry] : [])]
        : [...standardSelected, opt, ...(otherActive ? [otherEntry] : [])]
    );
  }
  function toggleOther() {
    onChange(otherActive ? standardSelected : [...standardSelected, ""]);
  }
  function setOtherText(text) {
    onChange([...standardSelected, text]);
  }

  return (
    <div>
      {options.map((opt) => (
        <label className="option-row checkbox" key={opt} style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={standardSelected.includes(opt)} onChange={() => toggle(opt)} />
          {opt}
        </label>
      ))}
      {allowOther && (
        <label className="option-row checkbox" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={otherActive} onChange={toggleOther} />
          <span>Other:</span>
          <input
            type="text"
            style={{ marginLeft: 6 }}
            value={otherActive ? otherEntry : ""}
            disabled={!otherActive}
            onChange={(e) => setOtherText(e.target.value)}
          />
        </label>
      )}
    </div>
  );
}

function MatrixInput({ question, value, onChange }) {
  const rows = question.config?.rows || [];
  const columns = question.config?.columns || [];
  const current = value && typeof value === "object" ? value : {};

  function select(rowIndex, col) {
    onChange({ ...current, [String(rowIndex)]: col });
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "6px 10px" }}></th>
            {columns.map((col) => (
              <th key={col} style={{ padding: "6px 10px", fontWeight: 500, color: "var(--text-secondary)" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ borderTop: "1px solid var(--border)" }}>
              <td style={{ padding: "8px 10px" }}>{row}</td>
              {columns.map((col) => (
                <td key={col} style={{ textAlign: "center", padding: "8px 10px" }}>
                  <input
                    type="radio"
                    name={`${question.id}_${rowIndex}`}
                    checked={current[String(rowIndex)] === col}
                    onChange={() => select(rowIndex, col)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function QuestionRenderer({ question, value, onChange }) {
  const { type } = question;

  // Shuffle once per question per page load (not on every re-render/keystroke),
  // so the respondent sees a stable order while filling the form out. The
  // free-text "Other" option (handled separately by OtherCapableChoice)
  // always stays last, regardless of shuffling.
  const displayOptions = useMemo(() => {
    if (!question.config?.shuffleOptions) return question.options;
    return shuffleArray(question.options || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  if (type === "short_text") {
    return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }

  if (type === "paragraph") {
    return <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} />;
  }

  if (type === "number") {
    return <input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }

  if (type === "date") {
    return <input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }

  if (type === "dropdown") {
    return (
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="" disabled>Choose</option>
        {displayOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (type === "multiple_choice") {
    return <OtherCapableChoice question={question} options={displayOptions} value={value} onChange={onChange} multi={false} />;
  }

  if (type === "checkbox") {
    return <OtherCapableChoice question={question} options={displayOptions} value={value} onChange={onChange} multi={true} />;
  }

  if (type === "matrix") {
    return <MatrixInput question={question} value={value} onChange={onChange} />;
  }

  if (type === "linear_scale") {
    const min = question.config.min ?? 1;
    const max = question.config.max ?? 5;
    const range = [];
    for (let i = min; i <= max; i++) range.push(i);
    return (
      <div style={{ display: "flex", gap: 16 }}>
        {range.map((n) => (
          <label key={n} style={{ textAlign: "center", fontSize: 13 }}>
            <div>{n}</div>
            <input type="radio" name={question.id} checked={Number(value) === n} onChange={() => onChange(n)} />
          </label>
        ))}
      </div>
    );
  }

  return null;
}
