/* ============================================================
   存储层 · LocalStorage 持久化
   管理：进度、书签、笔记、重点标记、错题本、学习时间
   ============================================================ */
(function () {
  const PREFIX = "soc_";

  const Store = {
    _read(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    _write(key, val) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(val));
        return true;
      } catch (e) {
        console.warn("存储失败", e);
        return false;
      }
    },

    /* ---------- 学习进度 ---------- */
    getProgress() {
      return this._read("progress", {});
    },
    markChapterDone(chId, done) {
      const p = this.getProgress();
      p[chId] = { done: !!done, at: Date.now() };
      this._write("progress", p);
    },
    isDone(chId) {
      const p = this.getProgress();
      return !!(p[chId] && p[chId].done);
    },
    getDoneCount() {
      const p = this.getProgress();
      return Object.values(p).filter(v => v && v.done).length;
    },

    /* ---------- 学习时间（秒） ---------- */
    getStudyTime() {
      return this._read("studyTime", 0);
    },
    addStudyTime(sec) {
      this._write("studyTime", this.getStudyTime() + Math.round(sec));
    },

    /* ---------- 书签 ---------- */
    getBookmarks() {
      return this._read("bookmarks", {});
    },
    toggleBookmark(chId, anchorId) {
      const b = this.getBookmarks();
      const key = chId + "::" + anchorId;
      if (b[key]) delete b[key]; else b[key] = { at: Date.now() };
      this._write("bookmarks", b);
      return !!b[key];
    },
    isBookmarked(chId, anchorId) {
      const b = this.getBookmarks();
      return !!b[chId + "::" + anchorId];
    },

    /* ---------- 重点标记 ---------- */
    getHighlights() {
      return this._read("highlights", {});
    },
    toggleHighlight(chId, anchorId) {
      const h = this.getHighlights();
      const key = chId + "::" + anchorId;
      if (h[key]) delete h[key]; else h[key] = { at: Date.now() };
      this._write("highlights", h);
      return !!h[key];
    },
    isHighlighted(chId, anchorId) {
      const h = this.getHighlights();
      return !!h[chId + "::" + anchorId];
    },

    /* ---------- 笔记 ---------- */
    getNotes() {
      return this._read("notes", {});
    },
    saveNote(chId, anchorId, text) {
      const n = this.getNotes();
      const key = chId + "::" + anchorId;
      if (!text || !text.trim()) { delete n[key]; }
      else { n[key] = { text, at: Date.now() }; }
      this._write("notes", n);
    },
    getNote(chId, anchorId) {
      const n = this.getNotes();
      return n[chId + "::" + anchorId] || null;
    },
    allNotes() {
      return this.getNotes();
    },

    /* ---------- 测试作答与错题本 ---------- */
    getQuizState() {
      return this._read("quiz", {});
    },
    // 记录一次作答：{ chId: { order: { chosen, correct } } }
    recordAnswer(chId, order, chosen, correct) {
      const q = this.getQuizState();
      if (!q[chId]) q[chId] = {};
      q[chId][order] = { chosen, correct, at: Date.now() };
      this._write("quiz", q);
    },
    getWrongSet() {
      const q = this.getQuizState();
      const wrong = [];
      for (const chId in q) {
        for (const order in q[chId]) {
          const r = q[chId][order];
          if (r && r.correct === false) {
            wrong.push({ chId, order: Number(order), chosen: r.chosen, at: r.at });
          }
        }
      }
      return wrong;
    },
    getChapterQuiz(chId) {
      const q = this.getQuizState();
      return q[chId] || {};
    },

    /* ---------- 阅读偏好 ---------- */
    getPrefs() {
      return this._read("prefs", { night: false, scale: 1 });
    },
    setPref(patch) {
      const p = Object.assign(this.getPrefs(), patch);
      this._write("prefs", p);
      return p;
    }
  };

  window.Store = Store;
})();
