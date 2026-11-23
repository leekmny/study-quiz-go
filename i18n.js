(function (root) {
  "use strict";
  const messages = {
    ko: {
      pageTitle: "QUIZ LAB · 작은 상식 노트",
      teacherDashboard: "선생님 대시보드 ↗",
      heroTitle: "아는 즐거움을, 하나씩.",
      heroLead:
        "한국사부터 과학, 지리와 예술까지. 짧은 퀴즈로 호기심을 채우고 나만의 배움을 쌓아보세요.",
      questionsLabel: "개의 질문",
      subjectsTitle: "문제 분야",
      challengeTitle: "오늘의 도전을 골라보세요",
      modeAll: "골고루 풀기",
      modeAllDesc: "네 분야를 오가며 새롭게",
      modeCategory: "분야별 연습",
      modeCategoryDesc: "관심 있는 주제를 깊게",
      modeSpeed: "스피드 퀴즈",
      modeSpeedDesc: "한 문제에 15초",
      modeReview: "오답 다시 풀기",
      modeReviewDesc: "헷갈렸던 문제를 한 번 더",
      modeDaily: "오늘의 10문제",
      modeDailyDesc: "매일 바뀌는 작은 도전",
      "mode.all": "골고루 풀기",
      "mode.category": "분야별 연습",
      "mode.speed": "스피드 퀴즈",
      "mode.review": "오답 복습",
      "mode.daily": "오늘의 10문제",
      categoryLabel: "도전 분야",
      difficultyLabel: "난이도",
      allDifficulties: "모든 난이도",
      easy: "초급",
      medium: "중급",
      hard: "고급",
      lengthLabel: "문항 수",
      length10: "10문제",
      length20: "20문제",
      lengthAll: "전체 문항",
      start: "퀴즈 시작하기",
      scoringHelp:
        "정답 10점 · 힌트 사용 시 5점 · 숫자 1–4로 선택, Enter로 다음 문제",
      selectedHelp: "문제와 보기 순서는 매번 새롭게 섞입니다.",
      dailyNote: "오늘의 10문제는 난이도·문항 수 설정과 관계없이 고정됩니다.",
      rankingTitle: "나의 최고 기록",
      rankingNote: "이 브라우저에 저장됩니다",
      noRecords: "첫 도전을 마치면 이곳에 기록이 쌓여요.",
      recordLine: "{score}점 · {mode} · {total}문제 · {date}",
      recordLineSingle: "{score}점 · {mode} · {total}문제 · {date}",
      chooseFile: "JSON 파일 선택",
      chooseFiles: "학생 기록 파일 선택",
      profileTitle: "나의 학습 공간",
      profileDescription: "별명 하나로 나만의 배움을 기록하세요.",
      name: "이름",
      namePlaceholder: "학습자 이름",
      profileNamePlaceholder: "별명으로도 충분해요",
      avatar: "아바타",
      saveProfile: "프로필 저장",
      exportRecords: "내 기록 JSON 내보내기",
      importRecords: "내 기록 복원·병합",
      allRecords: "전체 기록 보기",
      teacherMode: "선생님 모드 · 학생 기록 가져오기",
      teacherHelp:
        "학생별로 내보낸 JSON을 선택하세요. 선택한 파일만 읽으며 브라우저 기록을 자동 수집하지 않습니다.",
      downloadHTML: "교사용 HTML 저장",
      downloadCSV: "CSV 저장",
      teacherPreview: "교사용 보고서 미리보기",
      learningTitle: "학습 대시보드",
      learningNote: "완료한 도전을 바탕으로 나의 학습 흐름을 확인해요.",
      privacyNote: "가입 없이, 이 브라우저에만 저장",
      openSettings: "학습 설정",
      languageLabel: "언어",
      hint: "힌트 사용 · 정답 점수 −5",
      home: "그만하기",
      next: "다음 문제 →",
      results: "결과 보기 →",
      restart: "새로운 도전 →",
      retryWrong: "틀린 문제 다시 풀기",
      resultTitle: "오늘도 하나 더 배웠어요.",
      reviewTitle: "틀린 문제 다시 보기",
      footerTagline: "호기심을 기록하는 작은 습관.",
      score: "{score}점",
      seconds: "{seconds}초",
      untimed: "시간 제한 없음",
      timedOut: "시간이 끝났어요",
      correct: "정답입니다! +{points}점",
      incorrect: "정답과 해설을 확인해 보세요.",
      sourceNote: "출처가 있는 문항은 참고 자료를 함께 확인할 수 있어요.",
      sourceLink: "참고 출처 ↗",
      hintText: "힌트: {hint} · 정답 시 5점",
      hintFallback: "오답 보기 두 개를 제외했습니다.",
      hintSource: " · 근거 자료 보기",
      summary: "{score}점 · 정답 {correct}/{total} · 정답률 {accuracy}%",
      reviewAnswer: "내 답: {selected} / 정답: {answer} — {explanation}",
      perfect: "모든 문제를 맞혔습니다!",
      noQuestions: "이 설정에 맞는 문제가 없어요. 다른 설정을 선택해 주세요.",
      emptyReview: "아직 복습할 오답이 없어요. 먼저 퀴즈를 풀어보세요.",
      saveFailed:
        "브라우저 저장소를 사용할 수 없어 이번 기록은 저장되지 않았습니다.",
      learner: "학습자",
      categoryHistory: "한국사",
      categoryScience: "과학",
      categoryGeography: "지리",
      categoryArts: "예술과 문화",
    },
    en: {
      pageTitle: "QUIZ LAB · A little more curious",
      teacherDashboard: "Teacher dashboard ↗",
      heroTitle: "One question. A little wiser.",
      heroLead:
        "Explore Korean history, science, geography, and the arts. Follow your curiosity and make a little room for something new.",
      questionsLabel: "questions",
      subjectsTitle: "Subjects",
      challengeTitle: "Pick your next challenge",
      modeAll: "Mix it up",
      modeAllDesc: "A little of every subject",
      modeCategory: "Pick a subject",
      modeCategoryDesc: "Spend time with what interests you",
      modeSpeed: "Against the clock",
      modeSpeedDesc: "15 seconds for each question",
      modeReview: "Try those again",
      modeReviewDesc: "Revisit the ones you missed",
      modeDaily: "The daily ten",
      modeDailyDesc: "A fresh set, every day",
      "mode.all": "Mixed quiz",
      "mode.category": "Subject practice",
      "mode.speed": "Speed quiz",
      "mode.review": "Missed questions",
      "mode.daily": "The daily ten",
      categoryLabel: "Subject",
      difficultyLabel: "Difficulty",
      allDifficulties: "All levels",
      easy: "Beginner",
      medium: "Intermediate",
      hard: "Advanced",
      lengthLabel: "Session length",
      length10: "10 questions",
      length20: "20 questions",
      lengthAll: "All questions",
      start: "Start a quiz",
      scoringHelp:
        "10 points per answer · 5 with a hint · Keys 1–4 to choose, Enter to continue",
      selectedHelp: "Questions and choices are shuffled each session.",
      dailyNote:
        "Today's 10 questions stay the same, regardless of difficulty or session length.",
      rankingTitle: "Your personal best",
      rankingNote: "Saved in this browser",
      noRecords: "Your first completed quiz will appear here.",
      recordLine: "{score} pts · {mode} · {total} questions · {date}",
      recordLineSingle: "{score} pts · {mode} · {total} question · {date}",
      chooseFile: "Choose a JSON file",
      chooseFiles: "Choose student record files",
      profileTitle: "Your learning space",
      profileDescription: "Choose a name and keep track of your practice.",
      name: "Name",
      namePlaceholder: "Your name",
      profileNamePlaceholder: "A nickname is all you need",
      avatar: "Avatar",
      saveProfile: "Save profile",
      exportRecords: "Export my records as JSON",
      importRecords: "Restore or merge my records",
      allRecords: "View all records",
      teacherMode: "Teacher mode · import student records",
      teacherHelp:
        "Choose JSON files exported by students. Only selected files are read; browser records are never collected automatically.",
      downloadHTML: "Download teacher report",
      downloadCSV: "Download CSV",
      teacherPreview: "Teacher report preview",
      learningTitle: "Learning dashboard",
      learningNote: "A clearer picture of your practice.",
      privacyNote: "No account. Saved in this browser.",
      openSettings: "Session settings",
      languageLabel: "Language",
      hint: "Use a hint · answer worth 5 pts",
      home: "Leave quiz",
      next: "Next question →",
      results: "See results →",
      restart: "Another challenge →",
      retryWrong: "Try missed questions again",
      resultTitle: "A little more learned.",
      reviewTitle: "Questions to revisit",
      footerTagline: "Make a little room for curiosity.",
      score: "{score} pts",
      seconds: "{seconds}s",
      untimed: "No time limit",
      timedOut: "Time's up",
      correct: "Correct! +{points} pts",
      incorrect: "Take a look at the answer and explanation.",
      sourceNote: "When sources are available, follow the links to read more.",
      sourceLink: "Reference ↗",
      hintText: "Hint: {hint} · a correct answer earns 5 pts",
      hintFallback: "Two incorrect choices have been removed.",
      hintSource: " · Read the source",
      summary: "{score} pts · {correct}/{total} correct · {accuracy}% accuracy",
      reviewAnswer:
        "Your answer: {selected} / Correct answer: {answer} — {explanation}",
      perfect: "You got every question right!",
      noQuestions:
        "No questions match these settings. Try a different selection.",
      emptyReview: "No missed questions to review yet. Try a quiz first.",
      saveFailed:
        "Browser storage is unavailable. This attempt could not be saved.",
      learner: "Learner",
      categoryHistory: "Korean history",
      categoryScience: "Science",
      categoryGeography: "Geography",
      categoryArts: "Arts & culture",
    },
  };
  let language = "ko";
  try {
    if (root.localStorage.getItem("quizlab-language") === "en") language = "en";
  } catch {}
  const categories = {
    한국사: "categoryHistory",
    과학: "categoryScience",
    지리: "categoryGeography",
    "예술과 문화": "categoryArts",
  };
  function t(key, vars = {}) {
    const value = messages[language][key] ?? messages.ko[key] ?? key;
    return value.replace(/\{(\w+)\}/g, (_, name) =>
      String(vars[name] ?? `{${name}}`),
    );
  }
  function apply() {
    if (!root.document) return;
    document.documentElement.lang = language;
    document.title = t("pageTitle");
    for (const node of document.querySelectorAll(
      "[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria-label]",
    )) {
      if (node.dataset.i18n) node.textContent = t(node.dataset.i18n);
      for (const [property, attribute] of [
        ["i18nPlaceholder", "placeholder"],
        ["i18nTitle", "title"],
        ["i18nAriaLabel", "aria-label"],
      ])
        if (node.dataset[property])
          node.setAttribute(attribute, t(node.dataset[property]));
    }
    const select = document.getElementById("language");
    if (select) select.value = language;
  }
  function setLanguage(value) {
    language = value === "en" ? "en" : "ko";
    try {
      root.localStorage.setItem("quizlab-language", language);
    } catch {}
    apply();
    if (root.document)
      document.dispatchEvent(
        new CustomEvent("languagechange", { detail: { language } }),
      );
  }
  const api = {
    get lang() {
      return language;
    },
    t,
    category: (c) => (categories[c] ? t(categories[c]) : c),
    difficulty: (d) => t(d),
    setLanguage,
    apply,
    messages,
  };
  root.I18n = api;
  if (typeof module !== "undefined") module.exports = api;
  apply();
  const select = root.document?.getElementById("language");
  if (select) select.onchange = () => setLanguage(select.value);
})(typeof globalThis !== "undefined" ? globalThis : this);
