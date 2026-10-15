(() => {
  "use strict";
  const EP = window.EventPulse || {};
  const $ = (s) => document.querySelector(s);

  const toast = (msg, isError) => {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    if (isError) t.style.background = "#b91c1c";
    else t.style.background = "";
    setTimeout(() => {
      t.classList.remove("show");
      t.style.background = "";
    }, 2000);
  };

  const setStatus = (msg) => {
    const el = $("#saveStatus");
    if (!el) return;
    el.textContent = msg;
    setTimeout(() => {
      el.textContent = "✓ Đã tự động lưu";
    }, 1500);
  };

  function loadForm() {
    const s = typeof EP.getSettings === "function" ? EP.getSettings() : {};
    if ($("#name")) $("#name").value = s.name || "";
    if ($("#language")) $("#language").value = s.language || "vi";
    if ($("#autosave")) $("#autosave").checked = !!s.autosave;
    if ($("#reminder")) $("#reminder").checked = !!s.reminder;
    if ($("#role")) $("#role").value = s.role || "all";
    document.body.classList.toggle("dark", s.theme === "dark");
    document.querySelectorAll(".theme").forEach((x) =>
      x.classList.toggle("active", x.dataset.theme === (s.theme || "light"))
    );
  }

  function savePatch(patch) {
    try {
      if (typeof EP.setSettings !== "function") throw new Error("Settings API unavailable");
      EP.setSettings(patch);
      setStatus("✓ Đã tự động lưu");
      toast("Đã lưu thay đổi");
      if (typeof EP.applyI18nNav === "function") EP.applyI18nNav();
      if (typeof EP.applyRoleNav === "function") EP.applyRoleNav();
      return true;
    } catch (e) {
      toast("Lỗi lưu: " + (e.message || "không xác định"), true);
      setStatus("✕ Lỗi lưu");
      return false;
    }
  }

  document.querySelectorAll(".nav-item").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    })
  );

  document.querySelectorAll(".theme").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll(".theme").forEach((x) => x.classList.remove("active"));
      btn.classList.add("active");
      savePatch({ theme: btn.dataset.theme });
    })
  );

  ["autosave", "reminder", "language", "name", "role"].forEach((id) => {
    const el = $("#" + id);
    if (!el) return;
    el.addEventListener("change", () => {
      if (id === "name" && el.value.trim().length < 2) {
        toast("Tên chưa hợp lệ", true);
        return;
      }
      const patch = {};
      if (el.type === "checkbox") patch[id] = el.checked;
      else patch[id] = el.value;
      savePatch(patch);
    });
  });

  const form = $("#passwordForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const current = $("#currentPassword").value;
      const newPass = $("#newPassword").value;
      const confirm = $("#confirmPassword").value;
      const msg = $("#passwordMessage");
      if (!current || !newPass || !confirm) {
        msg.textContent = "Vui lòng nhập đầy đủ thông tin.";
        msg.style.color = "#b91c1c";
        return;
      }
      if (newPass.length < 6) {
        msg.textContent = "Mật khẩu mới phải có ít nhất 6 ký tự.";
        msg.style.color = "#b91c1c";
        return;
      }
      if (newPass !== confirm) {
        msg.textContent = "Mật khẩu xác nhận không khớp.";
        msg.style.color = "#b91c1c";
        return;
      }
      msg.textContent = "Đổi mật khẩu thành công (mock).";
      msg.style.color = "#15803d";
      e.target.reset();
      toast("Đã cập nhật mật khẩu");
    });
  }

  loadForm();
})();
