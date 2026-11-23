(function reportModule(root) {
  "use strict";
  const model =
    typeof module !== "undefined" ? require("./local-data.js") : root;
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  function grades(rows) {
    const ranked = rows
      .filter(
        (r) =>
          r &&
          Number.isFinite(r.accuracy) &&
          r.accuracy >= 0 &&
          r.accuracy <= 100,
      )
      .sort((a, b) => b.accuracy - a.accuracy);
    let rank = 0;
    return ranked.map((r, i) => {
      // Competition ranking: 1, 1, 3. A tied group keeps its first position.
      if (i === 0 || r.accuracy !== ranked[i - 1].accuracy) rank = i + 1;
      const percentile = ranked.length === 1 ? 0 : (rank / ranked.length) * 100;
      const grade =
        percentile <= 20
          ? "A"
          : percentile <= 40
            ? "B"
            : percentile <= 70
              ? "C"
              : "D";
      return { ...r, rank, percentile, grade };
    });
  }
  function aggregate(files) {
    const records = [],
      warnings = [];
    let excluded = 0;
    const seen = new Set(),
      profiles = new Map();
    for (const file of files) {
      const d = file.data;
      if (!d || !Array.isArray(d.records))
        throw Error(file.name + ": records 배열이 없습니다.");
      const p = model.validProfile(d.profile)
        ? d.profile
        : { id: "", name: "정보 없음" };
      if (p.id) profiles.set(p.id, p);
      for (const r of d.records) {
        if (!model.validRecord(r)) {
          excluded++;
          continue;
        }
        const studentId = r.studentId || p.id;
        const key = JSON.stringify([
          studentId,
          r.id || [r.date, r.mode, r.score, r.total],
        ]);
        if (seen.has(key)) continue;
        seen.add(key);
        records.push({
          ...r,
          studentId,
          name: r.name || p.name,
          accuracy: r.correct == null ? null : (r.correct / r.total) * 100,
        });
      }
    }
    const latest = new Map();
    for (const r of records) {
      if (
        !r.studentId ||
        r.completed === false ||
        !r.completedAt ||
        !Number.isFinite(Date.parse(r.completedAt))
      ) {
        excluded++;
        continue;
      }
      const old = latest.get(r.studentId);
      if (
        !old ||
        Date.parse(r.completedAt) > Date.parse(old.completedAt) ||
        (r.completedAt === old.completedAt && String(r.id) > String(old.id))
      )
        latest.set(r.studentId, r);
    }
    const rows = grades([...latest.values()]);
    const unknown = [...latest.values()]
      .filter((r) => r.accuracy == null)
      .map((r) => ({ ...r, rank: null, percentile: null, grade: "미수집" }));
    const known = records.filter((r) => r.accuracy != null);
    const categories = Object.create(null);
    for (const r of records)
      for (const [name, v] of Object.entries(r.categories || {})) {
        if (
          !v ||
          !Number.isInteger(v.correct) ||
          !Number.isInteger(v.total) ||
          v.total <= 0 ||
          v.correct < 0 ||
          v.correct > v.total
        )
          continue;
        const c = (categories[name] ||= { correct: 0, total: 0 });
        c.correct += v.correct;
        c.total += v.total;
      }
    if (excluded)
      warnings.push(
        "잘못된 기록 또는 학생 ID·완료 시각이 없는 응시는 등급에서 제외됩니다.",
      );
    return {
      students: new Set(records.map((r) => r.studentId).filter(Boolean)).size,
      attempts: records.length,
      averageAccuracy: known.length
        ? (known.reduce((s, r) => s + r.correct, 0) /
            known.reduce((s, r) => s + r.total, 0)) *
          100
        : null,
      bestScore: records.length
        ? Math.max(...records.map((r) => r.score))
        : null,
      averageScore: records.length
        ? records.reduce((s, r) => s + r.score, 0) / records.length
        : null,
      categories,
      rows: [...rows, ...unknown],
      excluded,
      warnings,
      sources: files.map((f) => f.name),
    };
  }
  const policy =
    "학생별 최신 완료 응시 1건의 정답률(0~100%)을 내림차순 비교합니다(서로 다른 모드·문항 구성의 난이도는 보정하지 않음). 순위 = 나보다 정답률이 높은 학생 수+1(동점은 1·1·3 방식). 상위 위치 = 순위 ÷ 평가 학생 수 ×100. A: 20% 이하, B: 20% 초과~40% 이하, C: 40% 초과~70% 이하, D: 70% 초과. 소표본도 동일 식을 적용하며 반올림하거나 등급별 인원을 강제 배정하지 않습니다. 예외로 평가 학생 1명은 상위 위치 0%로 A입니다. 2명은 동점이 없으면 C·D, 모두 동점이면 C·C입니다. 동점은 같은 순위·등급이며 실제 등급 비율은 달라질 수 있습니다. 정답 수·완료 시각·학생 ID가 없는 구기록은 추정하지 않습니다.";
  const headers = [
    "학생ID",
    "이름",
    "순위",
    "점수",
    "문항수",
    "정답수",
    "정답률",
    "모드",
    "완료시각",
    "등급",
  ];
  const englishHeaders = [
    "Student ID",
    "Name",
    "Rank",
    "Score",
    "Questions",
    "Correct",
    "Accuracy",
    "Mode",
    "Completed at",
    "Grade",
  ];
  const englishPolicy =
    "Students are ranked by the accuracy of their latest completed attempt. Different modes and question sets are not adjusted for difficulty. Competition ranking uses 1, 1, 3 for ties. Percentile = rank / number of graded students × 100. A ≤ 20%; B ≤ 40%; C ≤ 70%; D > 70%. One student receives A at percentile 0. Two students with different accuracies receive C and D; a tie gives both C. Missing correct-answer counts, completion times or student IDs are never inferred. Grades describe this imported cohort only.";
  function modeLabel(mode, lang) {
    return lang === "en"
      ? {
          전체: "All subjects",
          스피드: "Speed",
          한국사: "Korean history",
          과학: "Science",
          지리: "Geography",
          "예술과 문화": "Arts & culture",
          all: "All subjects",
          category: "By subject",
          speed: "Speed",
          review: "Review",
          daily: "Daily mix",
        }[mode] || mode
      : {
          all: "전체",
          category: "카테고리",
          speed: "스피드",
          review: "오답 복습",
          daily: "오늘의 퀴즈",
        }[mode] || mode;
  }
  function values(r, lang = "ko") {
    return [
      r.studentId,
      r.name,
      r.rank ?? "",
      r.score,
      r.total,
      r.correct ?? "",
      r.accuracy == null ? "" : r.accuracy.toFixed(2),
      modeLabel(r.mode, lang),
      r.completedAt,
      lang === "en" && r.grade === "미수집" ? "Not recorded" : r.grade,
    ];
  }
  function csv(data, lang = "ko") {
    const cell = (v) => {
      let s = String(v ?? "");
      if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    return (
      "\uFEFF" +
      [
        lang === "en" ? englishHeaders : headers,
        ...data.rows.map((r) => values(r, lang)),
      ]
        .map((row) => row.map(cell).join(","))
        .join("\r\n") +
      "\r\n"
    );
  }
  function reportBody(data, lang = "ko") {
    if (lang === "en") return englishBody(data);
    const fmt = (n) => (n == null ? "미수집" : n.toFixed(1));
    const distribution = ["A", "B", "C", "D"].map((grade) => ({
      grade,
      count: data.rows.filter((r) => r.grade === grade).length,
    }));
    const graded = distribution.reduce((sum, item) => sum + item.count, 0);
    const metrics = [
      ["전체 학생", data.students, "명", "고유 학생 ID 기준"],
      ["누적 응시", data.attempts, "건", "중복 응시를 제외한 기록"],
      [
        "평균 정답률",
        fmt(data.averageAccuracy),
        data.averageAccuracy == null ? "" : "%",
        "정답 수가 있는 전체 응시 기준",
      ],
      [
        "최고 점수",
        fmt(data.bestScore),
        data.bestScore == null ? "" : "점",
        "평균 점수 " + fmt(data.averageScore),
      ],
    ];
    return `<section class="metrics" aria-label="학습 요약">${metrics.map(([label, value, unit, note]) => `<article class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}<small>${unit}</small></div><p>${note}</p></article>`).join("")}</section>
      <div class="insights"><section class="panel"><div class="section-head"><div><h2>등급별 학습 현황</h2></div><span class="chip">평가 ${graded}명</span></div><div class="grade-stack" aria-hidden="true">${distribution.map(({ grade, count }) => `<span class="segment grade-${grade}" style="flex:${count}" title="${grade} ${count}명"></span>`).join("")}</div><div class="grade-legend">${distribution.map(({ grade, count }) => `<div><span class="grade-dot grade-${grade}"></span><b>${grade}</b><strong>${count}<small>명</small></strong><p>${graded ? ((count / graded) * 100).toFixed(0) : 0}%</p></div>`).join("")}</div><p class="muted">학생별 최신 완료 응시 기준 · 동점자는 동일 등급</p></section>
      <section class="panel"><div class="section-head"><div><h2>분야별 정답률</h2></div><span class="chip">전체 응시</span></div><div class="subjects">${
        Object.entries(data.categories)
          .map(
            ([name, v]) =>
              `<div class="subject"><div><b>${esc(name)}</b><span>${((v.correct / v.total) * 100).toFixed(1)}% <small>(${v.correct}/${v.total})</small></span></div><div class="track"><span style="width:${(v.correct / v.total) * 100}%"></span></div></div>`,
          )
          .join("") || '<p class="muted">분야별 기록이 아직 없습니다.</p>'
      }</div></section></div>
      <section class="panel students"><div class="section-head"><div><h2>학생별 성적</h2></div><span class="chip">${data.rows.length}명 표시</span></div><p class="muted">정답률 내림차순 · 학생별 최신 완료 응시 1건</p>${data.attempts ? "" : '<div class="empty-state"><b>아직 가져온 학생 기록이 없습니다.</b><p>게임에서 기록 JSON을 내보낸 뒤 위의 학생 기록 가져오기를 이용하세요.</p></div>'}<div class="scroll"><table><thead><tr>${headers.map((h) => '<th scope="col">' + h + "</th>").join("")}</tr></thead><tbody>${data.rows
        .map(
          (r) =>
            '<tr class="student-row grade-' +
            (distribution.some((g) => g.grade === r.grade)
              ? r.grade
              : "unknown") +
            '">' +
            values(r)
              .map((v) => "<td>" + esc(v) + "</td>")
              .join("") +
            "</tr>",
        )
        .join("")}</tbody></table></div></section>
      <section class="report-notes"><details><summary>상대평가 기준과 집계 안내</summary><p>${esc(policy)}</p><p>원점수 평균은 서로 다른 만점이 섞일 수 있어 참고용입니다. 정답 수가 없는 기록은 정답률·등급을 추정하지 않습니다.</p></details><details><summary>가져온 자료 ${data.sources.length}개 · 제외 ${data.excluded}건</summary><p>${esc(data.sources.join(", ") || "가져온 파일 없음")}</p><p>${data.warnings.map(esc).join(" ")}</p></details></section><footer class="report-footer"><b>QUIZ LAB</b><span>배움의 기록을, 다음 성장의 시작으로.</span><small>HTML·CSV 동일 집계 · 브라우저 인쇄로 PDF 저장</small></footer>`;
  }
  function englishBody(data) {
    const fmt = (n) => (n == null ? "Not recorded" : n.toFixed(1));
    const distribution = ["A", "B", "C", "D"].map((grade) => ({
      grade,
      count: data.rows.filter((r) => r.grade === grade).length,
    }));
    const graded = distribution.reduce((sum, item) => sum + item.count, 0);
    const metrics = [
      ["Students", data.students, "Unique student IDs"],
      ["Attempts", data.attempts, "Duplicate attempts removed"],
      [
        "Accuracy",
        data.averageAccuracy == null ? "—" : fmt(data.averageAccuracy) + "%",
        "Across attempts with correct-answer counts",
      ],
      [
        "Best score",
        data.bestScore ?? "—",
        "Average score: " + fmt(data.averageScore),
      ],
    ];
    return `<section class="metrics" aria-label="Learning summary">${metrics.map(([label, value, note]) => `<article class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><p>${note}</p></article>`).join("")}</section>
      <div class="insights"><section class="panel"><div class="section-head"><div><h2>How the class is doing</h2></div><span class="chip">${graded} graded</span></div><div class="grade-stack" aria-hidden="true">${distribution.map(({ grade, count }) => `<span class="segment grade-${grade}" style="flex:${count}"></span>`).join("")}</div><div class="grade-legend">${distribution.map(({ grade, count }) => `<div><span class="grade-dot grade-${grade}"></span><b>${grade}</b><strong>${count}</strong><p>${graded ? ((count / graded) * 100).toFixed(0) : 0}%</p></div>`).join("")}</div><p class="muted">Latest completed attempt per student. Ties share a grade.</p></section>
      <section class="panel"><div class="section-head"><div><h2>Accuracy by subject</h2></div><span class="chip">All attempts</span></div><div class="subjects">${
        Object.entries(data.categories)
          .map(
            ([name, v]) =>
              `<div class="subject"><div><b>${esc(modeLabel(name, "en"))}</b><span>${((v.correct / v.total) * 100).toFixed(1)}% <small>(${v.correct}/${v.total})</small></span></div><div class="track"><span style="width:${(v.correct / v.total) * 100}%"></span></div></div>`,
          )
          .join("") || '<p class="muted">No subject results yet.</p>'
      }</div></section></div>
      <section class="panel students"><div class="section-head"><div><h2>Student results</h2></div><span class="chip">${data.rows.length} students shown</span></div><p class="muted">Accuracy, highest first · Latest completed attempt per student</p>${data.attempts ? "" : '<div class="empty-state"><b>No student records imported yet.</b><p>Export a records JSON from the quiz, then select the file above.</p></div>'}<div class="scroll"><table><thead><tr>${englishHeaders.map((h) => '<th scope="col">' + h + "</th>").join("")}</tr></thead><tbody>${data.rows
        .map(
          (r) =>
            '<tr class="student-row grade-' +
            (distribution.some((g) => g.grade === r.grade)
              ? r.grade
              : "unknown") +
            '">' +
            values(r, "en")
              .map((v) => "<td>" + esc(v) + "</td>")
              .join("") +
            "</tr>",
        )
        .join("")}</tbody></table></div></section>
      <section class="report-notes"><details><summary>How rankings and grades work</summary><p>${englishPolicy}</p><p>Raw scores can have different maximums. Accuracy and grades are only calculated when the required data exists.</p></details><details><summary>${data.sources.length} source files · ${data.excluded} excluded records</summary><p>${esc(data.sources.join(", ") || "No files imported")}</p>${data.excluded ? "<p>Invalid records and attempts without a student ID or completion time are excluded from grading.</p>" : ""}</details></section><footer class="report-footer"><b>QUIZ LAB</b><span>A little practice, a clearer picture.</span><small>Matching HTML and CSV · Print to save as PDF</small></footer>`;
  }
  function shell(data, lang) {
    const en = lang === "en",
      t = (ko, eng) => (en ? eng : ko);
    return `<div class="page"><nav class="topbar" aria-label="${t("보고서", "Report")}"><div><a class="brand" href="index.html" style="color:inherit;text-decoration:none">QUIZ <i>LAB</i></a><span class="brand-label">${t("교사용 보고서", "Teacher report")}</span></div><div class="offline"><span class="offline-label">${t("오프라인 보고서", "Offline report")}</span><select id="reportLanguage" aria-label="${t("언어", "Language")}"><option value="ko" ${en ? "" : "selected"}>한국어</option><option value="en" ${en ? "selected" : ""}>English</option></select></div></nav><header class="hero"><div><h1>${t("학생의 배움을 한눈에.", "Learning at a glance.")}</h1><p>${t("기록을 살펴보고, 다음 배움의 방향을 찾아보세요.", "See where students stand and what to work on next.")}</p></div></header><section class="teacher-import" aria-labelledby="importHeading"><div><h2 id="importHeading">${t("선생님 모드 · 학생 기록 가져오기", "Import student records")}</h2><p>${t("학생별 JSON 파일을 선택하면 성적과 상대평가 등급을 다시 계산합니다.", "Select exported JSON files to calculate results and relative grades locally.")}</p></div><div class="import-actions"><label class="file-label">${t("＋ 학생 파일 선택", "＋ Select files")}<input id="teacherFiles" aria-label="${t("학생 기록 JSON", "Student records JSON")}" type="file" accept=".json,application/json" multiple></label><button id="teacherDownload">${t("HTML 저장 ↗", "Save HTML ↗")}</button><button id="teacherCSV">${t("CSV 내보내기 ↓", "Export CSV ↓")}</button></div><p id="teacherStatus" role="status" aria-live="polite">${t("여러 파일을 한 번에 선택하세요. 새로 선택한 자료로 보고서를 교체하며, 갱신 결과는 HTML·CSV로 저장할 수 있습니다.", "Select several files at once. Each selection replaces this report. Save the updated results as HTML or CSV.")}</p></section><main id="reportContent">${reportBody(data, lang)}</main></div>`;
  }
  function mount(initial, initialLanguage = "ko") {
    let current = initial,
      selection = 0;
    const lang = initialLanguage === "en" ? "en" : "ko";
    const input = document.getElementById("teacherFiles");
    const status = document.getElementById("teacherStatus");
    input.onchange = async () => {
      const files = [...input.files],
        version = ++selection;
      if (!files.length) return;
      status.textContent =
        lang === "en" ? "Reading student files…" : "학생 파일을 읽고 있습니다…";
      try {
        const imports = await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            data: JSON.parse((await file.text()).replace(/^\uFEFF/, "")),
          })),
        );
        const next = aggregate(imports);
        if (version !== selection) return;
        document.getElementById("reportContent").innerHTML = reportBody(
          next,
          lang,
        );
        current = next;
        status.textContent =
          lang === "en"
            ? `Updated: ${next.students} students · ${next.attempts} attempts · ${next.excluded} excluded.`
            : `가져온 학생 ${next.students}명 · 응시 ${next.attempts}건 · 제외 ${next.excluded}건. 보고서를 갱신했습니다.`;
      } catch (error) {
        if (version === selection)
          status.textContent =
            lang === "en"
              ? "Import failed. Select a valid records JSON. The existing report was kept."
              : "가져오기 실패: " +
                error.message +
                " · 기존 보고서는 유지됩니다.";
      } finally {
        if (version === selection) input.value = "";
      }
    };
    const download = (name, text, type) => {
      const url = URL.createObjectURL(new Blob([text], { type }));
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    document.getElementById("teacherDownload").onclick = () =>
      download(
        "teacher_report.html",
        html(current, lang),
        "text/html;charset=utf-8",
      );
    document.getElementById("teacherCSV").onclick = () =>
      download(
        "report_detailed.csv",
        csv(current, lang),
        "text/csv;charset=utf-8",
      );
    document.getElementById("reportLanguage").onchange = (event) => {
      selection++;
      const nextLang = event.target.value;
      document.documentElement.lang = nextLang;
      document.title =
        nextLang === "en"
          ? "QUIZ LAB · Class dashboard"
          : "QUIZ LAB · 교사용 보고서";
      document.body.innerHTML = shell(current, nextLang);
      mount(current, nextLang);
    };
  }
  function reportStyles() {
    return `
      :root{--ink:#173a33;--muted:#748079;--paper:#f5f5f0;--line:#e3e7df;--green:#205b49;--gold:#e9bd66;--a:#205b49;--b:#71a58a;--c:#e0bd74;--d:#bdc8bf}
      *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.6 'Segoe UI','Malgun Gothic',system-ui,sans-serif}button,input{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #bd8537;outline-offset:4px}button:hover{filter:brightness(.94)}
      .page{max-width:1360px;margin:auto;padding:0 42px}.topbar{height:88px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.brand{font-size:23px;font-weight:900;letter-spacing:-1px;white-space:nowrap}.brand i{font-style:normal;color:#94a79a}.brand-label{margin-left:22px;padding-left:22px;border-left:1px solid #cbd5cb;font-size:12px;letter-spacing:1px;color:var(--muted)}.offline{display:flex;gap:16px;align-items:center;font-size:12px;color:var(--muted)}.offline-label{white-space:nowrap}#reportLanguage{padding:5px;border:1px solid #cad5c6;border-radius:6px;background:white;color:var(--ink);font:inherit}
      .hero{padding:32px 0 24px}.hero h1{font-size:34px;letter-spacing:-1.5px;line-height:1.3;margin:0 0 12px;font-weight:750}.hero p:last-child{margin:0;color:var(--muted);font-size:14px}
      .teacher-import{background:#e9eee4;border:1px solid #dce4d5;border-radius:16px;padding:22px 26px;margin-bottom:26px;display:grid;grid-template-columns:1fr auto;gap:12px 24px;align-items:center}.teacher-import h2{font-size:17px;letter-spacing:-.5px;margin:0 0 5px}.teacher-import p{margin:0;font-size:12px;color:#647361}.import-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.file-label,button{display:inline-flex;align-items:center;justify-content:center;border:1px solid #cad5c6;background:#fff;color:var(--ink);border-radius:9px;padding:10px 15px;font-weight:600;font-size:12px;white-space:nowrap}.file-label{position:relative;background:var(--green);border-color:var(--green);color:white;cursor:pointer}.file-label input{position:absolute;inset:0;opacity:0;width:100%;cursor:pointer}.file-label:focus-within{outline:3px solid #bd8537;outline-offset:3px}.teacher-import #teacherStatus{grid-column:1/-1;font-size:11px;border-top:1px solid #d7e0cf;padding-top:10px;color:#6a7965}
      .sample-notice{font-size:12px;color:#8b7448;margin:-5px 0 20px}.sample-notice span{font-size:9px;font-weight:800;letter-spacing:1px;background:#f0e6ce;border-radius:4px;padding:4px 7px;margin-right:8px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:22px}.metric{background:#fff;border:1px solid var(--line);padding:22px 24px;border-radius:14px;position:relative;overflow:hidden}.metric:first-child{background:var(--ink);color:#fff;border-color:var(--ink)}.metric-label{font-size:12px;color:var(--muted)}.metric:first-child .metric-label{color:#c5d6c9}.metric-value{font-size:39px;letter-spacing:-1.7px;line-height:1.5;font-weight:650;margin-top:8px;font-variant-numeric:tabular-nums}.metric-value small{font-size:14px;letter-spacing:0;font-weight:500;margin-left:6px;opacity:.6}.metric p{font-size:10px;color:#89978e;margin:4px 0 0}.metric:first-child p{color:#aec5b6}
      .insights{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-bottom:22px}.panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:26px;min-width:0}.section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.section-head h2{font-size:18px;letter-spacing:-.5px;line-height:1.3;margin:0}.chip{border:1px solid #e5e9e1;border-radius:20px;padding:4px 10px;font-size:10px;color:#7b887f;white-space:nowrap}.grade-stack{display:flex;height:18px;border-radius:5px;overflow:hidden;background:#f1f3ee;gap:3px;margin:26px 0}.segment{min-width:0}.grade-A{--grade-color:var(--a)}.grade-B{--grade-color:var(--b)}.grade-C{--grade-color:var(--c)}.grade-D{--grade-color:var(--d)}.segment,.grade-dot{background:var(--grade-color)}.grade-legend{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:15px}.grade-legend>div{border-right:1px solid #edf0e9;padding-left:12px}.grade-legend>div:first-child{padding-left:0}.grade-legend>div:last-child{border:0}.grade-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px}.grade-legend b{font-size:12px}.grade-legend strong{display:block;font-size:26px;font-weight:650;line-height:1.5;margin-top:5px}.grade-legend small{font-size:11px;margin-left:4px;color:var(--muted);font-weight:400}.grade-legend p{margin:0;font-size:11px;color:#89958c}.muted{color:var(--muted);font-size:11px;margin:12px 0 0}.subjects{display:grid;gap:14px}.subject>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;margin-bottom:5px}.subject b{font-weight:500}.subject span{font-size:11px;font-weight:600}.subject small{font-weight:400;color:#9ba79d;margin-left:4px}.track{height:6px;background:#edf1e8;border-radius:5px;overflow:hidden}.track>span{display:block;height:100%;background:#82a68d;border-radius:5px}
      .students{padding:26px 0 0;overflow:hidden}.students>.section-head,.students>.muted{margin-left:26px;margin-right:26px}.students>.muted{margin-top:-8px;margin-bottom:22px}.scroll{width:100%;overflow:auto}table{border-collapse:collapse;width:100%;text-align:left;font-size:11px;white-space:nowrap}th{padding:13px 15px;background:#f4f6f0;color:#7f8d80;font-size:10px;font-weight:600;border-top:1px solid var(--line);border-bottom:1px solid var(--line);position:sticky;top:0}td{padding:15px;border-bottom:1px solid #eef1ea;font-variant-numeric:tabular-nums}tr:last-child td{border-bottom:0}td:first-child{color:#9ca79f;font-size:10px;padding-left:26px}th:first-child{padding-left:26px}td:nth-child(2){font-weight:650}td:nth-child(3){color:#829084}td:nth-child(4),td:nth-child(7){font-weight:650}td:nth-child(8){color:#8b978e;font-size:10px}td:nth-child(9){font-size:10px;color:#99a39c}td:last-child{text-align:center;font-size:13px;font-weight:800;color:var(--grade-color,#859286);background:color-mix(in srgb,var(--grade-color,#859286) 7%,white);border-left:5px solid white;border-right:12px solid white}.student-row.grade-B td:last-child{color:#3c7656}.student-row.grade-C td:last-child{color:#8a651d}.student-row.grade-D td:last-child{color:#647368}tbody tr:hover td{background:#f4f7f0}.empty-state{padding:40px;text-align:center;color:var(--muted)}.empty-state b{color:var(--ink)}.empty-state p{font-size:12px}.report-notes{margin-top:22px;border:1px solid var(--line);border-radius:12px;background:#f0f2ea;padding:0 20px}.report-notes details+details{border-top:1px solid var(--line)}summary{padding:14px 0;cursor:pointer;font-size:12px;color:#6b7a6b}.report-notes p{font-size:12px;color:var(--muted);line-height:1.9;overflow-wrap:anywhere}.report-footer{display:flex;gap:18px;align-items:center;padding:28px 0 35px;color:#9aa69a;font-size:10px}.report-footer b{font-size:12px;letter-spacing:-.4px;color:#6d836e}.report-footer small{margin-left:auto;font-size:9px}
      @media(max-width:1000px){.page{padding:0 24px}.teacher-import{grid-template-columns:1fr}.teacher-import #teacherStatus{grid-column:auto}.metric{padding:18px}.metric-value{font-size:32px}.insights{gap:16px}.panel{padding:22px}.students{padding:22px 0 0}}
      @media(max-width:640px){.page{padding:0 16px}.topbar{height:70px}.brand{font-size:21px}.brand-label{font-size:9px;margin-left:12px;padding-left:12px}.offline{font-size:10px}.hero{padding:28px 0 22px}.hero h1{font-size:27px}.hero p:last-child{font-size:12px}.teacher-import{padding:18px;gap:14px}.teacher-import h2{font-size:15px}.teacher-import p{font-size:11px}.import-actions{gap:6px}.file-label,button{font-size:11px;padding:10px 12px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.metric{padding:16px}.metric-label{font-size:11px}.metric-value{font-size:30px}.metric p{font-size:9px}.insights{grid-template-columns:1fr;gap:14px}.sample-notice{font-size:10px}.panel{padding:20px}.students{padding:20px 0 0}.report-footer{flex-wrap:wrap;gap:8px 16px}.report-footer small{width:100%;margin:0}.section-head h2{font-size:17px}}
      @media(max-width:420px){.topbar{height:60px;gap:10px}.brand-label{display:block;margin:0;padding:0;border:0;font-size:11px;letter-spacing:0}.offline-label{display:none}.hero{padding:18px 0}.hero h1{font-size:23px}.metric{padding:12px}.metric-value{font-size:clamp(19px,7vw,28px)}}
      @media print{.teacher-import,.topbar{display:none}.page{max-width:none;padding:0}.hero{padding:0 0 20px}body{background:white}.panel,.metric,.report-notes{break-inside:avoid;box-shadow:none}.students{break-inside:auto}.scroll{overflow:visible}table{white-space:normal;font-size:9px}td,th{padding:7px}.report-notes{display:none}.metrics{gap:10px}.metric:first-child{background:white;color:var(--ink)}.metric:first-child .metric-label,.metric:first-child p{color:var(--muted)}.report-footer{padding-bottom:0}}
    `;
  }
  function html(data, lang = "ko") {
    lang = lang === "en" ? "en" : "ko";
    const seed = JSON.stringify(data).replace(/</g, "\\u003c");
    const script = `window.validProfile = ${model.validProfile.toString()};\nwindow.validRecord = ${model.validRecord.toString()};\n(${reportModule.toString()})(window);\nwindow.QuizReports.mount(${seed}, '${lang}');`;
    const safeScript = script
      .replace(/\r\n?/g, "\n")
      .replace(/<\/script/gi, "<\\/script");
    return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QUIZ LAB · ${lang === "en" ? "Class dashboard" : "교사용 보고서"}</title><style>${reportStyles()}</style></head><body>${shell(data, lang)}<script>${safeScript}</script></body></html>`;
  }
  const api = { aggregate, grades, html, csv, policy, mount };
  if (typeof module !== "undefined") module.exports = api;
  else root.QuizReports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
