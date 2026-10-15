(() => {
  "use strict";
  const EP = window.EventPulse || {};
  if (typeof EP.ensureSeed === "function") EP.ensureSeed();

  const KEY = (EP.KEYS && EP.KEYS.speakerProfile) || "eventpulse_speaker_profile";
  const DEFAULT = {
    id: "SPK001",
    name: "Phan Anh Vũ",
    jobTitle: "Speaker",
    company: "EventPulse",
    expertise: ["AI", "Product", "Web Development"],
    bio: "Diễn giả và người làm sản phẩm, tập trung vào trải nghiệm người dùng và công nghệ.",
    avatar: "",
    social: { linkedin: "", website: "", facebook: "", twitter: "" },
  };
  const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // match UI: 5MB
  const $ = (s) => document.querySelector(s);
  let original = null;

  function get() {
    try {
      if (EP.getJSON) {
        const v = EP.getJSON(KEY, null);
        return v || structuredClone(DEFAULT);
      }
      return JSON.parse(localStorage.getItem(KEY)) || structuredClone(DEFAULT);
    } catch {
      return structuredClone(DEFAULT);
    }
  }

  function set(v) {
    try {
      if (EP.setJSON) EP.setJSON(KEY, v);
      else localStorage.setItem(KEY, JSON.stringify(v));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  /** Apply avatar UI safely (data URL needs quoted url()) */
  function applyAvatarUi(dataUrl) {
    const main = $("#avatarPreview");
    const side = $("#previewAvatar");
    if (!main) return;
    if (dataUrl) {
      main.dataset.src = dataUrl;
      main.style.backgroundImage = 'url("' + dataUrl + '")';
      main.style.backgroundSize = "cover";
      main.style.backgroundPosition = "center";
      main.textContent = "";
      if (side) {
        side.style.backgroundImage = 'url("' + dataUrl + '")';
        side.style.backgroundSize = "cover";
        side.style.backgroundPosition = "center";
        side.textContent = "";
      }
    } else {
      main.dataset.src = "";
      main.style.backgroundImage = "";
      main.textContent = "PV";
      if (side) {
        side.style.backgroundImage = "";
        side.textContent = "PV";
      }
    }
  }

  function fill(p) {
    $("#name").value = p.name || "";
    $("#jobTitle").value = p.jobTitle || "";
    $("#company").value = p.company || "";
    $("#expertise").value = (p.expertise || []).join(", ");
    $("#bio").value = p.bio || "";
    ["linkedin", "website", "facebook", "twitter"].forEach((k) => {
      const el = $("#" + k);
      if (el) el.value = (p.social && p.social[k]) || "";
    });
    applyAvatarUi(p.avatar || "");
    update();
  }

  function resetAvatar() {
    applyAvatarUi("");
    const input = $("#avatarInput");
    if (input) input.value = "";
  }

  function value() {
    return {
      id: "SPK001",
      name: ($("#name").value || "").trim(),
      jobTitle: ($("#jobTitle").value || "").trim(),
      company: ($("#company").value || "").trim(),
      expertise: ($("#expertise").value || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      bio: ($("#bio").value || "").trim(),
      avatar: ($("#avatarPreview") && $("#avatarPreview").dataset.src) || "",
      social: {
        linkedin: ($("#linkedin").value || "").trim(),
        website: ($("#website").value || "").trim(),
        facebook: ($("#facebook").value || "").trim(),
        twitter: ($("#twitter").value || "").trim(),
      },
    };
  }

  function validUrl(v) {
    if (!v) return true;
    try {
      const u = new URL(v);
      return ["http:", "https:"].includes(u.protocol);
    } catch {
      return false;
    }
  }

  function showMsg(text, isError) {
    const m = $("#message");
    if (!m) return;
    m.hidden = false;
    m.textContent = text;
    m.style.color = isError ? "#b91c1c" : "#15803d";
  }

  function validate(show = true) {
    let ok = true;
    const p = value();
    const nameBad = !p.name;
    const bioBad = p.bio.length < 20;
    const nameEl = $("#name");
    const bioEl = $("#bio");
    if (nameEl) nameEl.parentElement.classList.toggle("invalid", nameBad);
    if (bioEl) bioEl.parentElement.classList.toggle("invalid", bioBad);
    if ($("#nameError")) $("#nameError").textContent = nameBad ? "Vui lòng nhập họ và tên." : "";
    if ($("#bioError")) $("#bioError").textContent = bioBad ? "Tiểu sử cần ít nhất 20 ký tự." : "";
    if (nameBad || bioBad) ok = false;

    ["linkedin", "website", "facebook", "twitter"].forEach((k) => {
      const el = $("#" + k);
      if (!el) return;
      const bad = !validUrl(el.value.trim());
      if ($("#" + k + "Error")) $("#" + k + "Error").textContent = bad ? "URL không hợp lệ." : "";
      el.parentElement.classList.toggle("invalid", bad);
      if (bad) ok = false;
    });

    if (show && !ok) showMsg("Vui lòng kiểm tra các trường được đánh dấu.", true);
    return ok;
  }

  function update() {
    const p = value();
    if ($("#bioCount")) $("#bioCount").textContent = p.bio.length + "/500";
    if ($("#previewName")) $("#previewName").textContent = p.name || "Tên diễn giả";
    if ($("#previewRole")) $("#previewRole").textContent = p.jobTitle || "Speaker";
    if ($("#previewCompany")) $("#previewCompany").textContent = p.company || "EventPulse";
    if ($("#previewBio")) $("#previewBio").textContent = p.bio || "Chưa có tiểu sử.";
    if ($("#previewTags")) {
      $("#previewTags").innerHTML = p.expertise
        .map((x) => '<span class="tag">' + esc(x) + "</span>")
        .join("");
    }
    if ($("#previewSocials")) {
      $("#previewSocials").innerHTML = Object.entries(p.social)
        .filter(([, v]) => v)
        .map(
          ([k, v]) =>
            '<a href="' + esc(v) + '" target="_blank" rel="noopener">' + k + "</a>"
        )
        .join("");
    }
    // keep side avatar in sync
    applyAvatarUi(p.avatar || "");

    const checks = [
      ["checkName", !!p.name],
      ["checkBio", p.bio.length >= 20],
      ["checkAvatar", !!p.avatar],
      ["checkLinks", Object.values(p.social).every(validUrl)],
    ];
    checks.forEach(([id, good]) => {
      const el = $("#" + id);
      if (!el) return;
      el.classList.toggle("ok", good);
      el.textContent =
        (good ? "✓ " : "○ ") +
        {
          checkName: "Họ tên",
          checkBio: "Tiểu sử",
          checkAvatar: "Ảnh đại diện",
          checkLinks: "Liên kết hợp lệ",
        }[id];
    });
  }

  function save() {
    if (!validate(true)) return;
    const p = value();
    const ok = set(p);
    if (!ok) {
      showMsg("✕ Không lưu được hồ sơ (LocalStorage đầy hoặc lỗi). Thử ảnh nhỏ hơn.", true);
      return;
    }
    original = JSON.parse(JSON.stringify(p));
    showMsg("✓ Đã lưu hồ sơ diễn giả.", false);
    setTimeout(() => {
      const m = $("#message");
      if (m) m.hidden = true;
    }, 2500);
  }

  function preview() {
    const p = value();
    const box = $("#modalPreview");
    if (!box) return;
    box.innerHTML =
      '<article class="profile-preview"><div class="preview-avatar" style="' +
      (p.avatar
        ? "background-image:url('" + esc(p.avatar) + "');background-size:cover;background-position:center;color:transparent"
        : "") +
      '">' +
      (p.avatar ? "" : "PV") +
      "</div><h2>" +
      esc(p.name || "Tên diễn giả") +
      '</h2><p class="preview-role">' +
      esc(p.jobTitle || "Speaker") +
      '</p><p class="muted">' +
      esc(p.company || "") +
      '</p><div class="tags">' +
      p.expertise.map((x) => '<span class="tag">' + esc(x) + "</span>").join("") +
      '</div><p class="preview-bio">' +
      esc(p.bio || "Chưa có tiểu sử.") +
      '</p><div class="socials">' +
      Object.entries(p.social)
        .filter(([, v]) => v)
        .map(([k, v]) => '<a href="' + esc(v) + '" target="_blank">' + k + "</a>")
        .join("") +
      "</div></article>";
    $("#previewModal").hidden = false;
  }

  function openFilePicker() {
    const input = $("#avatarInput");
    if (!input) {
      showMsg("Không tìm thấy ô chọn ảnh.", true);
      return;
    }
    input.value = ""; // allow re-select same file
    input.click();
  }

  function onAvatarFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    if (!f.type || !f.type.startsWith("image/")) {
      showMsg("Vui lòng chọn file ảnh (PNG, JPG, WEBP).", true);
      if ($("#avatarError")) $("#avatarError").textContent = "Định dạng không hợp lệ.";
      return;
    }
    if (f.size > MAX_AVATAR_BYTES) {
      showMsg("Ảnh tối đa 5MB.", true);
      if ($("#avatarError")) $("#avatarError").textContent = "File quá lớn (tối đa 5MB).";
      return;
    }

    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result;
      if (typeof dataUrl !== "string" || dataUrl.indexOf("data:image") !== 0) {
        showMsg("Không đọc được file ảnh.", true);
        return;
      }
      applyAvatarUi(dataUrl);
      if ($("#avatarError")) $("#avatarError").textContent = "";
      update();
      showMsg("Đã chọn ảnh mới — bấm «Lưu thay đổi» để lưu hồ sơ.", false);
    };
    r.onerror = () => {
      showMsg("Không đọc được file ảnh.", true);
    };
    r.readAsDataURL(f);
  }

  // Form
  const form = $("#speakerForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      save();
    });
  }

  ["name", "jobTitle", "company", "expertise", "bio", "linkedin", "website", "facebook", "twitter"].forEach(
    (id) => {
      const el = $("#" + id);
      if (!el) return;
      el.addEventListener("input", () => {
        update();
        if (el.parentElement && el.parentElement.classList.contains("invalid")) validate(false);
      });
    }
  );

  // FIX: wire "Đổi ảnh" button → hidden file input
  const uploadBtn = $("#uploadBtn");
  if (uploadBtn) {
    uploadBtn.type = "button";
    uploadBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openFilePicker();
    });
  }

  // Click avatar circle also opens picker
  const avatarPreview = $("#avatarPreview");
  if (avatarPreview) {
    avatarPreview.style.cursor = "pointer";
    avatarPreview.title = "Nhấn để đổi ảnh";
    avatarPreview.addEventListener("click", openFilePicker);
  }

  const avatarInput = $("#avatarInput");
  if (avatarInput) {
    avatarInput.addEventListener("change", onAvatarFile);
  }

  const removeBtn = $("#removeAvatar");
  if (removeBtn) {
    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      resetAvatar();
      update();
      showMsg("Đã xoá ảnh đại diện (chưa lưu). Bấm Lưu để xác nhận.", false);
    });
  }

  if ($("#previewBtn")) $("#previewBtn").onclick = preview;
  if ($("#closeModal")) $("#closeModal").onclick = () => ($("#previewModal").hidden = true);
  if ($("#previewModal")) {
    $("#previewModal").onclick = (e) => {
      if (e.target.id === "previewModal") $("#previewModal").hidden = true;
    };
  }
  if ($("#resetBtn")) {
    $("#resetBtn").onclick = () => {
      fill(original || DEFAULT);
      showMsg("Đã hoàn tác về bản đã lưu.", false);
      setTimeout(() => {
        const m = $("#message");
        if (m) m.hidden = true;
      }, 2000);
    };
  }
  if ($("#notifyBtn")) {
    $("#notifyBtn").onclick = () => {
      const n = JSON.parse(localStorage.getItem("eventpulse_notifications") || "[]");
      alert(n.length ? "Bạn có " + n.length + " thông báo." : "Không có thông báo mới.");
    };
  }

  const data = get();
  original = JSON.parse(JSON.stringify(data));
  fill(data);
})();
