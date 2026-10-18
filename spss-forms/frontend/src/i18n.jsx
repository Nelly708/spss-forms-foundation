import { createContext, useContext, useState, useCallback } from "react";

const STORAGE_KEY = "forms_app_language";

function ruPluralIndex(n) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return 0;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return 1;
  return 2;
}
function enPluralIndex(n) {
  return n === 1 ? 0 : 1;
}

// Every UI string lives here, in both languages. To add a new language,
// duplicate one of these blocks, translate the values, and add it to
// LANGUAGES below.
const STRINGS = {
  en: {
    appName: "📊 Forms",
    yourForms: "Your forms",
    newForm: "+ New form",
    loading: "Loading…",
    noFormsYet: "No forms yet. Create your first one to get started.",
    deleteFormConfirm: "Delete this form and all its responses?",
    delete: "Delete",
    untitledForm: "Untitled form",
    questionsCount: ["{{n}} question", "{{n}} questions"],
    responsesCount: ["{{n}} response", "{{n}} responses"],
    tabQuestions: "Questions",
    tabResponses: "Responses",
    tabPreview: "Preview / Fill in ↗",
    formDescriptionPlaceholder: "Form description",
    addQuestion: "+ Add question",
    saveForm: "Save form",
    saving: "Saving…",
    savedAt: "Saved {{time}}",
    questionPlaceholder: "Question",
    descriptionOptionalPlaceholder: "Description (optional)",
    moveUp: "Move up",
    moveDown: "Move down",
    addOption: "+ Add option",
    optionN: "Option {{n}}",
    shuffleLabel: "Shuffle answer order for each respondent",
    shuffledBadge: "🔀 Shuffled per respondent",
    addOtherLabel: 'Add "Other" — lets respondents type their own answer instead of picking an option',
    otherLabel: "Other:",
    freeText: "free text",
    titleFont: "Title font",
    descriptionFont: "Description font",
    image: "Image",
    removeImage: "✕ Remove image",
    rowsLabel: "Rows (statements)",
    addRow: "+ Add row",
    rowN: "Row {{n}}",
    columnsLabel: "Columns (answer choices)",
    addColumn: "+ Add column",
    columnN: "Column {{n}}",
    yes: "Yes",
    no: "No",
    rowsCount: ["{{n}} row", "{{n}} rows"],
    columnsCount: ["{{n}} column", "{{n}} columns"],
    matrixExample: " — e.g. \"{{row}}\"",
    from: "From",
    to: "To",
    scaleSummary: "Scale {{min}} – {{max}}",
    longAnswerPlaceholder: "Long answer text",
    shortAnswerPlaceholder: "Short answer text",
    duplicate: "Duplicate",
    requiredLabel: "Required",
    choose: "Choose",
    responseRecorded: "Response recorded",
    thanksForFilling: 'Thanks for filling out "{{title}}".',
    submit: "Submit",
    answeredSkipped: "{{answered}} answered · {{skipped}} skipped",
    mean: "Mean",
    median: "Median",
    mode: "Mode",
    stdDev: "Std dev",
    min: "Min",
    max: "Max",
    earliest: "Earliest",
    latest: "Latest",
    avgWordCount: "Avg. word count: {{n}}",
    noResponsesYet: "No responses yet — share the form link to start collecting data.",
    questionType: {
      short_text: "Short answer",
      paragraph: "Paragraph",
      multiple_choice: "Multiple choice",
      checkbox: "Checkboxes",
      dropdown: "Dropdown",
      linear_scale: "Linear scale",
      matrix: "Matrix / grid (cross-tab)",
      number: "Number",
      date: "Date",
    },
    font: {
      default: "Default",
      googleSans: "Google Sans",
      roboto: "Roboto",
      georgia: "Georgia (serif)",
      timesNewRoman: "Times New Roman",
      arial: "Arial",
      verdana: "Verdana",
      courierNew: "Courier New (monospace)",
      comicSans: "Comic Sans",
    },
  },
  ru: {
    appName: "📊 Формы",
    yourForms: "Ваши формы",
    newForm: "+ Новая форма",
    loading: "Загрузка…",
    noFormsYet: "Пока нет форм. Создайте первую, чтобы начать.",
    deleteFormConfirm: "Удалить эту форму и все ответы на неё?",
    delete: "Удалить",
    untitledForm: "Без названия",
    questionsCount: ["{{n}} вопрос", "{{n}} вопроса", "{{n}} вопросов"],
    responsesCount: ["{{n}} ответ", "{{n}} ответа", "{{n}} ответов"],
    tabQuestions: "Вопросы",
    tabResponses: "Ответы",
    tabPreview: "Просмотр / Заполнить ↗",
    formDescriptionPlaceholder: "Описание формы",
    addQuestion: "+ Добавить вопрос",
    saveForm: "Сохранить форму",
    saving: "Сохранение…",
    savedAt: "Сохранено {{time}}",
    questionPlaceholder: "Вопрос",
    descriptionOptionalPlaceholder: "Описание (необязательно)",
    moveUp: "Переместить вверх",
    moveDown: "Переместить вниз",
    addOption: "+ Добавить вариант",
    optionN: "Вариант {{n}}",
    shuffleLabel: "Перемешивать порядок ответов для каждого респондента",
    shuffledBadge: "🔀 Перемешивается для каждого респондента",
    addOtherLabel: "Добавить «Другое» — респондент сможет написать свой вариант вместо выбора из списка",
    otherLabel: "Другое:",
    freeText: "свободный текст",
    titleFont: "Шрифт заголовка",
    descriptionFont: "Шрифт описания",
    image: "Изображение",
    removeImage: "✕ Удалить изображение",
    rowsLabel: "Строки (утверждения)",
    addRow: "+ Добавить строку",
    rowN: "Строка {{n}}",
    columnsLabel: "Столбцы (варианты ответов)",
    addColumn: "+ Добавить столбец",
    columnN: "Столбец {{n}}",
    yes: "Да",
    no: "Нет",
    rowsCount: ["{{n}} строка", "{{n}} строки", "{{n}} строк"],
    columnsCount: ["{{n}} столбец", "{{n}} столбца", "{{n}} столбцов"],
    matrixExample: " — например, «{{row}}»",
    from: "От",
    to: "До",
    scaleSummary: "Шкала {{min}} – {{max}}",
    longAnswerPlaceholder: "Развёрнутый ответ",
    shortAnswerPlaceholder: "Короткий ответ",
    duplicate: "Дублировать",
    requiredLabel: "Обязательный",
    choose: "Выберите",
    responseRecorded: "Ответ принят",
    thanksForFilling: "Спасибо за заполнение формы «{{title}}».",
    submit: "Отправить",
    answeredSkipped: "{{answered}} ответили · {{skipped}} пропустили",
    mean: "Среднее",
    median: "Медиана",
    mode: "Мода",
    stdDev: "Станд. откл.",
    min: "Мин",
    max: "Макс",
    earliest: "Самый ранний",
    latest: "Самый поздний",
    avgWordCount: "Среднее число слов: {{n}}",
    noResponsesYet: "Пока нет ответов — поделитесь ссылкой на форму, чтобы начать сбор данных.",
    questionType: {
      short_text: "Короткий ответ",
      paragraph: "Развёрнутый ответ",
      multiple_choice: "Один из списка",
      checkbox: "Несколько из списка (флажки)",
      dropdown: "Раскрывающийся список",
      linear_scale: "Шкала",
      matrix: "Таблица / матрица (кросс-табуляция)",
      number: "Число",
      date: "Дата",
    },
    font: {
      default: "По умолчанию",
      googleSans: "Google Sans",
      roboto: "Roboto",
      georgia: "Georgia (с засечками)",
      timesNewRoman: "Times New Roman",
      arial: "Arial",
      verdana: "Verdana",
      courierNew: "Courier New (моноширинный)",
      comicSans: "Comic Sans",
    },
  },
};

export const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];

function interpolate(str, vars) {
  if (!vars) return str;
  let out = str;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

function getPath(obj, key) {
  return key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && STRINGS[saved]) return saved;
    } catch {
      // ignore — localStorage may be unavailable
    }
    return "en";
  });

  const setLang = useCallback((l) => {
    if (!STRINGS[l]) return;
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  // t: plain string lookup, with {{var}} interpolation.
  const t = useCallback(
    (key, vars) => {
      const value = getPath(STRINGS[lang], key) ?? getPath(STRINGS.en, key) ?? key;
      return typeof value === "string" ? interpolate(value, vars) : value;
    },
    [lang]
  );

  // tn: pluralized lookup — the dictionary entry must be an array of forms
  // (2 forms for English, 3 for Russian). {{n}} is filled in automatically.
  const tn = useCallback(
    (key, count, vars) => {
      const forms = getPath(STRINGS[lang], key) ?? getPath(STRINGS.en, key);
      if (!Array.isArray(forms)) return t(key, { n: count, ...vars });
      const idx = lang === "ru" ? ruPluralIndex(count) : enPluralIndex(count);
      const form = forms[idx] ?? forms[forms.length - 1];
      return interpolate(form, { n: count, ...vars });
    },
    [lang, t]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tn }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
