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
    requiredLabel: "Required question",
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
    rowsFreeTextHint: "Tick ✍️ next to a row to replace the column choices in that row with a free-text box where respondents write their own answer.",
    rowFreeTextLabel: "Free-text row — respondent writes their own answer instead of picking a column",
    someRowsFreeText: "some rows are free-text",
    filterBadge: "🔎 Filter question",
    filterToggleLabel: "This is a filter question — screen respondents before showing the rest of the form",
    filterQualifyingHint: "Check which answers let a respondent continue to the rest of the form:",
    filterDisqualifyMessagePlaceholder: "Message shown to respondents who don't qualify (optional)",
    filterContinueButton: "Continue",
    filterDefaultDisqualifyMessage: "Thank you for your interest — this survey isn't intended for you based on your answer.",
    filterNoQualifying: "⚠️ Tick at least one answer — until then the filter is inactive.",
    conditionToggleLabel: "Show or hide this question depending on an earlier answer",
    conditionModeHide: "Hide this question if the answer is…",
    conditionModeShow: "Show this question only if the answer is…",
    conditionSourceLabel: "Earlier question:",
    conditionOptionsHint: "Answers that trigger the rule:",
    conditionNoEligible: "To use this, add a choice question (multiple choice, checkboxes or dropdown) above this one.",
    conditionBrokenWarning: "⚠️ The rule is inactive: its source question must be above this question.",
    conditionNoOptionsSelected: "⚠️ Tick at least one answer — until then the rule is inactive.",
    conditionStaleOption: "(this answer no longer exists)",
    conditionCopyAbove: "Copy the rule from the question above",
    conditionBadgeShow: "↳ Shown only if question {{n}} is: {{options}}",
    conditionBadgeHide: "↳ Hidden if question {{n}} is: {{options}}",
    formSettingsTitle: "Form settings",
    timeLimitLabel: "Time limit for completing the form, in minutes (leave empty for no limit)",
    showProgressLabel: "Show respondents the completion percentage",
    timerIntro: "You have {{minutes}} min to complete this form. The timer starts when you press “Start”. When time runs out, the answers you have entered so far are submitted automatically.",
    startButton: "Start",
    timeLeft: "Time left: {{time}}",
    progressLabel: "Completed: {{percent}}%",
    timeUpSubmitted: "Time is up — your answers were submitted as filled in so far.",
    timedOutCount: "ended by timer: {{n}}",
    requiredQuestionError: "This question is required",
    formHasErrors: "Some questions need attention — they are highlighted in red (required questions are marked with *).",
    requiredCount: "Required questions: {{required}} of {{total}}",
    numberLimitsLabel: "Allowed values (optional)",
    numberRangeInvalid: "⚠️ The minimum is greater than the maximum.",
    numberPreviewBoth: "Number from {{min}} to {{max}}",
    numberPreviewMin: "Number, not less than {{min}}",
    numberPreviewMax: "Number, not more than {{max}}",
    numberErrorBoth: "Enter a number from {{min}} to {{max}}",
    numberErrorMin: "Enter a number not less than {{min}}",
    numberErrorMax: "Enter a number not more than {{max}}",
    numberErrorInvalid: "Enter a valid number",
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
    requiredLabel: "Обязательный вопрос",
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
    rowsFreeTextHint: "Отметьте ✍️ рядом со строкой, чтобы вместо выбора столбцов в этой строке появилось поле для свободного ответа — респондент впишет туда своё мнение.",
    rowFreeTextLabel: "Строка со свободным ответом — респондент пишет свой текст вместо выбора столбца",
    someRowsFreeText: "есть строки со свободным ответом",
    filterBadge: "🔎 Вопрос-фильтр",
    filterToggleLabel: "Это вопрос-фильтр — проверять ответ перед показом остальной анкеты",
    filterQualifyingHint: "Отметьте варианты, с которыми респондент будет допущен к остальной анкете:",
    filterDisqualifyMessagePlaceholder: "Сообщение для тех, кто не подходит (необязательно)",
    filterContinueButton: "Продолжить",
    filterDefaultDisqualifyMessage: "Спасибо за интерес — этот опрос не предназначен для вас, судя по вашему ответу.",
    filterNoQualifying: "⚠️ Отметьте хотя бы один вариант — пока фильтр не работает.",
    conditionToggleLabel: "Показывать или скрывать этот вопрос в зависимости от ответа на предыдущий вопрос",
    conditionModeHide: "Скрывать этот вопрос, если ответ…",
    conditionModeShow: "Показывать этот вопрос, только если ответ…",
    conditionSourceLabel: "Предыдущий вопрос:",
    conditionOptionsHint: "Варианты ответа, при которых правило срабатывает:",
    conditionNoEligible: "Чтобы включить условие, добавьте выше вопрос с выбором ответа (один из списка, флажки или раскрывающийся список).",
    conditionBrokenWarning: "⚠️ Условие не действует: вопрос-источник должен находиться выше этого вопроса.",
    conditionNoOptionsSelected: "⚠️ Отметьте хотя бы один вариант — пока условие не действует.",
    conditionStaleOption: "(такого варианта больше нет)",
    conditionCopyAbove: "Скопировать условие из вопроса выше",
    conditionBadgeShow: "↳ Показывается, только если в вопросе №{{n}} выбрано: {{options}}",
    conditionBadgeHide: "↳ Скрывается, если в вопросе №{{n}} выбрано: {{options}}",
    formSettingsTitle: "Настройки формы",
    timeLimitLabel: "Ограничение времени на прохождение, в минутах (пусто — без ограничения)",
    showProgressLabel: "Показывать респондентам процент прохождения",
    timerIntro: "На прохождение анкеты даётся {{minutes}} мин. Таймер запустится после нажатия «Начать». Когда время выйдет, уже введённые ответы будут отправлены автоматически.",
    startButton: "Начать",
    timeLeft: "Осталось: {{time}}",
    progressLabel: "Заполнено: {{percent}}%",
    timeUpSubmitted: "Время вышло — ваши ответы отправлены в том виде, в каком были заполнены.",
    timedOutCount: "завершили по таймеру: {{n}}",
    requiredQuestionError: "Это обязательный вопрос",
    formHasErrors: "Нужно поправить некоторые ответы — эти вопросы выделены красным (обязательные отмечены *).",
    requiredCount: "Обязательных вопросов: {{required}} из {{total}}",
    numberLimitsLabel: "Допустимые значения (необязательно)",
    numberRangeInvalid: "⚠️ Минимум больше максимума.",
    numberPreviewBoth: "Число от {{min}} до {{max}}",
    numberPreviewMin: "Число не меньше {{min}}",
    numberPreviewMax: "Число не больше {{max}}",
    numberErrorBoth: "Введите число от {{min}} до {{max}}",
    numberErrorMin: "Введите число не меньше {{min}}",
    numberErrorMax: "Введите число не больше {{max}}",
    numberErrorInvalid: "Введите число",
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
