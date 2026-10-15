/* EventPulse A4 — AI-2 Conflict Resolver
 * Prototype implementation using mock data + LocalStorage.
 *
 * Flow:
 * conflict input -> validation -> loading -> AI result -> explanation
 * -> user control -> update agenda -> notification -> My Agenda
 */

(() => {
  "use strict";

  const EP = window.EventPulse || {};
  const STORAGE_KEYS = EP.KEYS || {
    currentUser: "eventpulse_currentUser",
    sessions: "eventpulse_sessions",
    agendas: "eventpulse_agendas",
    notifications: "eventpulse_notifications",
    aiConflict: "eventpulse_aiConflict"
  };

  /* Prefer shared seed; keep minimal fallback for aiConflict shape */
  const MOCK = {
    currentUser: (EP.SEED && EP.SEED.currentUser) || {
      id: "USR001",
      fullName: "Nguyễn Minh Anh",
      role: "attendee",
      interests: ["web-development", "ai"]
    },
    sessions: (EP.SEED && EP.SEED.sessions) || [],
    agendas: (EP.SEED && EP.SEED.agendas) || [],
    notifications: (EP.SEED && EP.SEED.notifications) || [],
    aiConflict: (EP.SEED && EP.SEED.aiConflict) || {
      userId: "USR001",
      conflictingSessionIds: ["SES003", "SES001"],
      suggestedSessionId: "SES004",
      reason: "Phiên thay thế có chủ đề tương tự và không trùng giờ với lịch hiện tại.",
      reasons: [
        "Chủ đề AI phù hợp với sở thích của bạn",
        "Không trùng giờ với các phiên đang lưu",
        "Còn chỗ và diễn ra trong cùng sự kiện"
      ],
      score: 0.89,
      status: "success"
    }
  };

  const state = {
    currentUser: null,
    sessions: [],
    agendas: [],
    notifications: [],
    aiConflict: null,
    selectedAlternative: null,
    retryCount: 0
  };

  const $ = (selector) => document.querySelector(selector);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getStored(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch (error) {
      console.warn("Không thể đọc LocalStorage:", error);
      return clone(fallback);
    }
  }

  function saveStored(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function seedStorage() {
    if (typeof EP.ensureSeed === "function") {
      EP.ensureSeed();
      return;
    }
    if (!localStorage.getItem(STORAGE_KEYS.currentUser)) {
      saveStored(STORAGE_KEYS.currentUser, MOCK.currentUser);
    }
    if (!localStorage.getItem(STORAGE_KEYS.sessions)) {
      saveStored(STORAGE_KEYS.sessions, MOCK.sessions || []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.agendas)) {
      saveStored(STORAGE_KEYS.agendas, MOCK.agendas || []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.notifications)) {
      saveStored(STORAGE_KEYS.notifications, MOCK.notifications || []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.aiConflict)) {
      saveStored(STORAGE_KEYS.aiConflict, MOCK.aiConflict);
    }
  }

  function loadState() {
    seedStorage();

    state.currentUser = getStored(STORAGE_KEYS.currentUser, MOCK.currentUser);
    state.sessions = getStored(STORAGE_KEYS.sessions, MOCK.sessions || []);
    state.agendas = getStored(STORAGE_KEYS.agendas, MOCK.agendas || []);
    state.notifications = getStored(STORAGE_KEYS.notifications, MOCK.notifications || []);
    state.aiConflict = getStored(STORAGE_KEYS.aiConflict, MOCK.aiConflict);
  }

  function saveState() {
    saveStored(STORAGE_KEYS.agendas, state.agendas);
    saveStored(STORAGE_KEYS.notifications, state.notifications);
    saveStored(STORAGE_KEYS.aiConflict, state.aiConflict);
  }

  function getSession(id) {
    return state.sessions.find((session) => session.id === id);
  }

  function formatTime(iso) {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));
  }

  function formatDate(iso) {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(new Date(iso));
  }

  function getTimeRange(session) {
    return `${formatTime(session.startTime)} – ${formatTime(session.endTime)}`;
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function validateConflictInput() {
    const ids = state.aiConflict?.conflictingSessionIds || [];
    const sessions = ids.map(getSession).filter(Boolean);

    if (sessions.length !== 2) {
      throw new Error("Không đủ dữ liệu để xác định hai phiên xung đột.");
    }

    // Correct overlap: start < other.end && end > other.start
    // (adjacent slots like 09:00–10:00 and 10:00–11:00 are NOT conflicts)
    if (!isOverlapping(sessions[0], sessions[1])) {
      throw new Error("Hai phiên hiện không còn trùng thời gian.");
    }

    return sessions;
  }

  function renderConflictSessions() {
    const sessions = validateConflictInput();
    $("#conflictTime").textContent = getTimeRange(sessions[0]);

    $("#conflictSessions").innerHTML = sessions.map((session, index) => `
      <article class="session-card ${index === 0 ? "conflict-a" : "conflict-b"}">
        <span class="session-number">Phiên ${index + 1}</span>
        <div class="session-title">${escapeHTML(session.title)}</div>
        <div class="session-meta">
          <span>🕐 ${escapeHTML(getTimeRange(session))}</span>
          <span>📍 ${escapeHTML(session.room)}</span>
          <span>👤 ${escapeHTML(session.speaker)}</span>
          <span>👥 ${session.registeredCount}/${session.capacity} người</span>
        </div>
        <span class="topic-tag">${escapeHTML(session.category)}</span>
      </article>
    `).join("");
  }

  function renderSummary() {
    const userAgenda = state.agendas.filter(
      (item) => item.userId === state.currentUser.id && item.status === "saved"
    );

    const uniqueHours = new Set(
      userAgenda
        .map((item) => getSession(item.sessionId))
        .filter(Boolean)
        .map((session) => `${session.startTime}-${session.endTime}`)
    );

    const uniqueTopics = new Set(
      userAgenda
        .map((item) => getSession(item.sessionId))
        .filter(Boolean)
        .map((session) => session.category)
    );

    $("#agendaCount").textContent = userAgenda.length;
    $("#eventCount").textContent = uniqueHours.size;
    $("#topicCount").textContent = uniqueTopics.size;
    $("#conflictCount").textContent = "1";
  }

  function renderLoading() {
    $("#failureCard").hidden = true;
    $("#alternativesCard").hidden = true;
    $("#aiActions").hidden = true;
    $("#confidenceBadge").hidden = true;

    $("#aiContent").innerHTML = `
      <div class="loading-state">
        <span class="spinner" aria-hidden="true"></span>
        <div>
          <strong>AI đang phân tích...</strong>
          <div>Đang kiểm tra lịch trình và tìm phiên phù hợp.</div>
        </div>
      </div>
    `;
  }

  function runConflictResolver() {
    renderLoading();

    window.setTimeout(() => {
      try {
        validateConflictInput();

        // Mock AI: mô phỏng processing ở Frontend.
        // Retry lần 2+ có thể tạo confidence khác để demo trạng thái động.
        const base = state.aiConflict;
        const score = state.retryCount > 0 ? 0.91 : base.score;

        // After 2 retries still allow success with slightly lower confidence,
        // then user can pick manual alternative if needed.
        if (state.retryCount >= 3) {
          renderFailure(
            "AI chưa tìm được đề xuất đủ chắc chắn. Bạn có thể thử lại hoặc chọn thủ công."
          );
          return;
        }

        state.aiConflict = {
          ...base,
          score,
          status: "success"
        };
        saveStored(STORAGE_KEYS.aiConflict, state.aiConflict);

        renderAIResult();
      } catch (error) {
        renderFailure(error.message);
      }
    }, 900);
  }

  function renderAIResult() {
    const result = state.aiConflict;
    const suggestion = getSession(result.suggestedSessionId);

    if (!suggestion) {
      renderFailure("Không tìm thấy session được AI đề xuất.");
      return;
    }

    $("#failureCard").hidden = true;
    $("#confidenceBadge").hidden = false;
    $("#confidenceBadge").textContent = `Confidence: ${Math.round(result.score * 100)}%`;

    $("#aiContent").innerHTML = `
      <div class="ai-result">
        <div class="ai-result-main">
          <span class="status-badge status-success">PHÙ HỢP</span>
          <h3>${escapeHTML(suggestion.title)}</h3>
          <div class="ai-result-meta">
            <span>🕐 ${escapeHTML(getTimeRange(suggestion))}</span>
            <span>📍 ${escapeHTML(suggestion.room)}</span>
            <span>👤 ${escapeHTML(suggestion.speaker)}</span>
          </div>

          <div class="ai-reason">
            <strong>Vì sao AI đề xuất?</strong>
            ${escapeHTML(result.reason)}
            <ul class="check-list">
              ${result.reasons.map((reason) => `<li>${escapeHTML(reason)}</li>`).join("")}
            </ul>
          </div>
        </div>

        <span class="topic-tag">${escapeHTML(suggestion.category)}</span>
      </div>
    `;

    $("#aiActions").hidden = false;
  }

  function renderFailure(message) {
    $("#aiActions").hidden = true;
    $("#confidenceBadge").hidden = true;
    $("#alternativesCard").hidden = true;
    $("#failureCard").hidden = false;
    $("#failureText").textContent = message;

    $("#aiContent").innerHTML = `
      <div class="empty-state">
        <span class="failure-icon" aria-hidden="true">!</span>
        <div>AI chưa có kết quả chắc chắn.</div>
      </div>
    `;
  }

  function getAlternativeSessions() {
    const agendaSessionIds = new Set(
      state.agendas
        .filter((item) => item.userId === state.currentUser.id && item.status === "saved")
        .map((item) => item.sessionId)
    );

    const conflictingIds = new Set(state.aiConflict.conflictingSessionIds);

    return state.sessions.filter((session) => {
      if (conflictingIds.has(session.id)) return false;
      if (agendaSessionIds.has(session.id)) return false;
      if (session.status !== "published") return false;

      // Không lấy session trùng thời gian với agenda khác.
      return !state.agendas.some((item) => {
        if (item.userId !== state.currentUser.id || item.status !== "saved") return false;
        const agendaSession = getSession(item.sessionId);
        return agendaSession && isOverlapping(session, agendaSession);
      });
    });
  }

  function isOverlapping(a, b) {
    if (typeof EP.isOverlapping === "function") return EP.isOverlapping(a, b);
    const aStart = new Date(a.startTime).getTime();
    const aEnd = new Date(a.endTime).getTime();
    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();
    return aStart < bEnd && bStart < aEnd;
  }

  function renderAlternatives() {
    const alternatives = getAlternativeSessions();

    $("#alternativesCard").hidden = false;

    if (!alternatives.length) {
      $("#alternativesList").innerHTML = `
        <div class="empty-state">
          <div>
            <strong>Không có phiên thay thế.</strong>
            <div>Hãy thử lại AI hoặc giữ nguyên lịch hiện tại.</div>
          </div>
        </div>
      `;
      return;
    }

    $("#alternativesList").innerHTML = alternatives.map((session) => `
      <button class="option-card" type="button" data-session-id="${escapeHTML(session.id)}">
        <div class="option-card-title">${escapeHTML(session.title)}</div>
        <div class="option-card-meta">
          ${escapeHTML(session.category)} · ${escapeHTML(getTimeRange(session))}
          · ${escapeHTML(session.room)} · ${escapeHTML(session.speaker)}
        </div>
      </button>
    `).join("");

    document.querySelectorAll(".option-card").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedAlternative = button.dataset.sessionId;
        document.querySelectorAll(".option-card").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        showToast("Đã chọn phiên. Nhấn Chấp nhận để áp dụng vào agenda.");
      });
    });
  }

  function getReplacementId() {
    return state.selectedAlternative || state.aiConflict.suggestedSessionId;
  }

  function replaceConflictingAgenda(replacementSessionId) {
    const userId = state.currentUser.id;
    const conflictingIds = new Set(state.aiConflict.conflictingSessionIds);

    const target = state.agendas.find(
      (item) =>
        item.userId === userId &&
        item.status === "saved" &&
        conflictingIds.has(item.sessionId)
    );

    if (!target) {
      throw new Error("Không tìm thấy agenda item cần thay thế.");
    }

    const replacement = getSession(replacementSessionId);
    if (!replacement) {
      throw new Error("Phiên thay thế không tồn tại.");
    }

    const hasDuplicate = state.agendas.some(
      (item) =>
        item.userId === userId &&
        item.status === "saved" &&
        item.sessionId === replacementSessionId
    );

    if (hasDuplicate) {
      throw new Error("Phiên này đã có trong agenda của bạn.");
    }

    const conflictingSession = getSession(target.sessionId);

    // U — cập nhật agenda.
    target.sessionId = replacementSessionId;
    target.status = "saved";
    target.updatedAt = new Date().toISOString();

    // Notification theo DATA_SCHEMA.
    state.notifications.unshift({
      id: `NOT${String(Date.now()).slice(-6)}`,
      userId,
      type: "schedule-change",
      title: "Đã xử lý xung đột lịch",
      message: `Đã thay "${conflictingSession.title}" bằng "${replacement.title}".`,
      relatedEntityType: "session",
      relatedEntityId: replacementSessionId,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    saveState();
  }

  function acceptSuggestion() {
    try {
      const replacementId = getReplacementId();
      replaceConflictingAgenda(replacementId);
      renderSummary();
      showToast("✓ Đã cập nhật agenda và tạo thông báo thành công.");

      window.setTimeout(() => {
        // Khi tích hợp repo thật, thay bằng đường dẫn thật của nhóm.
        window.location.href = "../attendee/my-agenda.html";
      }, 850);
    } catch (error) {
      renderFailure(error.message);
    }
  }

  function skipSuggestion() {
    showToast("Đã bỏ qua đề xuất. Agenda chưa được thay đổi.");
    window.setTimeout(() => {
      window.location.href = "../attendee/my-agenda.html";
    }, 700);
  }

  function retry() {
    state.retryCount += 1;
    state.selectedAlternative = null;
    runConflictResolver();
  }

  function showToast(message) {
    const toast = $("#globalMessage");
    toast.textContent = message;
    toast.hidden = false;

    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => {
      toast.hidden = true;
    }, 3000);
  }

  function wireEvents() {
    $("#acceptButton").addEventListener("click", acceptSuggestion);
    $("#alternativesButton").addEventListener("click", renderAlternatives);
    $("#skipButton").addEventListener("click", skipSuggestion);
    $("#retryButton").addEventListener("click", retry);
    $("#failureRetryButton").addEventListener("click", retry);
    $("#manualButton").addEventListener("click", renderAlternatives);

    $("#closeAlternatives").addEventListener("click", () => {
      $("#alternativesCard").hidden = true;
    });

    $("#backButton").addEventListener("click", () => {
      window.location.href = "../attendee/my-agenda.html";
    });

    $("#notificationButton").addEventListener("click", () => {
      const unread = state.notifications.filter(
        (notification) => notification.userId === state.currentUser.id && !notification.isRead
      );

      if (!unread.length) {
        showToast("Bạn chưa có thông báo mới.");
        return;
      }

      unread.forEach((notification) => {
        notification.isRead = true;
      });
      saveState();
      $("#notificationDot").hidden = true;
      showToast(`Bạn có ${unread.length} thông báo mới.`);
    });
  }

  function init() {
    loadState();

    try {
      renderConflictSessions();
      renderSummary();
    } catch (error) {
      renderFailure(error.message);
    }

    if (state.notifications.some(
      (notification) => notification.userId === state.currentUser.id && !notification.isRead
    )) {
      $("#notificationDot").hidden = false;
    }

    wireEvents();
    runConflictResolver();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
