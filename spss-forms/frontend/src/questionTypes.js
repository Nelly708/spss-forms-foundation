export const QUESTION_TYPES = [
  { value: "short_text", label: "Short answer" },
  { value: "paragraph", label: "Paragraph" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "dropdown", label: "Dropdown" },
  { value: "linear_scale", label: "Linear scale" },
  { value: "matrix", label: "Matrix / grid (cross-tab)" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
];

export const HAS_OPTIONS = new Set(["multiple_choice", "checkbox", "dropdown"]);

// Question types that can offer a combined "pick an option, or write your
// own" choice — i.e. Google Forms' "Other" option with a free-text field.
export const CAN_HAVE_OTHER = new Set(["multiple_choice", "checkbox"]);

// Question types where answer order can be randomized per respondent.
export const CAN_SHUFFLE = new Set(["multiple_choice", "checkbox", "dropdown"]);

// Font choices for question titles/descriptions — all either web-safe fonts
// or ones already loaded via Google Fonts in index.html, so picking one
// never needs an extra network request.
export const FONT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "'Google Sans', sans-serif", label: "Google Sans" },
  { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "Georgia, serif", label: "Georgia (serif)" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: "'Courier New', Courier, monospace", label: "Courier New (monospace)" },
  { value: "'Comic Sans MS', 'Comic Sans', cursive", label: "Comic Sans" },
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

export function blankMatrixConfig() {
  return { rows: ["Row 1", "Row 2"], columns: ["Yes", "No"] };
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
