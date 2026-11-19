/* ============================================================
   阅读页逻辑：加载课程、渲染正文、进度/书签/笔记/重点、
   字体调整、夜间模式、章节测试与错题本
   ============================================================ */
(function () {
  let CATALOG = null;      // 全局目录
  let COURSE = null;       // 当前课程数据
  let CH_ID = null;        // 当前章节 id
  let startTime = Date.now();

  /* ---------- 工具：获取 URL 参数 ---------- */
  function getParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  /* ---------- 初始化图标按钮 ---------- */
  function initIcons() {
    document.getElementById("btn-home").innerHTML = Icons.home;
    document.getElementById("btn-toc").innerHTML = Icons.menu;
    document.getElementById("tb-night").innerHTML = Icons.moon;
  }

  /* ---------- 偏好恢复 ---------- */
  function applyPrefs() {
    const p = Store.getPrefs();
    document.documentElement.style.setProperty("--read-scale", p.scale);
    if (p.night) {
      document.body.classList.add("night");
      document.getElementById("tb-night").innerHTML = Icons.sun;
      document.getElementById("tb-night").classList.add("on");
    }
  }

  /* ---------- 定位章节在目录中的位置 ---------- */
  function locateChapter() {
    let prev = null, next = null, found = false;
    for (let i = 0; i < CATALOG.parts.length; i++) {
      const chs = CATALOG.parts[i].chapters;
      for (let j = 0; j < chs.length; j++) {
        if (chs[j].id === CH_ID) { found = true; continue; }
        if (!found) prev = chs[j];
        else if (!next) { next = chs[j]; break; }
      }
      if (next) break;
    }
    return { prev, next };
  }

  function chapterNum() {
    for (const p of CATALOG.parts) for (const c of p.chapters) if (c.id === CH_ID) return c.no;
    return CH_ID.replace("ch", "");
  }

  /* ---------- 渲染标题区 ---------- */
  function renderTitle() {
    let partZh = "", partEn = "", partNum = "";
    for (const p of CATALOG.parts) {
      for (const c of p.chapters) {
        if (c.id === CH_ID) { partZh = p.zh; partEn = p.en; partNum = p.num; }
      }
    }
    document.getElementById("crumb-part").textContent = "PART " + partNum + " " + partEn;
    document.getElementById("crumb-ch").textContent = "第 " + chapterNum() + " 章";
    document.getElementById("reader-kicker").textContent = "CHAPTER " + String(chapterNum()).padStart(2, "0") + " · " + COURSE.titleEn;
    document.getElementById("reader-title").textContent = "第 " + chapterNum() + " 章 " + COURSE.title;
    document.getElementById("reader-meta").innerHTML =
      '<span>' + COURSE.source + '</span>' +
      '<span>约 ' + COURSE.readingTime + ' 分钟</span>' +
      (COURSE.keywords || []).map(k => '<span>' + Render.esc(k) + '</span>').join("");
  }

  /* ---------- 渲染导读 ---------- */
  function renderIntro() {
    const el = document.getElementById("intro");
    el.innerHTML = '<h2>章节导读</h2><p>' + Render.esc(COURSE.intro) + '</p>';
  }

  /* ---------- 渲染正文 ---------- */
  function renderBody() {
    const el = document.getElementById("body");
    el.innerHTML = COURSE.sections.map(s =>
      '<h2 id="sec-' + s.id + '">' + Render.esc(s.heading) + '</h2>' +
      Render.renderContent(s.content)
    ).join("");
  }

  function renderCases() {
    const el = document.getElementById("cases");
    el.innerHTML = '<h2>现实案例分析</h2>' + Render.renderCases(COURSE.cases);
  }

  function renderSummary() {
    const el = document.getElementById("summary");
    el.innerHTML = '<div class="summary-block"><h3>本章知识总结</h3>' +
      COURSE.summary.split("\n").map(p => '<p>' + Render.esc(p) + '</p>').join("") +
      '</div>';
  }

  function renderThinking() {
    const el = document.getElementById("thinking");
    el.innerHTML = '<h2>思考题</h2>' + Render.renderThinking(COURSE.thinking);
  }

  /* ---------- 渲染骨架章节（placeholder） ---------- */
  function renderSkeleton() {
    // 导读
    document.getElementById("intro").innerHTML =
      '<h2>章节导读</h2><p>' + Render.esc(COURSE.intro) + '</p>';
    // 正文区：知识点大纲 + 概念
    document.getElementById("body").innerHTML =
      Render.renderOutline(COURSE.outline) + Render.renderConcepts(COURSE.concepts);
    // 案例/总结/思考题区：待填充提示
    const note = '<div class="pending-note">本章完整正文（核心知识点详解、现实案例、理论争议、章节总结与思考题）正在按开发顺序逐章填充中，请先浏览本章导读与知识结构。</div>';
    document.getElementById("cases").innerHTML = "";
    document.getElementById("summary").innerHTML = note;
    document.getElementById("thinking").innerHTML = "";
    // 无题库
    document.getElementById("quiz").innerHTML = "";
  }

  /* ---------- 渲染测试 ---------- */
  function renderQuiz() {
    const el = document.getElementById("quiz");
    fetch("data/questions/" + CH_ID + ".json").then(r => r.json()).then(qd => {
      const state = Store.getChapterQuiz(CH_ID);
      let html = '<h2 class="section-title" style="color:var(--ink-forest);font-family:var(--serif)">章节测试</h2>';
      html += '<p style="color:var(--text-sub);font-size:13px;margin:6px 0 18px">共 ' + qd.questions.length + ' 题，答错将自动进入错题本。</p>';
      qd.questions.forEach(q => {
        const st = state[q.order];
        html += '<div class="quiz-q" data-order="' + q.order + '" data-qtype="' + q.qtype + '">';
        html += '<span class="q-idx">第 ' + q.order + ' 题</span>';
        html += '<div class="q-stem">' + Render.esc(q.stem) + '</div>';
        if (q.qtype === "single") {
          html += (q.options || []).map(o =>
            '<span class="opt" data-opt="' + o.charAt(0) + '">' + Render.esc(o) + '</span>'
          ).join("");
        } else if (q.qtype === "judge") {
          html += '<span class="opt" data-opt="对">对</span>' +
                  '<span class="opt" data-opt="错">错</span>';
        }
        html += '<div class="explain"><div class="res"></div><div class="detail">' + Render.esc(q.explanation) + '</div></div>';
        html += '</div>';
        // 已作答则回显
        if (st) {
          const qEl = el.querySelector ? null : null;
        }
      });
      html += '<button class="btn accent block" id="btn-submit">提交答案</button>';
      el.innerHTML = html;

      // 回显已作答状态
      qd.questions.forEach(q => {
        const st = state[q.order];
        if (!st) return;
        const box = el.querySelector('.quiz-q[data-order="' + q.order + '"]');
        const opts = box.querySelectorAll('.opt');
        opts.forEach(o => {
          if (o.dataset.opt === st.chosen) o.classList.add(st.correct ? "correct" : "wrong");
        });
        const ex = box.querySelector('.explain');
        ex.classList.add('show');
        ex.querySelector('.res').textContent = st.correct ? "回答正确" : "回答错误";
        ex.querySelector('.res').className = "res " + (st.correct ? "ok" : "no");
      });

      bindQuiz(qd);
    });
  }

  function bindQuiz(qd) {
    const el = document.getElementById("quiz");
    const selections = {};

    el.addEventListener("click", function (e) {
      const opt = e.target.closest(".opt");
      if (opt) {
        const box = opt.closest(".quiz-q");
        box.querySelectorAll(".opt").forEach(o => o.classList.remove("sel"));
        opt.classList.add("sel");
        selections[box.dataset.order] = opt.dataset.opt;
      }
      if (e.target.id === "btn-submit") {
        submitQuiz(qd, selections);
      }
    });
  }

  function submitQuiz(qd, selections) {
    const el = document.getElementById("quiz");
    let wrongCount = 0;
    qd.questions.forEach(q => {
      const chosen = selections[q.order];
      if (!chosen) return; // 未作答跳过
      const correct = chosen === q.answer;
      if (!correct) wrongCount++;
      Store.recordAnswer(CH_ID, q.order, chosen, correct);

      const box = el.querySelector('.quiz-q[data-order="' + q.order + '"]');
      const opts = box.querySelectorAll('.opt');
      opts.forEach(o => {
        o.classList.remove("sel");
        if (o.dataset.opt === q.answer) o.classList.add("correct");
        else if (o.dataset.opt === chosen) o.classList.add("wrong");
      });
      const ex = box.querySelector('.explain');
      ex.classList.add('show');
      ex.querySelector('.res').textContent = correct ? "回答正确" : "回答错误";
      ex.querySelector('.res').className = "res " + (correct ? "ok" : "no");
    });
    const answered = qd.questions.filter(q => selections[q.order]).length;
    alert("已提交 " + answered + " 题，其中答错 " + wrongCount + " 题" +
      (wrongCount > 0 ? "（已加入错题本）" : "。"));
  }

  /* ---------- 目录抽屉 ---------- */
  function renderToc() {
    const list = document.getElementById("toc-list");
    list.innerHTML = CATALOG.parts.map(part => {
      const chs = part.chapters.map(c =>
        '<a class="toc-ch' + (c.id === CH_ID ? " cur" : "") + '" href="reader.html?ch=' + c.id + '">' +
        '<span class="n">' + String(c.no).padStart(2, "0") + '</span>' + Render.esc(c.title) + '</a>'
      ).join("");
      return '<div class="part-en" style="font-size:10px;letter-spacing:.15em;color:var(--accent);margin:14px 0 4px">PART ' + part.num + ' · ' + part.en + '</div>' + chs;
    }).join("");
  }

  function bindToc() {
    const drawer = document.getElementById("toc-drawer");
    document.getElementById("btn-toc").addEventListener("click", () => drawer.classList.add("open"));
    document.getElementById("toc-mask").addEventListener("click", () => drawer.classList.remove("open"));
  }

  /* ---------- 工具栏 ---------- */
  function bindToolbar() {
    const { prev, next } = locateChapter();
    document.getElementById("tb-prev").onclick = () => {
      if (prev) location.href = "reader.html?ch=" + prev.id;
      else alert("已是第一章");
    };
    document.getElementById("tb-next").onclick = () => {
      if (next) location.href = "reader.html?ch=" + next.id;
      else alert("已是最后一章");
    };

    // 字体大小循环
    document.getElementById("tb-font").onclick = () => {
      const p = Store.getPrefs();
      const scales = [1, 1.15, 1.3];
      const next = scales[(scales.indexOf(p.scale) + 1) % scales.length];
      Store.setPref({ scale: next });
      document.documentElement.style.setProperty("--read-scale", next);
    };

    // 夜间模式
    document.getElementById("tb-night").onclick = () => {
      const p = Store.getPrefs();
      const night = !p.night;
      Store.setPref({ night });
      document.body.classList.toggle("night", night);
      document.getElementById("tb-night").innerHTML = night ? Icons.sun : Icons.moon;
      document.getElementById("tb-night").classList.toggle("on", night);
    };
  }

  /* ---------- 标记完成 ---------- */
  function bindDone() {
    const btn = document.getElementById("btn-done");
    const done = Store.isDone(CH_ID);
    if (done) {
      btn.textContent = "本章已完成 ✓";
      btn.classList.add("accent");
    }
    btn.onclick = () => {
      Store.markChapterDone(CH_ID, true);
      btn.textContent = "本章已完成 ✓";
      btn.classList.add("accent");
    };
  }

  /* ---------- 记录学习时间 ---------- */
  function trackTime() {
    window.addEventListener("beforeunload", () => {
      const sec = (Date.now() - startTime) / 1000;
      if (sec >= 5) Store.addStudyTime(sec);
    });
    // 每 30 秒结算一次，避免长时间不退出丢失
    setInterval(() => {
      const sec = (Date.now() - startTime) / 1000;
      if (sec >= 30) { Store.addStudyTime(30); startTime = Date.now(); }
    }, 30000);
  }

  /* ---------- 主流程 ---------- */
  function init() {
    initIcons();
    applyPrefs();
    CH_ID = getParam("ch") || "ch01";
    if (!/^ch\d{2}$/.test(CH_ID)) CH_ID = "ch01";

    fetch("data/catalog.json").then(r => r.json()).then(cat => {
      CATALOG = cat;
      renderToc();
      bindToc();
      return fetch("data/courses/" + CH_ID + ".json");
    }).then(r => {
      if (!r.ok) throw new Error("章节不存在");
      return r.json();
    }).then(course => {
      COURSE = course;
      document.title = "第 " + chapterNum() + " 章 " + course.title + " · SOCIOLOGY";
      renderTitle();
      if (course.placeholder) {
        renderSkeleton();
      } else {
        renderIntro();
        renderBody();
        renderCases();
        renderSummary();
        renderThinking();
        renderQuiz();
      }
      bindToolbar();
      bindDone();
      trackTime();
    }).catch(err => {
      document.getElementById("reader-title").textContent = "章节内容尚未完成";
      document.getElementById("intro").innerHTML =
        '<p style="color:var(--text-sub)">本阶段为框架骨架交付，除第一章外其余章节内容将按开发顺序逐步补齐。</p>' +
        '<a class="btn" href="index.html" style="margin-top:16px">返回首页</a>';
      document.getElementById("body").innerHTML = "";
      document.getElementById("cases").innerHTML = "";
      document.getElementById("summary").innerHTML = "";
      document.getElementById("thinking").innerHTML = "";
      document.getElementById("quiz").innerHTML = "";
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
