/* ============================================================
   公共工具：图标、内容渲染、工具函数
   ============================================================ */
(function () {
  const Icons = {
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-2V5z"/><path d="M20 7H6a2 2 0 0 0-2 2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h12v16l-6-4-6 4V4z"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>'
  };
  window.Icons = Icons;

  /* 简易转义 */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  /* 渲染课程正文内容块数组 -> HTML */
  function renderContent(contentArr) {
    if (!Array.isArray(contentArr)) return "";
    let html = "";
    contentArr.forEach((block, i) => {
      const anchor = "blk-" + i;
      switch (block.type) {
        case "p":
          html += '<p data-anchor="' + anchor + '">' + esc(block.text) + '</p>';
          break;
        case "concept":
          html += '<div class="concept-card" data-anchor="' + anchor + '">' +
            '<div class="cc-en">' + esc(block.en) + '</div>' +
            '<div class="cc-term">' + esc(block.term) + '</div>' +
            '<p>' + esc(block.text) + '</p></div>';
          break;
        case "table":
          html += renderTable(block);
          break;
        case "debate":
          html += '<div class="debate-box" data-anchor="' + anchor + '">' +
            '<div class="db-title">' + esc(block.title) + '</div>' +
            '<p>' + esc(block.text) + '</p></div>';
          break;
        default:
          html += '<p data-anchor="' + anchor + '">' + esc(block.text || "") + '</p>';
      }
    });
    return html;
  }

  function renderTable(block) {
    let html = '<table data-anchor="' + (block.title ? esc(block.title) : "tbl") + '">';
    if (block.head) {
      html += '<thead><tr>' + block.head.map(h => '<th>' + esc(h) + '</th>').join("") + '</tr></thead>';
    }
    html += '<tbody>';
    (block.rows || []).forEach(r => {
      html += '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join("") + '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  /* 渲染案例 */
  function renderCases(cases) {
    if (!cases || !cases.length) return "";
    return cases.map((c, i) => {
      const body = (c.body || []).map(b => {
        const label = b.split("：")[0];
        const rest = b.slice(label.length + 1);
        return '<p><strong>' + esc(label) + '</strong>' + esc(rest) + '</p>';
      }).join("");
      return '<div class="case-box" data-anchor="case-' + i + '">' +
        '<div class="case-head"><span class="accent">CASE ' + (i + 1) + '</span> · ' + esc(c.title) + '</div>' +
        '<div class="case-body">' + body +
        (c.src ? '<div class="case-src">数据与来源：' + esc(c.src) + '</div>' : "") +
        '</div></div>';
    }).join("");
  }

  /* 渲染思考题 */
  function renderThinking(items) {
    if (!items || !items.length) return "";
    return '<ol class="think-list">' + items.map(t => '<li>' + esc(t) + '</li>').join("") + '</ol>';
  }

  /* 渲染骨架章节的知识点大纲（placeholder 章节用） */
  function renderOutline(outline) {
    if (!outline || !outline.length) return "";
    return '<div class="outline-block">' +
      '<h2>本章知识结构</h2>' +
      '<ol class="outline-list">' +
      outline.map((o, i) => '<li><span class="o-num">' + String(i + 1).padStart(2, "0") + '</span>' + esc(o) + '</li>').join("") +
      '</ol></div>';
  }

  /* 渲染骨架章节的概念词条 */
  function renderConcepts(concepts) {
    if (!concepts || !concepts.length) return "";
    return '<h2>核心概念</h2>' + concepts.map(c =>
      '<div class="concept-card"><div class="cc-term">' + esc(c.term) + '</div>' +
      '<p>' + esc(c.text) + '</p></div>'
    ).join("");
  }

  window.Render = { esc, renderContent, renderCases, renderThinking, renderOutline, renderConcepts };
})();
