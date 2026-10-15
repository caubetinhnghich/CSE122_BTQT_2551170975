(() => {
  "use strict";
  const EP = window.EventPulse || {};
  if (typeof EP.ensureSeed === "function") EP.ensureSeed();

  const USER_ID = "USR001";
  const $ = (s) => document.querySelector(s);

  let pendingRemoveId = null;

  function loadAgendas() {
    const all = EP.getJSON
      ? EP.getJSON("eventpulse_agendas", []) || []
      : JSON.parse(localStorage.getItem("eventpulse_agendas") || "[]");
    return all.filter((a) => a.userId === USER_ID && a.status === "saved");
  }

  function saveAgendas(userItems) {
    const all = EP.getJSON
      ? EP.getJSON("eventpulse_agendas", []) || []
      : JSON.parse(localStorage.getItem("eventpulse_agendas") || "[]");
    const others = all.filter(
      (a) => !(a.userId === USER_ID && a.status === "saved")
    );
    const next = [...others, ...userItems];
    if (EP.setJSON) EP.setJSON("eventpulse_agendas", next);
    else localStorage.setItem("eventpulse_agendas", JSON.stringify(next));
  }

  function sessionsMap() {
    const list =
      typeof EP.getAllSessions === "function" ? EP.getAllSessions() : [];
    const map = {};
    list.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }

  function timeRange(s) {
    if (!s) return "—";
    if (s.startTime && s.endTime) {
      const f = (iso) =>
        new Date(iso).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
      return f(s.startTime) + " – " + f(s.endTime);
    }
    return (s.start || "") + " – " + (s.end || "");
  }

  function detectConflicts(items, map) {
    const conflictIds = new Set();
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = map[items[i].sessionId];
        const b = map[items[j].sessionId];
        if (!a || !b) continue;
        const overlap =
          typeof EP.isOverlapping === "function"
            ? EP.isOverlapping(a, b)
            : false;
        if (overlap) {
          conflictIds.add(items[i].sessionId);
          conflictIds.add(items[j].sessionId);
        }
      }
    }
    return conflictIds;
  }

  function toast(msg, isError) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = (isError ? "✕ " : "✓ ") + msg;
    t.style.background = isError ? "#fef2f2" : "#eaf8f0";
    t.style.color = isError ? "#b91c1c" : "#166534";
    t.style.borderColor = isError ? "#fecaca" : "#bde8cd";
    t.hidden = false;
    clearTimeout(window.__agToast);
    window.__agToast = setTimeout(() => (t.hidden = true), 2600);
  }

  function openDeleteModal(agendaId, title) {
    pendingRemoveId = agendaId;
    const text = $("#deleteText");
    if (text) {
      text.textContent = title
        ? "Xóa \"" + title + "\" khỏi lịch của bạn?"
        : "Bạn có chắc muốn xóa session này khỏi agenda?";
    }
    const modal = $("#deleteModal");
    if (modal) modal.hidden = false;
  }

  function closeDeleteModal() {
    pendingRemoveId = null;
    const modal = $("#deleteModal");
    if (modal) modal.hidden = true;
  }

  function removeOne(agendaId) {
    const before = loadAgendas();
    const target = before.find((a) => a.id === agendaId);
    const next = before.filter((a) => a.id !== agendaId);
    saveAgendas(next);
    const map = sessionsMap();
    const name = target && map[target.sessionId] ? map[target.sessionId].title : "Session";
    toast('Đã xóa "' + name + '" khỏi lịch');
    closeDeleteModal();
    render();
  }

  function clearAll() {
    saveAgendas([]);
    toast("Đã xóa toàn bộ lịch");
    const modal = $("#clearModal");
    if (modal) modal.hidden = true;
    render();
  }

  function render() {
    const map = sessionsMap();
    let items = loadAgendas();
    const q = ($("#search")?.value || "").trim().toLowerCase();
    const sort = $("#sort")?.value || "time";

    if (q) {
      items = items.filter((a) => {
        const s = map[a.sessionId];
        if (!s) return false;
        return (
          (s.title || "").toLowerCase().includes(q) ||
          (s.category || "").toLowerCase().includes(q) ||
          (s.speaker || "").toLowerCase().includes(q)
        );
      });
    }

    items = items.slice().sort((x, y) => {
      const sx = map[x.sessionId];
      const sy = map[y.sessionId];
      if (sort === "title") {
        return (sx?.title || "").localeCompare(sy?.title || "", "vi");
      }
      const tx = new Date(sx?.startTime || 0).getTime();
      const ty = new Date(sy?.startTime || 0).getTime();
      return tx - ty;
    });

    const allItems = loadAgendas();
    const conflicts = detectConflicts(allItems, map);

    $("#countAll").textContent = String(allItems.length);
    $("#countConflict").textContent = String(conflicts.size);
    $("#countTopics").textContent = String(
      new Set(
        allItems.map((a) => map[a.sessionId]?.category).filter(Boolean)
      ).size
    );

    const clearBtn = $("#btnClearAll");
    if (clearBtn) clearBtn.disabled = allItems.length === 0;

    const list = $("#list");
    const empty = $("#empty");
    if (!items.length) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    const esc = EP.escapeHTML || ((v) => String(v ?? ""));

    list.innerHTML = items
      .map((a) => {
        const s = map[a.sessionId];
        if (!s) {
          return (
            '<article class="agenda-item"><div><h3>Session không còn tồn tại</h3>' +
            '<p class="agenda-meta">' +
            esc(a.sessionId) +
            '</p></div><div class="agenda-actions">' +
            '<button type="button" class="btn danger" data-remove="' +
            esc(a.id) +
            '" data-title="">🗑 Xóa lịch</button></div></article>'
          );
        }
        const isConflict = conflicts.has(s.id);
        return (
          '<article class="agenda-item">' +
          "<div>" +
          (isConflict ? '<span class="conflict-pill">⚠ Trùng giờ</span> ' : "") +
          "<h3>" +
          esc(s.title) +
          "</h3>" +
          '<div class="agenda-meta">' +
          "<span>🕐 " +
          timeRange(s) +
          "</span>" +
          "<span>📍 " +
          esc(s.room || s.roomId || "—") +
          "</span>" +
          "<span>👤 " +
          esc(s.speaker || "—") +
          "</span>" +
          "<span>" +
          esc(s.category || "") +
          "</span>" +
          "</div></div>" +
          '<div class="agenda-actions">' +
          (isConflict
            ? '<a class="btn primary" href="./schedule-conflict.html">Xử lý xung đột</a>'
            : "") +
          '<button type="button" class="btn danger" data-remove="' +
          esc(a.id) +
          '" data-title="' +
          esc(s.title) +
          '">🗑 Xóa lịch</button>' +
          "</div></article>"
        );
      })
      .join("");

    list.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.onclick = () =>
        openDeleteModal(btn.getAttribute("data-remove"), btn.getAttribute("data-title"));
    });
  }

  $("#search") && ($("#search").oninput = render);
  $("#sort") && ($("#sort").onchange = render);
  $("#btnRefresh") && ($("#btnRefresh").onclick = render);
  $("#btnRecs") &&
    ($("#btnRecs").onclick = () => {
      location.href = "./recommendations.html";
    });
  $("#btnEmptyRecs") &&
    ($("#btnEmptyRecs").onclick = () => {
      location.href = "./recommendations.html";
    });
  $("#btnConflict") &&
    ($("#btnConflict").onclick = () => {
      location.href = "./schedule-conflict.html";
    });

  $("#btnClearAll") &&
    ($("#btnClearAll").onclick = () => {
      if (!loadAgendas().length) {
        toast("Lịch đã trống", true);
        return;
      }
      const modal = $("#clearModal");
      if (modal) modal.hidden = false;
    });

  $("#deleteCancel") && ($("#deleteCancel").onclick = closeDeleteModal);
  $("#deleteConfirm") &&
    ($("#deleteConfirm").onclick = () => {
      if (pendingRemoveId) removeOne(pendingRemoveId);
    });
  $("#clearCancel") &&
    ($("#clearCancel").onclick = () => {
      const modal = $("#clearModal");
      if (modal) modal.hidden = true;
    });
  $("#clearConfirm") && ($("#clearConfirm").onclick = clearAll);

  ["deleteModal", "clearModal"].forEach((id) => {
    const modal = $("#" + id);
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.hidden = true;
        if (id === "deleteModal") pendingRemoveId = null;
      }
    });
  });

  render();
})();
