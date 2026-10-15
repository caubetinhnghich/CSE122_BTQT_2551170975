(() => {
  "use strict";

  const EP = window.EventPulse || {};
  if (typeof EP.ensureSeed === "function") EP.ensureSeed();

  const STORAGE_KEY = "eventpulse_session_materials";
  const SESSION_KEY = "eventpulse_sessions";
  const USER_ID = "USR102";
  const SESSION_ID = new URLSearchParams(location.search).get("id") || "SES102";
  const MAX_SIZE = 20 * 1024 * 1024;
  const ALLOWED = ["pdf","ppt","pptx","doc","docx","xls","xlsx","zip","txt","png","jpg","jpeg"];

  const $ = s => document.querySelector(s);
  let session = null;
  let materials = [];
  let pendingDeleteId = null;

  const seedMaterials = [
    {
      id:"MAT001", sessionId:"SES102", speakerId:USER_ID,
      fileName:"modern-javascript-slides.pdf", size:5242880, type:"application/pdf",
      uploadedAt:"2026-09-20T09:30:00.000Z"
    },
    {
      id:"MAT002", sessionId:"SES102", speakerId:USER_ID,
      fileName:"reading-list.txt", size:18432, type:"text/plain",
      uploadedAt:"2026-09-21T14:15:00.000Z"
    }
  ];

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function loadSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const sessions = JSON.parse(raw);
        session = sessions.find(s => s.id === SESSION_ID && (!s.speakerIds || s.speakerIds.includes(USER_ID)));
      } catch {}
    }
    if (!session && SESSION_ID === "SES102") {
      session = {
        id:"SES102",
        title:"Modern JavaScript Best Practices",
        reviewStatus:"pending",
        status:"pending",
        speakerIds:[USER_ID]
      };
    }
    if (!session) throw new Error("Không tìm thấy session hoặc bạn không có quyền quản lý tài liệu.");
  }

  function loadMaterials() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      materials = seedMaterials.filter(x => x.sessionId === SESSION_ID);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
      return;
    }
    try {
      const all = JSON.parse(raw);
      materials = all.filter(x => x.sessionId === SESSION_ID && x.speakerId === USER_ID);
    } catch {
      throw new Error("Dữ liệu tài liệu bị lỗi. Không thể đọc danh sách.");
    }
  }

  function persist() {
    let all = [];
    try { all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch {}
    all = all.filter(x => !(x.sessionId === SESSION_ID && x.speakerId === USER_ID));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, ...materials]));
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
    if (bytes < 1024*1024*1024) return `${(bytes/(1024*1024)).toFixed(1)} MB`;
    return `${(bytes/(1024*1024*1024)).toFixed(1)} GB`;
  }

  function formatDate(value) {
    return new Date(value).toLocaleString("vi-VN", {
      day:"2-digit", month:"2-digit", year:"numeric",
      hour:"2-digit", minute:"2-digit"
    });
  }

  function ext(name) {
    return (name.split(".").pop() || "FILE").toUpperCase().slice(0,5);
  }

  function showToast(message, error=false) {
    const el = $("#toast");
    el.textContent = (error ? "✕ " : "✓ ") + message;
    el.style.background = error ? "#fff0f0" : "#eaf8ef";
    el.style.color = error ? "#a11" : "#166534";
    el.hidden = false;
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => el.hidden = true, 2600);
  }

  function render() {
    $("#sessionInfo").textContent = `${session.id} · ${session.title}`;
    $("#sessionTitle").textContent = session.title || "—";
    $("#sessionId").textContent = session.id || "—";

    const status = session.reviewStatus || session.status || "pending";
    const labels = {pending:"Chờ duyệt", approved:"Đã duyệt", rejected:"Từ chối", published:"Đã duyệt"};
    const badge = $("#statusBadge");
    badge.textContent = labels[status] || status;
    badge.className = "status-badge " + (status === "published" ? "approved" : status);

    $("#materialCount").textContent = `${materials.length} tài liệu`;
    $("#sideCount").textContent = materials.length;

    const list = $("#materialList");
    $("#emptyState").hidden = materials.length !== 0;

    if (!materials.length) {
      list.innerHTML = "";
      return;
    }

    list.innerHTML = materials.map(m => {
      const isLink = m.kind === "link" || (m.type || "").includes("link");
      const icon = isLink ? "URL" : escapeHtml(ext(m.fileName));
      const meta = isLink
        ? `Link · ${formatDate(m.uploadedAt)}`
        : `${formatSize(m.size)} · Upload ${formatDate(m.uploadedAt)}`;
      const nameHtml = isLink && m.url
        ? `<a class="material-name" href="${escapeHtml(m.url)}" target="_blank" rel="noopener" title="${escapeHtml(m.url)}">${escapeHtml(m.fileName)}</a>`
        : `<div class="material-name" title="${escapeHtml(m.fileName)}">${escapeHtml(m.fileName)}</div>`;
      return `
      <article class="material-item">
        <div class="file-icon">${icon}</div>
        <div class="material-info">
          ${nameHtml}
          <div class="material-meta">${meta}</div>
        </div>
        <div class="material-actions">
          <button class="icon-btn" title="Xem thông tin" data-info="${m.id}">i</button>
          <button class="icon-btn delete" title="Xoá tài liệu" data-delete="${m.id}">×</button>
        </div>
      </article>`;
    }).join("");

    list.querySelectorAll("[data-info]").forEach(btn => {
      btn.onclick = () => {
        const m = materials.find(x => x.id === btn.dataset.info);
        if (m) showToast(`${m.fileName} · ${formatSize(m.size)}`);
      };
    });
    list.querySelectorAll("[data-delete]").forEach(btn => {
      btn.onclick = () => openDelete(btn.dataset.delete);
    });
  }

  function openDelete(id) {
    const m = materials.find(x => x.id === id);
    if (!m) return;
    pendingDeleteId = id;
    $("#deleteFileName").textContent = m.fileName;
    $("#deleteModal").hidden = false;
  }

  function closeDelete() {
    pendingDeleteId = null;
    $("#deleteModal").hidden = true;
  }

  function deleteMaterial() {
    if (!pendingDeleteId) return;
    const target = materials.find(x => x.id === pendingDeleteId);
    materials = materials.filter(x => x.id !== pendingDeleteId);
    persist();
    closeDelete();
    render();
    showToast(`Đã xoá ${target?.fileName || "tài liệu"}.`);
  }

  function validateFile(file) {
    const extension = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED.includes(extension)) {
      showToast(`File .${extension || "không xác định"} không được hỗ trợ.`, true);
      return false;
    }
    if (file.size > MAX_SIZE) {
      showToast(`${file.name} vượt quá giới hạn 20MB.`, true);
      return false;
    }
    return true;
  }

  function makeId() {
    return "MAT" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();
  }

  function uploadFiles(fileList) {
    const files = [...fileList].filter(validateFile);
    if (!files.length) return;

    let index = 0;
    const next = () => {
      if (index >= files.length) {
        $("#uploadProgress").hidden = true;
        render();
        $("#successText").textContent = `${files.length} tài liệu đã được thêm vào session.`;
        $("#successModal").hidden = false;
        return;
      }

      const file = files[index++];
      $("#uploadProgress").hidden = false;
      $("#progressName").textContent = file.name;
      $("#progressPercent").textContent = "0%";
      $("#progressBar").style.width = "0%";

      let percent = 0;
      const timer = setInterval(() => {
        percent += Math.floor(Math.random() * 20) + 10;
        if (percent >= 100) percent = 100;
        $("#progressPercent").textContent = percent + "%";
        $("#progressBar").style.width = percent + "%";

        if (percent === 100) {
          clearInterval(timer);
          setTimeout(() => {
            materials.push({
              id: makeId(),
              sessionId: SESSION_ID,
              speakerId: USER_ID,
              fileName: file.name,
              size: file.size,
              type: file.type || "application/octet-stream",
              uploadedAt: new Date().toISOString()
            });
            persist();
            next();
          }, 160);
        }
      }, 110);
    };
    next();
  }

  function boot() {
    $("#loadingState").hidden = false;
    $("#errorState").hidden = true;
    $("#app").hidden = true;

    setTimeout(() => {
      try {
        loadSession();
        loadMaterials();
        render();
        $("#loadingState").hidden = true;
        $("#app").hidden = false;
      } catch (error) {
        $("#loadingState").hidden = true;
        $("#errorState").hidden = false;
        $("#errorMessage").textContent = error.message;
      }
    }, 500);
  }

  $("#chooseBtn").onclick = () => $("#fileInput").click();
  $("#emptyChooseBtn").onclick = () => $("#fileInput").click();
  $("#fileInput").onchange = e => {
    uploadFiles(e.target.files);
    e.target.value = "";
  };

  const drop = $("#dropZone");
  ["dragenter","dragover"].forEach(type => drop.addEventListener(type, e => {
    e.preventDefault(); e.stopPropagation(); drop.classList.add("dragover");
  }));
  ["dragleave","drop"].forEach(type => drop.addEventListener(type, e => {
    e.preventDefault(); e.stopPropagation(); drop.classList.remove("dragover");
  }));
  drop.addEventListener("drop", e => uploadFiles(e.dataTransfer.files));

  $("#cancelDelete").onclick = closeDelete;
  $("#confirmDelete").onclick = deleteMaterial;
  $("#successClose").onclick = () => {
    $("#successModal").hidden = true;
    $("#fileInput").focus();
  };
  $("#retryBtn").onclick = boot;
  $("#backBtn").onclick = () => location.href = "./my-sessions.html";

  [$("#deleteModal"), $("#successModal")].forEach(modal => {
    modal.addEventListener("click", e => {
      if (e.target === modal && modal === $("#deleteModal")) closeDelete();
    });
  });

  const addRefBtn = $("#addRefBtn");
  if (addRefBtn) {
    addRefBtn.onclick = () => {
      const url = ($("#refLinkInput")?.value || "").trim();
      const title = ($("#refTitleInput")?.value || "").trim();
      if (!url) {
        showToast("Vui lòng nhập URL.", true);
        return;
      }
      try {
        const u = new URL(url);
        if (!["http:", "https:"].includes(u.protocol)) throw new Error("protocol");
      } catch {
        showToast("URL không hợp lệ.", true);
        return;
      }
      materials.push({
        id: makeId(),
        sessionId: SESSION_ID,
        speakerId: USER_ID,
        fileName: title || url,
        url,
        kind: "link",
        size: 0,
        type: "text/uri-list",
        uploadedAt: new Date().toISOString(),
      });
      persist();
      if ($("#refLinkInput")) $("#refLinkInput").value = "";
      if ($("#refTitleInput")) $("#refTitleInput").value = "";
      render();
      showToast("Đã thêm link tham khảo.");
    };
  }

  boot();
})();