(() => {
  const USER_ID = "USR102";
  const EP = window.EventPulse || {};

  const $ = s => document.querySelector(s);
  let sessions = null;
  let editId = null;

  const statusLabel = {pending:"Chờ duyệt", approved:"Đã duyệt", rejected:"Từ chối"};

  function escapeHTML(v){
    return String(v ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  /** Only this speaker's sessions — full store is seeded via shared.js */
  function getData(){
    if (typeof EP.ensureSeed === "function") EP.ensureSeed();
    if (typeof EP.getSessionsForSpeaker === "function") {
      return EP.getSessionsForSpeaker(USER_ID).map((x) => ({ ...x }));
    }
    const raw = localStorage.getItem("eventpulse_sessions");
    const all = raw ? JSON.parse(raw) : [];
    return all.filter((s) => s.speakerIds?.includes(USER_ID));
  }

  /**
   * CRITICAL FIX: merge only USR102 sessions back into full list.
   * Never overwrite other speakers' sessions.
   */
  function save(){
    if (typeof EP.mergeSpeakerSessions === "function") {
      EP.mergeSpeakerSessions(USER_ID, sessions);
      return;
    }
    const KEY = "eventpulse_sessions";
    let all = [];
    try { all = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch {}
    const others = all.filter(
      (s) => !(Array.isArray(s.speakerIds) && s.speakerIds.includes(USER_ID))
    );
    localStorage.setItem(KEY, JSON.stringify([...others, ...sessions]));
  }

  function formatDate(v){
    return new Date(v).toLocaleString("vi-VN", {
      day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"
    });
  }

  function showToast(text){
    const t = $("#toast"); t.textContent = "✓ " + text; t.hidden = false;
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => t.hidden = true, 3200);
  }

  function pushNotification(title, message) {
    try {
      const key = "eventpulse_notifications";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      list.unshift({
        id: "NOT" + Date.now(),
        userId: USER_ID,
        type: "session-submit",
        title,
        message,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.warn(e);
    }
  }

  const FEEDBACK_MOCK = {
    SES101: [
      { stars: 5, text: "Nội dung rất thực tế, demo AI rõ ràng.", at: "2026-09-28T10:00:00" },
      { stars: 4, text: "Tempo hơi nhanh nhưng hữu ích.", at: "2026-09-29T11:20:00" },
      { stars: 5, text: "Slide đẹp, ví dụ dễ hiểu.", at: "2026-09-30T09:10:00" },
    ],
    SES102: [
      { stars: 4, text: "Pattern JS hiện đại, đáng theo dõi.", at: "2026-09-25T14:00:00" },
      { stars: 3, text: "Cần thêm bài tập thực hành.", at: "2026-09-26T08:30:00" },
    ],
    SES103: [
      { stars: 5, text: "Design system áp dụng được ngay.", at: "2026-09-20T16:00:00" },
    ],
  };

  function renderFeedback() {
    const filter = document.getElementById("feedbackFilter");
    const listEl = document.getElementById("fbList");
    if (!filter || !listEl || !sessions) return;

    const ids = sessions.map((s) => s.id);
    filter.innerHTML =
      '<option value="all">Tất cả session</option>' +
      sessions
        .map((s) => '<option value="' + s.id + '">' + s.title + "</option>")
        .join("");

    const selected = filter.dataset.current || "all";
    filter.value = selected;

    let items = [];
    ids.forEach((id) => {
      (FEEDBACK_MOCK[id] || []).forEach((f) => items.push({ ...f, sessionId: id }));
    });
    if (selected !== "all") items = items.filter((x) => x.sessionId === selected);
    items.sort((a, b) => new Date(b.at) - new Date(a.at));

    const avg = items.length
      ? (items.reduce((s, x) => s + x.stars, 0) / items.length).toFixed(1)
      : "—";
    const avgEl = document.getElementById("fbAvg");
    const cntEl = document.getElementById("fbCount");
    const starEl = document.getElementById("fbStars");
    if (avgEl) avgEl.textContent = avg;
    if (cntEl) cntEl.textContent = String(items.length);
    if (starEl) {
      const n = avg === "—" ? 0 : Math.round(Number(avg));
      starEl.textContent = "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
    }

    const titleOf = (id) => (sessions.find((s) => s.id === id) || {}).title || id;
    listEl.innerHTML = items.length
      ? items
          .map(
            (f) =>
              '<div style="border:1px solid #eee;border-radius:9px;padding:10px 12px;">' +
              '<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;">' +
              "<strong>" +
              "★".repeat(f.stars) +
              "</strong>" +
              '<span style="color:#737580;font-size:11px;">' +
              new Date(f.at).toLocaleString("vi-VN") +
              "</span></div>" +
              '<div style="color:#737580;font-size:11px;margin-bottom:4px;">' +
              titleOf(f.sessionId) +
              "</div>" +
              "<div>" +
              f.text +
              "</div></div>"
          )
          .join("")
      : '<p style="color:#737580;margin:0;">Chưa có nhận xét cho bộ lọc này.</p>';

    filter.onchange = () => {
      filter.dataset.current = filter.value;
      renderFeedback();
    };
  }

  function updateCounts(){
    $("#countAll").textContent = sessions.length;
    $("#countPending").textContent = sessions.filter(s => s.reviewStatus === "pending").length;
    $("#countApproved").textContent = sessions.filter(s => s.reviewStatus === "approved").length;
    $("#countRejected").textContent = sessions.filter(s => s.reviewStatus === "rejected").length;
  }

  function render(){
    updateCounts();
    const q = $("#searchInput").value.trim().toLowerCase();
    const f = $("#statusFilter").value;

    const list = sessions.filter(s => {
      const text = `${s.title} ${s.category} ${s.description}`.toLowerCase();
      return (f === "all" || s.reviewStatus === f) && (!q || text.includes(q));
    });

    $("#empty").hidden = list.length !== 0;
    $("#sessionList").innerHTML = list.map(s => `
      <article class="session-card">
        <div class="session-card-head">
          <span class="badge ${s.reviewStatus}">${statusLabel[s.reviewStatus]}</span>
          <span class="meta">${escapeHTML(s.category)}</span>
        </div>
        <div class="session-card-body">
          <h3>${escapeHTML(s.title)}</h3>
          <div class="meta">
            <span>🕐 ${formatDate(s.startTime)} - ${new Date(s.endTime).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}</span>
            <span>📍 ${escapeHTML(s.roomId || "Chưa xếp phòng")}</span>
          </div>
          <p class="desc">${escapeHTML(s.description)}</p>
          <div class="note">${escapeHTML(s.reviewNote || "Chưa có ghi chú.")}</div>
          <div class="actions">
            <button class="btn ghost mini" data-detail="${s.id}">Xem chi tiết</button>
            ${s.reviewStatus === "pending" ? `<button class="btn ghost mini" data-edit="${s.id}">Sửa nhanh</button>` : ""}
            <a class="btn ghost mini" href="./speaker-session-detail.html?id=${s.id}">Chỉnh sửa</a>
            <a class="btn ghost mini" href="./materials.html?id=${s.id}">Tài liệu</a>
          </div>
        </div>
      </article>
    `).join("");

    document.querySelectorAll("[data-detail]").forEach(b => b.onclick = () => showDetail(b.dataset.detail));
    document.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openEdit(b.dataset.edit));
  }

  function run(){
    $("#loading").hidden = false;
    $("#error").hidden = true;
    $("#empty").hidden = true;
    $("#sessionList").innerHTML = "";
    setTimeout(() => {
      try{
        sessions = getData();
        $("#loading").hidden = true;
        render();
        renderFeedback();
      }catch(e){
        $("#loading").hidden = true;
        $("#error").hidden = false;
        $("#errorText").textContent = e.message;
      }
    }, 450);
  }

  function showDetail(id){
    const s = sessions.find(x => x.id === id);
    if(!s) return;

    $("#modalContent").innerHTML = `
      <span class="badge ${s.reviewStatus}">${statusLabel[s.reviewStatus]}</span>
      <h2>${escapeHTML(s.title)}</h2>
      <div class="detail-row"><b class="detail-label">Chủ đề</b><span>${escapeHTML(s.category)}</span></div>
      <div class="detail-row"><b class="detail-label">Thời gian</b><span>${formatDate(s.startTime)} → ${formatDate(s.endTime)}</span></div>
      <div class="detail-row"><b class="detail-label">Phòng</b><span>${escapeHTML(s.roomId || "Chưa xếp phòng")}</span></div>
      <div class="detail-row"><b class="detail-label">Mô tả</b><span>${escapeHTML(s.description)}</span></div>
      <div class="history">
        <b>Lịch sử trạng thái</b>
        <p>Đề xuất: ${formatDate(s.createdAt)}</p>
        <p>Hiện tại: ${statusLabel[s.reviewStatus]}</p>
        <p>${escapeHTML(s.reviewNote || "")}</p>
      </div>
    `;
    $("#modal").hidden = false;
  }

  function resetForm(){
    ["title","category","startTime","endTime","room","description"].forEach(id => $("#"+id).value = "");
    $("#descriptionCount").textContent = "0";
    document.querySelectorAll(".field-error").forEach(e => e.textContent = "");
  }

  function openCreate(){
    editId = null;
    resetForm();
    $("#formHeading").textContent = "Đề xuất session mới";
    $("#formModal").hidden = false;
  }

  function openEdit(id){
    const s = sessions.find(x => x.id === id);
    if(!s) return;
    editId = id;
    $("#title").value = s.title;
    $("#category").value = s.category;
    $("#startTime").value = s.startTime.slice(0,16);
    $("#endTime").value = s.endTime.slice(0,16);
    $("#room").value = s.roomId || "";
    $("#description").value = s.description;
    $("#descriptionCount").textContent = s.description.length;
    $("#formHeading").textContent = "Sửa đề xuất session";
    $("#formModal").hidden = false;
  }

  function error(id,msg){ $("#"+id).textContent = msg; }

  function validate(){
    document.querySelectorAll(".field-error").forEach(e => e.textContent = "");
    let ok = true;
    const title = $("#title").value.trim();
    const cat = $("#category").value.trim();
    const start = $("#startTime").value;
    const end = $("#endTime").value;
    const desc = $("#description").value.trim();

    if(!title){error("titleError","Vui lòng nhập tên session.");ok=false;}
    if(!cat){error("categoryError","Vui lòng nhập chủ đề.");ok=false;}
    if(!start){error("startError","Vui lòng chọn thời gian bắt đầu.");ok=false;}
    if(!end){error("endError","Vui lòng chọn thời gian kết thúc.");ok=false;}
    if(start && end && new Date(end) <= new Date(start)){error("endError","Thời gian kết thúc phải sau bắt đầu.");ok=false;}
    if(desc.length < 20){error("descriptionError","Mô tả cần ít nhất 20 ký tự.");ok=false;}
    return ok;
  }

  $("#sessionForm").onsubmit = e => {
    e.preventDefault();
    if(!validate()) return;

    const payload = {
      title:$("#title").value.trim(),
      category:$("#category").value.trim(),
      startTime:$("#startTime").value + ":00",
      endTime:$("#endTime").value + ":00",
      roomId:$("#room").value.trim(),
      description:$("#description").value.trim(),
      updatedAt:new Date().toISOString()
    };

    if(editId){
      const i = sessions.findIndex(s => s.id === editId);
      sessions[i] = {
        ...sessions[i], ...payload,
        status:"pending", reviewStatus:"pending",
        reviewNote:"Đã cập nhật. Đang chờ ban tổ chức duyệt."
      };
      showToast("Đã cập nhật và gửi lại session · chờ ban tổ chức duyệt.");
      pushNotification("Session đã gửi lại", payload.title || sessions[i]?.title || "Session");
    }else{
      sessions.unshift({
        id:"SES" + Date.now(),
        eventId:"EVT001",
        ...payload,
        speakerIds:[USER_ID],
        status:"pending",
        reviewStatus:"pending",
        reviewNote:"Đang chờ ban tổ chức xem xét.",
        createdAt:new Date().toISOString()
      });
      showToast("Đã gửi đề xuất session mới · trạng thái: Chờ duyệt.");
      pushNotification("Đề xuất session mới", payload.title);
    }

    save();
    $("#formModal").hidden = true;
    render();
  };

  $("#description").oninput = e => $("#descriptionCount").textContent = e.target.value.length;
  $("#btnCreate").onclick = openCreate;
  $("#btnEmptyCreate").onclick = openCreate;
  $("#btnReload").onclick = run;
  $("#btnRetry").onclick = run;
  $("#searchInput").oninput = render;
  $("#statusFilter").onchange = render;

  document.querySelector("[data-close]").onclick = () => $("#modal").hidden = true;
  document.querySelectorAll("[data-form-close]").forEach(b => b.onclick = () => $("#formModal").hidden = true);
  $("#modal").onclick = e => { if(e.target === $("#modal")) $("#modal").hidden = true; };
  $("#formModal").onclick = e => { if(e.target === $("#formModal")) $("#formModal").hidden = true; };

  run();
})();