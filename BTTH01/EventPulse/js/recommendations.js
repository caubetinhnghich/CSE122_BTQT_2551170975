(() => {
  "use strict";
  const EP = window.EventPulse || {};
  if (typeof EP.ensureSeed === "function") EP.ensureSeed();

  const USER_ID = "USR001";
  const USER = { interests: ["ai", "web-development", "product"] };

  /* Prefer catalog from shared seed (published sessions with tags) */
  function catalogSessions() {
    const all = typeof EP.getAllSessions === "function" ? EP.getAllSessions() : [];
    const published = all.filter(
      (s) => s.status === "published" || s.reviewStatus === "approved"
    );
    if (published.length) {
      return published.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category || "",
        speaker: s.speaker || (s.speakerIds && s.speakerIds[0]) || "",
        room: s.room || s.roomId || "",
        start: s.startTime
          ? new Date(s.startTime).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : s.start || "",
        end: s.endTime
          ? new Date(s.endTime).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : s.end || "",
        startTime: s.startTime,
        endTime: s.endTime,
        tags: s.tags || [String(s.category || "").toLowerCase().replace(/\s+/g, "-")],
        desc: s.description || s.desc || "",
      }));
    }
    return [
      {
        id: "SES001",
        title: "Future of Web Development",
        category: "Web Development",
        speaker: "Nguyễn Minh Anh",
        room: "Room A",
        start: "10:00",
        end: "11:00",
        tags: ["web-development"],
        desc: "Xu hướng phát triển web hiện đại.",
      },
      {
        id: "SES002",
        title: "Building AI-Powered Applications",
        category: "AI & Machine Learning",
        speaker: "Lê Thu Trang",
        room: "Room B",
        start: "11:00",
        end: "12:00",
        tags: ["ai"],
        desc: "Thiết kế ứng dụng có AI và cách đưa AI vào UX.",
      },
      {
        id: "SES003",
        title: "Modern JavaScript Best Practices",
        category: "Web Development",
        speaker: "Trần Đức Huy",
        room: "Room A",
        start: "09:00",
        end: "10:00",
        tags: ["web-development"],
        desc: "Thực hành JavaScript hiện đại cho frontend.",
      },
      {
        id: "SES004",
        title: "AI in Product Development",
        category: "AI & Machine Learning",
        speaker: "Phạm Quốc Bảo",
        room: "Room C",
        start: "13:30",
        end: "14:30",
        tags: ["ai", "product"],
        desc: "Ứng dụng AI trong nghiên cứu, thiết kế và phát triển sản phẩm.",
      },
      {
        id: "SES005",
        title: "Design Systems in Practice",
        category: "Product & Design",
        speaker: "Phạm Quốc Bảo",
        room: "Room D",
        start: "15:00",
        end: "16:00",
        tags: ["product"],
        desc: "Xây dựng design system dùng xuyên suốt sản phẩm.",
      },
      {
        id: "SES006",
        title: "Product Analytics for Better Decisions",
        category: "Product & Data",
        speaker: "Vũ Hoàng Nam",
        room: "Room E",
        start: "16:00",
        end: "17:00",
        tags: ["product"],
        desc: "Dùng dữ liệu để ra quyết định sản phẩm.",
      },
    ];
  }

  let sessions = catalogSessions();
  let agendas = loadAgendas();
  let lastScored = [];
  let forceAiError = new URLSearchParams(location.search).get("error") === "1";
  let refreshFails = 0;

  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function loadAgendas() {
    const all = EP.getJSON
      ? EP.getJSON("eventpulse_agendas", [])
      : JSON.parse(localStorage.getItem("eventpulse_agendas") || "[]");
    return (all || []).filter((a) => a.userId === USER_ID && a.status === "saved");
  }

  function saveAgendas(list) {
    const full = EP.getJSON
      ? EP.getJSON("eventpulse_agendas", [])
      : JSON.parse(localStorage.getItem("eventpulse_agendas") || "[]");
    const others = (full || []).filter(
      (a) => !(a.userId === USER_ID && a.status === "saved")
    );
    const next = [...others, ...list];
    if (EP.setJSON) EP.setJSON("eventpulse_agendas", next);
    else localStorage.setItem("eventpulse_agendas", JSON.stringify(next));
  }

  function recommendations() {
    const inAgenda = new Set(agendas.map((a) => a.sessionId));
    lastScored = sessions
      .filter((s) => !inAgenda.has(s.id))
      .map((s) => ({
        ...s,
        score: Math.min(
          98,
          65 + s.tags.filter((t) => USER.interests.includes(t)).length * 14
        ),
      }))
      .sort((a, b) => b.score - a.score);
    return lastScored;
  }

  function loading() {
    $("#empty").hidden = true;
    $("#error").hidden = true;
    $("#count").textContent = "";
    $("#list").innerHTML =
      '<div class="loading"><span class="spinner"></span><p>AI đang phân tích sở thích và lịch sử của bạn...</p></div>';
  }

  function render() {
    refreshFails = 0;
    if ($("#error")) $("#error").hidden = true;
    const list = recommendations();
    $("#count").textContent = list.length + " session";
    if (!list.length) {
      $("#list").innerHTML = "";
      $("#empty").hidden = false;
      return;
    }
    $("#empty").hidden = true;
    $("#list").innerHTML = list
      .map(
        (s) => `<article class="card"><div class="cover"><span class="badge">${s.score}% phù hợp</span><span class="badge">${esc(s.category)}</span></div><div class="body"><h3>${esc(s.title)}</h3><div class="meta">🕐 ${s.start} – ${s.end} · 📍 ${esc(s.room)} · 👤 ${esc(s.speaker)}</div><p class="desc">${esc(s.desc)}</p><div class="why">Phù hợp với chủ đề ${s.tags.join(", ")} bạn quan tâm.</div><div class="actions"><button class="secondary whyBtn" data-id="${s.id}">${(window.EventPulse && EventPulse.t && EventPulse.t("rec.why")) || "Vì sao gợi ý này?"}</button><button class="addBtn" data-id="${s.id}">${(window.EventPulse && EventPulse.t && EventPulse.t("rec.add")) || "＋ Thêm vào agenda"}</button></div></div></article>`
      )
      .join("");
    document.querySelectorAll(".whyBtn").forEach((b) => (b.onclick = () => showReason(b.dataset.id)));
    document.querySelectorAll(".addBtn").forEach((b) => (b.onclick = () => add(b.dataset.id)));
  }

  function showError(msg) {
    $("#list").innerHTML = "";
    $("#empty").hidden = true;
    $("#error").hidden = false;
    const et = $("#errorText");
    if (et) et.textContent = msg || "AI tạm thời không phản hồi. Vui lòng thử lại.";
  }

  function run() {
    sessions = catalogSessions();
    agendas = loadAgendas();
    loading();
    setTimeout(() => {
      try {
        if (forceAiError) {
          forceAiError = false;
          showError("AI tạm thời không phản hồi (demo nhánh lỗi). Thử lại để tải gợi ý.");
          return;
        }
        // Simulate occasional failure after repeated refreshes without success path reset
        if (refreshFails >= 5) {
          refreshFails = 0;
          showError("Không thể tải gợi ý sau nhiều lần thử. Kiểm tra kết nối hoặc thử lại.");
          return;
        }
        render();
      } catch (e) {
        console.error(e);
        showError(e.message || "Lỗi không xác định khi tạo gợi ý.");
      }
    }, 800);
  }

  function add(id) {
    const scored = lastScored.find((x) => x.id === id) || sessions.find((x) => x.id === id);
    if (!scored) return;

    if (agendas.some((a) => a.sessionId === id)) {
      $("#message").textContent = "Session này đã có trong agenda.";
      $("#message").hidden = false;
      setTimeout(() => ($("#message").hidden = true), 2500);
      return;
    }

    // Check time overlap with existing agenda sessions (shared catalog has startTime/endTime)
    const allSessions = typeof EP.getAllSessions === "function" ? EP.getAllSessions() : [];
    const byId = Object.fromEntries(allSessions.map((s) => [s.id, s]));
    const candidate = byId[id] || scored;
    if (candidate && (candidate.startTime || scored.startTime)) {
      const cand = {
        startTime: candidate.startTime || scored.startTime,
        endTime: candidate.endTime || scored.endTime,
      };
      const clash = agendas.some((a) => {
        const other = byId[a.sessionId];
        if (!other || !other.startTime) return false;
        if (typeof EP.isOverlapping === "function") return EP.isOverlapping(cand, other);
        const aS = new Date(cand.startTime).getTime();
        const aE = new Date(cand.endTime).getTime();
        const bS = new Date(other.startTime).getTime();
        const bE = new Date(other.endTime).getTime();
        return aS < bE && bS < aE;
      });
      if (clash) {
        $("#message").textContent = "Trùng giờ với session đã có trong agenda. Hãy xử lý xung đột lịch.";
        $("#message").hidden = false;
        setTimeout(() => ($("#message").hidden = true), 3200);
        return;
      }
    }

    agendas.push({
      id: "AGD" + Date.now(),
      userId: USER_ID,
      sessionId: id,
      status: "saved",
      addedAt: new Date().toISOString(),
    });
    saveAgendas(agendas);

    const ns = EP.getJSON
      ? EP.getJSON("eventpulse_notifications", [])
      : JSON.parse(localStorage.getItem("eventpulse_notifications") || "[]");
    ns.unshift({
      title: "Đã thêm session vào agenda",
      message: scored.title,
      createdAt: new Date().toISOString(),
      isRead: false,
      userId: USER_ID,
    });
    if (EP.setJSON) EP.setJSON("eventpulse_notifications", ns);
    else localStorage.setItem("eventpulse_notifications", JSON.stringify(ns));

    $("#message").textContent = "✓ Đã thêm \"" + scored.title + "\" vào My Agenda.";
    $("#message").hidden = false;
    setTimeout(() => ($("#message").hidden = true), 2500);
    render();
  }

  /** Use scored object so score is never undefined */
  function showReason(id) {
    const s = lastScored.find((x) => x.id === id) || sessions.find((x) => x.id === id);
    if (!s) return;
    const score = typeof s.score === "number" ? s.score : "—";
    $("#reason").innerHTML =
      "<p><b>" +
      esc(s.title) +
      "</b></p><ul><li>Phù hợp với sở thích của bạn: " +
      (s.tags || []).join(", ") +
      ".</li><li>Session chưa có trong agenda.</li><li>Điểm phù hợp: <b>" +
      score +
      "%</b>.</li></ul>";
    $("#modal").hidden = false;
  }

  $("#refresh").onclick = () => {
    refreshFails += 1;
    run();
  };
  $("#retry").onclick = run;
  $("#emptyRefresh").onclick = run;
  $("#close").onclick = () => ($("#modal").hidden = true);
  $("#modal").onclick = (e) => {
    if (e.target.id === "modal") $("#modal").hidden = true;
  };
  run();
})();
