/* ============================================================
   首页逻辑：进度仪表、核心入口、精选问题、课程目录
   ============================================================ */
(function () {
  const TOTAL = 38;

  const ENTRIES = [
    { en: "FOUNDATIONS", zh: "社会学基础", desc: "导论 · 起源 · 方法 · 理论框架", target: "ch01" },
    { en: "SOCIOLOGICAL IMAGINATION", zh: "社会学想象力", desc: "米尔斯 · 个人与结构", target: "ch17" },
    { en: "CLASSICAL THEORY", zh: "社会学经典理论", desc: "马克思 · 涂尔干 · 韦伯 · 布迪厄", target: "ch21" },
    { en: "ADVANCED STUDIES", zh: "专题研究", desc: "阶层 · 教育 · 数字社会", target: "ch31" },
    { en: "RESEARCH METHODS", zh: "社会学研究方法", desc: "定量 · 定性 · 伦理", target: "ch03" },
    { en: "EXAMINATION", zh: "阶段测验", desc: "四大考核层次", target: "ch01" }
  ];

  const FEATURED = [
    { q: "为什么社会阶层会代际传递？", target: "ch07" },
    { q: "个人的成功究竟取决于能力，还是社会结构？", target: "ch08" },
    { q: "教育究竟是促进社会流动，还是再生产社会不平等？", target: "ch10" },
    { q: "现代社会为什么越来越依赖组织和制度？", target: "ch06" }
  ];

  function fmtTime(sec) {
    return Math.floor(sec / 60);
  }

  function renderDash() {
    const done = Store.getDoneCount();
    document.getElementById("dash-progress").textContent = Math.round(done / TOTAL * 100) + "%";
    document.getElementById("dash-done").innerHTML = done + '<span class="unit">/' + TOTAL + '</span>';
    document.getElementById("dash-time").innerHTML = fmtTime(Store.getStudyTime()) + '<span class="unit">分钟</span>';
  }

  function renderCurrentStage() {
    const done = Store.getDoneCount();
    let stageText;
    if (done === 0) stageText = "尚未开始。建议从「第一章 什么是社会学」起步，建立社会学的想象力。";
    else if (done < 4) stageText = "当前处于 PART I 社会学导论阶段，正在打基础。";
    else if (done < 8) stageText = "当前处于 PART II 社会结构与社会关系阶段。";
    else stageText = "已进入系统学习阶段。";
    document.getElementById("stage-text").textContent = "当前学习阶段：" + stageText;

    // 最近学习章节
    const p = Store.getProgress();
    let recent = null, latest = 0;
    for (const k in p) { if (p[k].at > latest) { latest = p[k].at; recent = k; } }
    document.getElementById("recent-text").textContent = recent
      ? "最近学习章节：第 " + recent.replace("ch", "") + " 章"
      : "最近学习章节：暂无记录";
  }

  function renderEntries() {
    const wrap = document.getElementById("entries");
    wrap.innerHTML = ENTRIES.map((e, i) =>
      '<a class="entry" href="reader.html?ch=' + e.target + '">' +
      '<span class="en-idx">' + String(i + 1).padStart(2, "0") + '</span>' +
      '<div class="en-body"><div class="en-en">' + e.en + '</div>' +
      '<div class="en-zh">' + e.zh + '</div>' +
      '<div class="en-desc">' + e.desc + '</div></div>' +
      '<span class="chev">' + Icons.chevron + '</span></a>'
    ).join("");
  }

  function renderFeatured() {
    document.getElementById("featured-questions").innerHTML = FEATURED.map(f =>
      '<div class="q-item"><div class="q-text">' + Render.esc(f.q) + '</div>' +
      '<a class="q-link" href="reader.html?ch=' + f.target + '">进入对应章节 →</a></div>'
    ).join("");
  }

  function renderCatalog() {
    fetch("data/catalog.json").then(r => r.json()).then(data => {
      const wrap = document.getElementById("catalog");
      wrap.innerHTML = data.parts.map(part => {
        const chs = part.chapters.map(ch => {
          const done = Store.isDone(ch.id);
          const cls = done ? "chapter done" : "chapter";
          return '<a class="' + cls + '" href="reader.html?ch=' + ch.id + '">' +
            '<span class="ch-no">' + String(ch.no).padStart(2, "0") + '</span>' +
            '<span class="ch-title">' + Render.esc(ch.title) + '</span>' +
            '<span class="ch-state">' + (done ? "已完成" : "未读") + '</span>' +
            '<span class="chev" style="color:var(--text-sub)">' + Icons.chevron + '</span></a>';
        }).join("");
        return '<div class="part">' +
          '<div class="part-head"><span class="part-num">PART ' + part.num + '</span>' +
          '<div><div class="part-title">' + Render.esc(part.zh) + '</div>' +
          '<div class="part-en">' + part.en + '</div></div></div>' +
          '<div class="chapter-list">' + chs + '</div></div>';
      }).join("");
    });
  }

  function init() {
    renderDash();
    renderCurrentStage();
    renderEntries();
    renderFeatured();
    renderCatalog();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
