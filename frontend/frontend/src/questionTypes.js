// Question type values — their display labels live in i18n.jsx
// (under questionType.<value> for each language) so they translate
// automatically with the language switcher.
export const QUESTION_TYPE_VALUES = [
  "short_text",
  "paragraph",
  "multiple_choice",
  "checkbox",
  "dropdown",
  "linear_scale",
  "matrix",
  "number",
  "date",
];

export const HAS_OPTIONS = new Set(["multiple_choice", "checkbox", "dropdown"]);

// Question types that can offer a combined "pick an option, or write your
// own" choice — i.e. Google Forms' "Other" option with a free-text field.
export const CAN_HAVE_OTHER = new Set(["multiple_choice", "checkbox"]);

// Question types where answer order can be randomized per respondent.
export const CAN_SHUFFLE = new Set(["multiple_choice", "checkbox", "dropdown"]);

// Question types that can act as a qualifying "filter" — answered first,
// before the rest of the form is shown, to screen respondents in or out.
export const CAN_BE_FILTER = new Set(["multiple_choice", "dropdown", "checkbox"]);

// A matrix row can be a plain string (legacy data, or a simple row you
// haven't touched) or an object { label, freeText }. This always returns
// the object shape so the rest of the code can treat rows uniformly.
export function normalizeRow(row) {
  if (row && typeof row === "object") return { freeText: false, ...row };
  return { label: row ?? "", freeText: false };
}

// Font choices for question titles/descriptions — all either web-safe fonts
// or ones already loaded via Google Fonts in index.html, so picking one
// never needs an extra network request. Labels live in i18n.jsx under
// font.<key> for each language.
export const FONT_OPTIONS = [
  { value: "", key: "default" },
  { value: "'Google Sans', sans-serif", key: "googleSans" },
  { value: "Roboto, sans-serif", key: "roboto" },
  { value: "Georgia, serif", key: "georgia" },
  { value: "'Times New Roman', Times, serif", key: "timesNewRoman" },
  { value: "Arial, Helvetica, sans-serif", key: "arial" },
  { value: "Verdana, Geneva, sans-serif", key: "verdana" },
  { value: "'Courier New', Courier, monospace", key: "courierNew" },
  { value: "'Comic Sans MS', 'Comic Sans', cursive", key: "comicSans" },
];

export function blankQuestion(id) {
  return {
    id,
    type: "short_text",
    title: "",
    description: "",
    required: false,
    options: [],
    config: {},
  };
}

// Default matrix rows/columns, translated — pass the `t` function from
// useLanguage() so the defaults match the current UI language.
export function blankMatrixConfig(t) {
  return {
    rows: [
      { label: t("rowN", { n: 1 }), freeText: false },
      { label: t("rowN", { n: 2 }), freeText: false },
    ],
    columns: [t("yes"), t("no")],
  };
}

// Fisher-Yates shuffle — used to randomize answer order without mutating
// the original array.
export function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Swap the items at `fromIndex` and `toIndex` (used for move-up/move-down
// controls — pass toIndex = fromIndex - 1 or + 1). Out-of-bounds moves are
// no-ops. Returns a new array; doesn't mutate the original.
export function arrayMove(arr, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= arr.length) return arr;
  const copy = [...arr];
  [copy[fromIndex], copy[toIndex]] = [copy[toIndex], copy[fromIndex]];
  return copy;
}
