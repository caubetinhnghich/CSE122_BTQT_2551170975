(() => {
  const USER_ID = "USR102";
  const SESSION_ID = new URLSearchParams(location.search).get("id") || "SES102";
  const $ = (s) => document.querySelector(s);
  const EP = window.EventPulse || {};
  let session = null;
  let original = null;
  let saveTimer = null;

  const CONTENT_FIELDS = ["title", "description", "objectives", "category"];
  const SCHEDULE_FIELDS = ["room", "startTime", "endTime"];
  const ALL_FIELDS = [...CONTENT_FIELDS, ...SCHEDULE_FIELDS];

  function getData() {
    if (typeof EP.ensureSeed === "function") EP.ensureSeed();
    if (typeof EP.getAllSessions === "function") return EP.getAllSessions();
    const raw = localStorage.getItem("eventpulse_sessions");
    return raw ? JSON.parse(raw) : [];
  }

  function saveData() {
    try {
      if (typeof EP.upsertSession === "function") {
        EP.upsertSession(session);
        return true;
      }
      const KEY = "eventpulse_sessions";
      const all = getData().map((s) => (s.id === session.id ? session : s));
      if (!all.some((s) => s.id === session.id)) all.push(session);
      localStorage.setItem(KEY, JSON.stringify(all));
      return true;
    } catch (e) {
      console.error(e);
      toast("Lỗi khi lưu: " + (e.message || "không xác định"), true);
      return false;
    }
  }

  function fmt(v) {
    return new Date(v).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c])
    );
  }

  function toast(t, isError) {
    const el = $("#toast");
    el.textContent = (isError ? "✕ " : "✓ ") + t;
    el.style.background = isError ? "#fff0f0" : "#eaf8f0";
    el.style.color = isError ? "#a11" : "#166534";
    el.hidden = false;
    clearTimeout(window.tt);
    window.tt = setTimeout(() => (el.hidden = true), 2800);
  }

  function isApproved() {
    const s = session?.reviewStatus || session?.status;
    return s === "approved" || s === "published";
  }

  function isRejected() {
    return session?.reviewStatus === "rejected";
  }

  function isPending() {
    return session?.reviewStatus === "pending" || session?.status === "pending";
  }

  /**
   * User flow permissions:
   * - approved/published: lock room + time (schedule); content can still be edited lightly or locked —
   *   per review: lock room/time for approved.
   * - pending: all editable
   * - rejected: editable + CTA resubmit → pending
   */
  function applyPermissions() {
    const approved = isApproved();
    const rejected = isRejected();

    SCHEDULE_FIELDS.forEach((id) => {
      const el = $("#" + id);
      if (!el) return;
      el.disabled = approved;
      el.readOnly = approved;
      el.style.opacity = approved ? "0.65" : "";
      el.style.cursor = approved ? "not-allowed" : "";
    });

    CONTENT_FIELDS.forEach((id) => {
      const el = $("#" + id);
      if (!el) return;
      // Content stays editable when pending/rejected; when approved allow content-only edits
      el.disabled = false;
      el.readOnly = false;
      el.style.opacity = "";
      el.style.cursor = "";
    });

    const hint = $("#lockHint");
    const btnResubmit = $("#btnResubmit");

    if (approved) {
      if (hint) {
        hint.hidden = false;
        hint.textContent =
          "Session đã duyệt: không thể đổi phòng và khung giờ. Chỉ chỉnh nội dung mô tả nếu cần.";
      }
      if (btnResubmit) btnResubmit.hidden = true;
    } else if (rejected) {
      if (hint) {
        hint.hidden = false;
        hint.textContent =
          "Session bị từ chối. Chỉnh sửa nội dung rồi bấm «Gửi lại để duyệt».";
      }
      if (btnResubmit) btnResubmit.hidden = false;
    } else {
      if (hint) hint.hidden = true;
      if (btnResubmit) btnResubmit.hidden = true;
    }
  }

  function load() {
    $("#loading").hidden = false;
    $("#error").hidden = true;
    $("#editor").hidden = true;
    $("#success").hidden = true;
    setTimeout(() => {
      try {
        session = getData().find(
          (s) => s.id === SESSION_ID && s.speakerIds?.includes(USER_ID)
        );
        if (!session) throw new Error("Không tìm thấy session hoặc bạn không có quyền sửa.");
        original = JSON.parse(JSON.stringify(session));
        fill();
        applyPermissions();
        $("#loading").hidden = true;
        $("#editor").hidden = false;
      } catch (e) {
        $("#loading").hidden = true;
        $("#error").hidden = false;
        $("#errorText").textContent = e.message;
      }
    }, 450);
  }

  function fill() {
    $("#sessionSubtitle").textContent = `${session.id} · ${session.title}`;
    $("#title").value = session.title || "";
    $("#description").value = session.description || "";
    $("#objectives").value = session.objectives || "";
    $("#category").value = session.category || "";
    $("#room").value = session.roomId || "";
    $("#startTime").value = (session.startTime || "").slice(0, 16);
    $("#endTime").value = (session.endTime || "").slice(0, 16);
    $("#descriptionCount").textContent = ($("#description").value || "").length;
    $("#objectivesCount").textContent = ($("#objectives").value || "").length;
    updateDuration();
    renderStatus();
    renderTimeline();
    setSaved();
  }

  function setSaved() {
    const el = $("#saveStatus");
    el.textContent = "● Đã lưu";
    el.className = "save-status saved";
  }

  function setDirty() {
    if (isApproved()) {
      // still allow dirty for content fields
    }
    const el = $("#saveStatus");
    el.textContent = "● Có thay đổi chưa lưu";
    el.className = "save-status dirty";
    scheduleAutosave();
  }

  function scheduleAutosave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (validate(false)) saveChanges(true);
    }, 900);
  }

  function readForm() {
    session.title = $("#title").value.trim();
    session.description = $("#description").value.trim();
    session.objectives = $("#objectives").value.trim();
    session.category = $("#category").value.trim();
    // Schedule only if not locked
    if (!isApproved()) {
      session.roomId = $("#room").value.trim();
      session.startTime = $("#startTime").value ? $("#startTime").value + ":00" : "";
      session.endTime = $("#endTime").value ? $("#endTime").value + ":00" : "";
    }
    session.updatedAt = new Date().toISOString();
  }

  function validate(show = true) {
    document.querySelectorAll(".field-error").forEach((x) => (x.textContent = ""));
    let ok = true;
    const title = $("#title").value.trim();
    const desc = $("#description").value.trim();
    const obj = $("#objectives").value.trim();
    const cat = $("#category").value.trim();
    const st = $("#startTime").value;
    const en = $("#endTime").value;

    if (!title) {
      $("#titleError").textContent = "Vui lòng nhập tên session.";
      ok = false;
    }
    if (desc.length < 20) {
      $("#descriptionError").textContent = "Mô tả cần ít nhất 20 ký tự.";
      ok = false;
    }
    if (obj.length < 10) {
      $("#objectivesError").textContent = "Vui lòng nhập mục tiêu buổi nói chuyện.";
      ok = false;
    }
    if (!cat) {
      $("#categoryError").textContent = "Vui lòng nhập chủ đề.";
      ok = false;
    }
    if (!isApproved()) {
      if (!st) {
        $("#startError").textContent = "Vui lòng chọn thời gian bắt đầu.";
        ok = false;
      }
      if (!en) {
        $("#endError").textContent = "Vui lòng chọn thời gian kết thúc.";
        ok = false;
      }
      if (st && en && new Date(en) <= new Date(st)) {
        $("#endError").textContent = "Thời gian kết thúc phải sau bắt đầu.";
        ok = false;
      }
    }
    if (show && !ok) toast("Vui lòng kiểm tra lại các trường bắt buộc.", true);
    return ok;
  }

  function saveChanges(auto = false) {
    if (!validate(!auto)) return;
    readForm();
    if (!session.history) session.history = [];
    if (!saveData()) return;
    original = JSON.parse(JSON.stringify(session));
    setSaved();
    applyPermissions();
    if (!auto) {
      toast("Đã lưu thay đổi.");
      showSuccess();
    }
  }

  function resubmit() {
    if (!validate(true)) return;
    readForm();
    session.reviewStatus = "pending";
    session.status = "pending";
    session.reviewNote = "Đã chỉnh sửa và gửi lại để ban tổ chức duyệt.";
    if (!session.history) session.history = [];
    session.history.push({
      status: "pending",
      at: new Date().toISOString(),
      note: session.reviewNote,
    });
    session.updatedAt = new Date().toISOString();
    if (!saveData()) return;
    original = JSON.parse(JSON.stringify(session));
    renderStatus();
    renderTimeline();
    applyPermissions();
    setSaved();
    toast("Đã gửi lại session để duyệt.");
  }

  function showSuccess() {
    $("#editor").hidden = true;
    $("#success").hidden = false;
  }

  function restore() {
    session = JSON.parse(JSON.stringify(original));
    fill();
    applyPermissions();
    $("#success").hidden = true;
    $("#editor").hidden = false;
  }

  function updateDuration() {
    const a = new Date($("#startTime").value);
    const b = new Date($("#endTime").value);
    if (isNaN(a) || isNaN(b) || b <= a) {
      $("#duration").textContent = "Thời lượng: —";
      return;
    }
    const m = Math.round((b - a) / 60000);
    const h = Math.floor(m / 60);
    const min = m % 60;
    $("#duration").textContent =
      "Thời lượng: " + (h ? `${h} giờ ` : "") + (min ? `${min} phút` : h ? "" : "—");
  }

  function renderStatus() {
    const labels = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối", published: "Đã duyệt" };
    const status = session.reviewStatus || session.status;
    const b = $("#statusBadge");
    b.textContent = labels[status] || status;
    b.className = "status-badge " + (status === "published" ? "approved" : status);
    $("#statusNote").textContent = session.reviewNote || "Chưa có ghi chú.";
  }

  function renderTimeline() {
    const items = session.history?.length
      ? session.history
      : [{ status: session.reviewStatus, at: session.updatedAt, note: session.reviewNote }];
    const labels = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối", published: "Đã duyệt" };
    $("#timeline").innerHTML = items
      .map(
        (x, i) => `
      <div class="timeline-item ${i === items.length - 1 ? "current" : ""}">
        <h3>${esc(labels[x.status] || x.status)}</h3>
        <time>${fmt(x.at)}</time>
        <p>${esc(x.note || "")}</p>
      </div>`
      )
      .join("");
  }

  function mark() {
    // Don't read locked schedule into session on every keystroke for approved
    if (!isApproved()) {
      readForm();
    } else {
      session.title = $("#title").value.trim();
      session.description = $("#description").value.trim();
      session.objectives = $("#objectives").value.trim();
      session.category = $("#category").value.trim();
      session.updatedAt = new Date().toISOString();
    }
    setDirty();
    updateDuration();
  }

  ALL_FIELDS.forEach((id) => {
    const el = $("#" + id);
    if (!el) return;
    el.addEventListener("input", () => {
      if (id === "description") $("#descriptionCount").textContent = el.value.length;
      if (id === "objectives") $("#objectivesCount").textContent = el.value.length;
      mark();
    });
    el.addEventListener("change", mark);
  });

  $("#btnSave").onclick = () => {
    clearTimeout(saveTimer);
    saveChanges(false);
  };
  $("#btnCancel").onclick = () => {
    restore();
    toast("Đã huỷ các thay đổi chưa lưu.");
  };
  $("#btnRetry").onclick = load;
  $("#btnEditAgain").onclick = () => {
    $("#success").hidden = true;
    $("#editor").hidden = false;
    applyPermissions();
  };
  $("#btnSuccessBack").onclick = () => (location.href = "./my-sessions.html");
  $("#btnBack").onclick = () => (location.href = "./my-sessions.html");
  $("#editForm").onsubmit = (e) => {
    e.preventDefault();
    $("#btnSave").click();
  };

  const btnResubmit = $("#btnResubmit");
  if (btnResubmit) btnResubmit.onclick = resubmit;

  window.addEventListener("beforeunload", () => {
    if ($("#saveStatus").classList.contains("dirty") && validate(false)) {
      clearTimeout(saveTimer);
      saveChanges(true);
    }
  });

  load();
})();
