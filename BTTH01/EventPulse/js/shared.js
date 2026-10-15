/* EventPulse — Shared utilities + unified seed (safe global namespace) */
(function (global) {
  "use strict";

  const EP = global.EventPulse || {};

  /* ── Storage keys (single source of truth) ── */
  EP.KEYS = {
    currentUser: "eventpulse_currentUser",
    sessions: "eventpulse_sessions",
    agendas: "eventpulse_agendas",
    notifications: "eventpulse_notifications",
    aiConflict: "eventpulse_aiConflict",
    speakerProfile: "eventpulse_speaker_profile",
    materials: "eventpulse_session_materials",
    theme: "eventpulse-theme",
    settings: "eventpulse_settings",
  };

  /* ── DOM helpers ── */
  EP.$ = (sel, root) => (root || document).querySelector(sel);
  EP.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  EP.escapeHTML = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  EP.getJSON = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback != null ? structuredClone(fallback) : null;
      return JSON.parse(raw);
    } catch {
      return fallback != null ? structuredClone(fallback) : null;
    }
  };

  EP.setJSON = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  EP.formatDate = (iso) =>
    new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  EP.formatTime = (iso) =>
    new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  /** Overlap: a starts before b ends AND a ends after b starts */
  EP.isOverlapping = (a, b) => {
    const aStart = new Date(a.startTime || a.start).getTime();
    const aEnd = new Date(a.endTime || a.end).getTime();
    const bStart = new Date(b.startTime || b.start).getTime();
    const bEnd = new Date(b.endTime || b.end).getTime();
    if ([aStart, aEnd, bStart, bEnd].some((n) => Number.isNaN(n))) return false;
    return aStart < bEnd && aEnd > bStart;
  };

  /* ── Unified seed data ── */
  const SPEAKER_ID = "USR102";
  const ATTENDEE_ID = "USR001";

  EP.SEED = {
    currentUser: {
      id: ATTENDEE_ID,
      fullName: "Nguyễn Minh Anh",
      role: "attendee",
      interests: ["web-development", "ai", "product"],
    },
    speakerUser: {
      id: SPEAKER_ID,
      fullName: "Phan Anh Vũ",
      role: "speaker",
    },
    /** Full catalog: published sessions for attendee AI + speaker-owned sessions */
    sessions: [
      {
        id: "SES001",
        eventId: "EVT001",
        title: "Future of Web Development",
        description: "Xu hướng phát triển web hiện đại.",
        category: "Web Development",
        speaker: "Nguyễn Minh Anh",
        speakerIds: ["USR_OTHER"],
        room: "Room A",
        roomId: "ROM001",
        startTime: "2026-10-20T10:00:00",
        endTime: "2026-10-20T11:00:00",
        capacity: 150,
        registeredCount: 128,
        status: "published",
        reviewStatus: "approved",
        tags: ["web-development", "frontend"],
      },
      {
        id: "SES002",
        eventId: "EVT001",
        title: "Building AI-Powered Applications",
        description: "Xây dựng ứng dụng web có trải nghiệm AI.",
        category: "AI & Machine Learning",
        speaker: "Lê Thu Trang",
        speakerIds: [SPEAKER_ID],
        room: "Room B",
        roomId: "ROM002",
        startTime: "2026-10-20T11:00:00",
        endTime: "2026-10-20T12:00:00",
        capacity: 150,
        registeredCount: 142,
        status: "published",
        reviewStatus: "approved",
        reviewNote: "Session đã được ban tổ chức duyệt.",
        tags: ["ai", "machine-learning"],
        objectives: "Biết cách xác định điểm tích hợp AI phù hợp trong sản phẩm.",
        createdAt: "2026-09-05T09:00:00",
        updatedAt: "2026-09-10T09:00:00",
        history: [
          { status: "pending", at: "2026-09-05T09:00:00", note: "Đề xuất session." },
          { status: "approved", at: "2026-09-10T09:00:00", note: "Session đã được duyệt." },
        ],
      },
      {
        id: "SES003",
        eventId: "EVT001",
        title: "Modern JavaScript Best Practices",
        description: "Các kỹ thuật JavaScript hiện đại cho frontend.",
        category: "Web Development",
        speaker: "Trần Đức Huy",
        speakerIds: ["USR_OTHER"],
        room: "Room A",
        roomId: "ROM001",
        startTime: "2026-10-20T10:00:00",
        endTime: "2026-10-20T11:00:00",
        capacity: 120,
        registeredCount: 95,
        status: "published",
        reviewStatus: "approved",
        tags: ["javascript", "frontend", "web"],
      },
      {
        id: "SES004",
        eventId: "EVT001",
        title: "AI in Product Development",
        description: "Ứng dụng AI trong quá trình phát triển sản phẩm.",
        category: "AI & Machine Learning",
        speaker: "Phạm Quốc Bảo",
        speakerIds: ["USR_OTHER"],
        room: "Room C",
        roomId: "ROM003",
        startTime: "2026-10-20T13:30:00",
        endTime: "2026-10-20T14:30:00",
        capacity: 120,
        registeredCount: 87,
        status: "published",
        reviewStatus: "approved",
        tags: ["ai", "product", "machine-learning"],
      },
      {
        id: "SES005",
        eventId: "EVT001",
        title: "Design Systems in Practice",
        description: "Xây dựng và vận hành design system.",
        category: "Product & Design",
        speaker: "Phạm Quốc Bảo",
        speakerIds: ["USR_OTHER"],
        room: "Room D",
        roomId: "ROM004",
        startTime: "2026-10-20T13:30:00",
        endTime: "2026-10-20T14:30:00",
        capacity: 100,
        registeredCount: 71,
        status: "published",
        reviewStatus: "approved",
        tags: ["design", "product"],
      },
      {
        id: "SES006",
        eventId: "EVT001",
        title: "Product Analytics for Better Decisions",
        description: "Dùng dữ liệu để ra quyết định sản phẩm.",
        category: "Product & Data",
        speaker: "Vũ Hoàng Nam",
        speakerIds: ["USR_OTHER"],
        room: "Room E",
        roomId: "ROM005",
        startTime: "2026-10-20T16:00:00",
        endTime: "2026-10-20T17:00:00",
        capacity: 100,
        registeredCount: 60,
        status: "published",
        reviewStatus: "approved",
        tags: ["product"],
      },
      /* Speaker-owned (SP2 / SP3 / SP4) — same IDs as before for continuity */
      {
        id: "SES101",
        eventId: "EVT001",
        title: "Building AI-Powered Applications",
        description:
          "Thiết kế ứng dụng có AI và cách đưa AI vào trải nghiệm sản phẩm.",
        objectives: "Biết cách xác định điểm tích hợp AI phù hợp trong sản phẩm.",
        category: "ai",
        speakerIds: [SPEAKER_ID],
        roomId: "ROM002",
        room: "Room B",
        startTime: "2026-10-20T11:00:00",
        endTime: "2026-10-20T12:00:00",
        status: "published",
        reviewStatus: "approved",
        reviewNote: "Session đã được ban tổ chức duyệt.",
        createdAt: "2026-09-05T09:00:00",
        updatedAt: "2026-09-10T09:00:00",
        history: [
          { status: "pending", at: "2026-09-05T09:00:00", note: "Đề xuất session." },
          { status: "approved", at: "2026-09-10T09:00:00", note: "Session đã được duyệt." },
        ],
      },
      {
        id: "SES102",
        eventId: "EVT001",
        title: "Modern JavaScript Best Practices",
        description:
          "Các kỹ thuật JavaScript hiện đại cho web frontend dễ bảo trì.",
        objectives:
          "Người tham dự hiểu các pattern JavaScript hiện đại và biết áp dụng vào frontend.",
        category: "web-development",
        speakerIds: [SPEAKER_ID],
        roomId: "ROM001",
        room: "Room A",
        startTime: "2026-10-20T09:00:00",
        endTime: "2026-10-20T10:00:00",
        status: "pending",
        reviewStatus: "pending",
        reviewNote: "Đang chờ ban tổ chức xem xét.",
        createdAt: "2026-09-18T10:30:00",
        updatedAt: "2026-09-18T10:30:00",
        history: [
          {
            status: "pending",
            at: "2026-09-18T10:30:00",
            note: "Đề xuất session, chờ ban tổ chức xem xét.",
          },
        ],
      },
      {
        id: "SES103",
        eventId: "EVT001",
        title: "Design Systems in Practice",
        description:
          "Xây dựng design system dùng xuyên suốt sản phẩm và đội ngũ.",
        category: "product-design",
        speakerIds: [SPEAKER_ID],
        roomId: "ROM004",
        room: "Room D",
        startTime: "2026-10-21T15:00:00",
        endTime: "2026-10-21T16:00:00",
        status: "draft",
        reviewStatus: "rejected",
        reviewNote: "Cần bổ sung phạm vi nội dung và mục tiêu session.",
        createdAt: "2026-09-05T14:20:00",
        updatedAt: "2026-09-08T14:20:00",
        history: [
          {
            status: "rejected",
            at: "2026-09-08T14:20:00",
            note: "Cần bổ sung phạm vi nội dung và mục tiêu session.",
          },
        ],
      },
      /* Extra session owned by another speaker — used to verify merge save does not delete */
      {
        id: "SES999",
        eventId: "EVT001",
        title: "Session của diễn giả khác (test merge)",
        description: "Session thuộc user khác — không được xóa khi USR102 save.",
        category: "other",
        speakerIds: ["USR999"],
        roomId: "ROM099",
        startTime: "2026-10-22T10:00:00",
        endTime: "2026-10-22T11:00:00",
        status: "published",
        reviewStatus: "approved",
        createdAt: "2026-09-01T00:00:00",
        updatedAt: "2026-09-01T00:00:00",
      },
    ],
    agendas: [
      {
        id: "AGD001",
        userId: ATTENDEE_ID,
        eventId: "EVT001",
        sessionId: "SES003",
        status: "saved",
        addedAt: "2026-10-01T10:00:00",
      },
      {
        id: "AGD002",
        userId: ATTENDEE_ID,
        eventId: "EVT001",
        sessionId: "SES001",
        status: "saved",
        addedAt: "2026-10-01T10:05:00",
      },
    ],
    notifications: [],
    aiConflict: {
      userId: ATTENDEE_ID,
      conflictingSessionIds: ["SES003", "SES001"],
      suggestedSessionId: "SES004",
      reason:
        "Phiên thay thế có chủ đề tương tự và không trùng giờ với lịch hiện tại.",
      reasons: [
        "Chủ đề AI phù hợp với sở thích của bạn",
        "Không trùng giờ với các phiên đang lưu",
        "Còn chỗ và diễn ra trong cùng sự kiện",
      ],
      score: 0.89,
      status: "success",
    },
    speakerProfile: {
      id: "SPK001",
      name: "Phan Anh Vũ",
      jobTitle: "Speaker",
      company: "EventPulse",
      expertise: ["AI", "Product", "Web Development"],
      bio: "Diễn giả và người làm sản phẩm, tập trung vào trải nghiệm người dùng và công nghệ.",
      avatar: "",
      social: { linkedin: "", website: "", facebook: "", twitter: "" },
    },
    materials: [
      {
        id: "MAT001",
        sessionId: "SES102",
        speakerId: SPEAKER_ID,
        fileName: "modern-javascript-slides.pdf",
        size: 5242880,
        type: "application/pdf",
        uploadedAt: "2026-09-20T09:30:00.000Z",
      },
      {
        id: "MAT002",
        sessionId: "SES102",
        speakerId: SPEAKER_ID,
        fileName: "reading-list.txt",
        size: 18432,
        type: "text/plain",
        uploadedAt: "2026-09-21T14:15:00.000Z",
      },
    ],
  };

  /**
   * Seed LocalStorage only when key is missing.
   * Call once on every page (safe / idempotent).
   */
  EP.ensureSeed = function ensureSeed() {
    const K = EP.KEYS;
    if (!localStorage.getItem(K.currentUser)) {
      EP.setJSON(K.currentUser, EP.SEED.currentUser);
    }
    if (!localStorage.getItem(K.sessions)) {
      EP.setJSON(K.sessions, EP.SEED.sessions);
    }
    if (!localStorage.getItem(K.agendas)) {
      EP.setJSON(K.agendas, EP.SEED.agendas);
    }
    if (!localStorage.getItem(K.notifications)) {
      EP.setJSON(K.notifications, EP.SEED.notifications);
    }
    if (!localStorage.getItem(K.aiConflict)) {
      EP.setJSON(K.aiConflict, EP.SEED.aiConflict);
    }
    if (!localStorage.getItem(K.speakerProfile)) {
      EP.setJSON(K.speakerProfile, EP.SEED.speakerProfile);
    }
    if (!localStorage.getItem(K.materials)) {
      EP.setJSON(K.materials, EP.SEED.materials);
    }
    if (!localStorage.getItem(K.settings)) {
      EP.setJSON(K.settings, EP.DEFAULT_SETTINGS || {
        theme: "light", language: "vi", autosave: true, reminder: true,
        name: "Phan Anh Vũ", role: "speaker",
      });
    }
  };

  /**
   * Merge sessions owned by speakerId into the full store without deleting others.
   * @param {string} speakerId
   * @param {Array} speakerSessions — full list of this speaker's sessions (replacement set)
   */
  EP.mergeSpeakerSessions = function mergeSpeakerSessions(speakerId, speakerSessions) {
    const K = EP.KEYS;
    EP.ensureSeed();
    const all = EP.getJSON(K.sessions, []) || [];
    const others = all.filter(
      (s) => !(Array.isArray(s.speakerIds) && s.speakerIds.includes(speakerId))
    );
    const next = [...others, ...speakerSessions.map((s) => ({ ...s }))];
    EP.setJSON(K.sessions, next);
    return next;
  };

  /**
   * Update a single session by id in the full list (keeps everyone else's data).
   */
  EP.upsertSession = function upsertSession(session) {
    const K = EP.KEYS;
    EP.ensureSeed();
    const all = EP.getJSON(K.sessions, []) || [];
    const idx = all.findIndex((s) => s.id === session.id);
    if (idx >= 0) all[idx] = { ...all[idx], ...session };
    else all.push({ ...session });
    EP.setJSON(K.sessions, all);
    return all;
  };

  EP.getSessionsForSpeaker = function getSessionsForSpeaker(speakerId) {
    EP.ensureSeed();
    const all = EP.getJSON(EP.KEYS.sessions, []) || [];
    return all.filter(
      (s) => Array.isArray(s.speakerIds) && s.speakerIds.includes(speakerId)
    );
  };

  EP.getAllSessions = function getAllSessions() {
    EP.ensureSeed();
    return EP.getJSON(EP.KEYS.sessions, []) || [];
  };


  /* ── Unified settings object ── */
  EP.DEFAULT_SETTINGS = {
    theme: "light",
    language: "vi",
    autosave: true,
    reminder: true,
    name: "Phan Anh Vũ",
    role: "all",
  };

  EP.getSettings = function getSettings() {
    EP.ensureSeed();
    const stored = EP.getJSON(EP.KEYS.settings, null);
    if (stored && typeof stored === "object") {
      return { ...EP.DEFAULT_SETTINGS, ...stored };
    }
    // migrate legacy keys
    const theme = localStorage.getItem("eventpulse-theme") || "light";
    const language = localStorage.getItem("eventpulse-language") || "vi";
    const autosave = localStorage.getItem("eventpulse-autosave");
    const reminder = localStorage.getItem("eventpulse-reminder");
    const name = localStorage.getItem("eventpulse-name");
    const user = EP.getJSON(EP.KEYS.currentUser, {}) || {};
    const s = {
      ...EP.DEFAULT_SETTINGS,
      theme,
      language,
      autosave: autosave == null ? true : autosave === "true",
      reminder: reminder == null ? true : reminder === "true",
      name: name || user.fullName || EP.DEFAULT_SETTINGS.name,
      role: user.role || EP.DEFAULT_SETTINGS.role,
    };
    EP.setJSON(EP.KEYS.settings, s);
    return s;
  };

  EP.setSettings = function setSettings(patch) {
    const next = { ...EP.getSettings(), ...patch };
    try {
      EP.setJSON(EP.KEYS.settings, next);
      if (next.theme) {
        localStorage.setItem("eventpulse-theme", next.theme);
        document.body.classList.toggle("dark", next.theme === "dark");
      }
      if (next.language) localStorage.setItem("eventpulse-language", next.language);
      if (typeof next.autosave === "boolean")
        localStorage.setItem("eventpulse-autosave", String(next.autosave));
      if (typeof next.reminder === "boolean")
        localStorage.setItem("eventpulse-reminder", String(next.reminder));
      if (next.name) localStorage.setItem("eventpulse-name", next.name);
      // sync role onto currentUser for pages that read it
      const user = EP.getJSON(EP.KEYS.currentUser, {}) || {};
      if (next.role) {
        user.role = next.role;
        EP.setJSON(EP.KEYS.currentUser, user);
      }
      return next;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  EP.I18N = {
    vi: {
      "nav.attendee": "Attendee",
      "nav.speaker": "Speaker",
      "nav.common": "Chung",
      "nav.recommendations": "Gợi ý",
      "nav.agenda": "My Agenda",
      "nav.conflict": "Xung đột lịch",
      "nav.profile": "Hồ sơ",
      "nav.sessions": "Session của tôi",
      "nav.edit": "Sửa session",
      "nav.materials": "Tài liệu",
      "nav.forecast": "Dự báo",
      "nav.settings": "Cài đặt",
      "dash.title": "Dashboard",
      "dash.sub": "Website thống nhất gồm các module Attendee / Speaker / Settings. Chọn một chức năng bên dưới để bắt đầu.",
      "dash.attendee": "Attendee",
      "dash.speaker": "Speaker",
      "dash.common": "Chung",
      "rec.eyebrow": "AI-1 · AGENDA RECOMMENDER",
      "rec.title": "Session dành cho bạn",
      "rec.sub": "Khám phá các phiên phù hợp dựa trên sở thích và lịch sử của bạn.",
      "rec.refresh": "↻ Làm mới gợi ý",
      "rec.section": "Gợi ý từ AI",
      "rec.empty.title": "Chưa có gợi ý phù hợp",
      "rec.empty.sub": "Hãy thử làm mới để AI tìm session khác.",
      "rec.error.title": "Không thể tải gợi ý",
      "rec.retry": "Thử lại",
      "rec.add": "＋ Thêm vào agenda",
      "rec.why": "Vì sao gợi ý này?",
      "agenda.title": "Lịch của tôi",
      "agenda.sub": "Các session đã lưu. Xóa từng phiên hoặc xóa toàn bộ lịch khi cần.",
      "agenda.clear": "🗑 Xóa toàn bộ lịch",
      "agenda.delete": "🗑 Xóa lịch",
      "agenda.empty.title": "Agenda trống",
      "agenda.empty.sub": "Thêm session từ trang Gợi ý để bắt đầu.",
      "sessions.title": "Session của tôi",
      "sessions.sub": "Theo dõi các session đã đăng ký, đề xuất và trạng thái duyệt của bạn.",
      "sessions.create": "＋ Đề xuất session mới",
      "settings.title": "Cài đặt",
      "settings.sub": "Tùy chỉnh tài khoản và trải nghiệm sử dụng EventPulse.",
      "conflict.title": "Xử lý xung đột lịch",
      "conflict.sub": "AI phân tích trùng giờ và đề xuất phiên thay thế.",
      "profile.title": "Hồ sơ Diễn giả",
      "profile.sub": "Quản lý thông tin công khai để người tham dự và ban tổ chức nhận diện đúng diễn giả.",
      "profile.save": "Lưu thay đổi",
      "profile.preview": "Xem preview",
      "profile.changePhoto": "Đổi ảnh",
      "materials.title": "Tài liệu Session",
      "materials.sub": "Tải lên slide, handout hoặc thêm link tham khảo cho session.",
      "forecast.title": "Dự báo quan tâm",
      "forecast.sub": "Ước lượng mức độ quan tâm dựa trên lượt lưu và agenda.",
      "common.save": "Lưu",
      "common.cancel": "Huỷ",
      "common.retry": "Thử lại",
      "common.loading": "Đang tải...",
    },
    en: {
      "nav.attendee": "Attendee",
      "nav.speaker": "Speaker",
      "nav.common": "Common",
      "nav.recommendations": "Recommendations",
      "nav.agenda": "My Agenda",
      "nav.conflict": "Schedule conflict",
      "nav.profile": "Profile",
      "nav.sessions": "My sessions",
      "nav.edit": "Edit session",
      "nav.materials": "Materials",
      "nav.forecast": "Forecast",
      "nav.settings": "Settings",
      "dash.title": "Dashboard",
      "dash.sub": "Unified site with Attendee / Speaker / Settings modules. Pick a feature below to start.",
      "dash.attendee": "Attendee",
      "dash.speaker": "Speaker",
      "dash.common": "Common",
      "rec.eyebrow": "AI-1 · AGENDA RECOMMENDER",
      "rec.title": "Sessions for you",
      "rec.sub": "Discover sessions matched to your interests and history.",
      "rec.refresh": "↻ Refresh recommendations",
      "rec.section": "AI recommendations",
      "rec.empty.title": "No matching recommendations",
      "rec.empty.sub": "Try refresh so AI can find other sessions.",
      "rec.error.title": "Could not load recommendations",
      "rec.retry": "Retry",
      "rec.add": "＋ Add to agenda",
      "rec.why": "Why this recommendation?",
      "agenda.title": "My schedule",
      "agenda.sub": "Saved sessions. Remove one item or clear the whole agenda.",
      "agenda.clear": "🗑 Clear all",
      "agenda.delete": "🗑 Remove",
      "agenda.empty.title": "Agenda is empty",
      "agenda.empty.sub": "Add sessions from Recommendations to get started.",
      "sessions.title": "My sessions",
      "sessions.sub": "Track proposed sessions and review status.",
      "sessions.create": "＋ Propose a session",
      "settings.title": "Settings",
      "settings.sub": "Account preferences and EventPulse experience.",
      "conflict.title": "Schedule conflict",
      "conflict.sub": "AI analyzes overlaps and suggests alternative sessions.",
      "profile.title": "Speaker profile",
      "profile.sub": "Manage public information so attendees and organizers recognize you.",
      "profile.save": "Save changes",
      "profile.preview": "Preview",
      "profile.changePhoto": "Change photo",
      "materials.title": "Session materials",
      "materials.sub": "Upload slides, handouts or add reference links for the session.",
      "forecast.title": "Interest forecast",
      "forecast.sub": "Estimate interest from saves and agenda activity.",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.retry": "Retry",
      "common.loading": "Loading...",
    },
  };

  EP.t = function t(key) {
    const lang = (EP.getSettings().language || "vi");
    const dict = EP.I18N[lang] || EP.I18N.vi;
    return dict[key] || EP.I18N.vi[key] || key;
  };

  EP.applyI18nNav = function applyI18nNav() {
    const map = {
      "recommendations.html": "nav.recommendations",
      "my-agenda.html": "nav.agenda",
      "schedule-conflict.html": "nav.conflict",
      "profile.html": "nav.profile",
      "my-sessions.html": "nav.sessions",
      "speaker-session-detail.html": "nav.edit",
      "materials.html": "nav.materials",
      "interest-forecast.html": "nav.forecast",
      "settings.html": "nav.settings",
    };
    document.querySelectorAll(".ep-nav a[href], .ep-nav-drawer a[href]").forEach((a) => {
      const file = (a.getAttribute("href") || "").split("/").pop().split("?")[0];
      if (map[file]) a.textContent = EP.t(map[file]);
    });
    document.querySelectorAll(".ep-nav-label").forEach((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      if (text.includes("attendee")) el.textContent = EP.t("nav.attendee");
      else if (text.includes("speaker")) el.textContent = EP.t("nav.speaker");
      else if (text.includes("chung") || text.includes("common")) el.textContent = EP.t("nav.common");
    });
    // Full-page strings marked with data-i18n
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      const val = EP.t(key);
      if (val && val !== key) el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (!key) return;
      const val = EP.t(key);
      if (val && val !== key) el.setAttribute("placeholder", val);
    });
  };

  /** Hide Attendee or Speaker nav groups based on settings.role */
  EP.applyRoleNav = function applyRoleNav() {
    const role = (EP.getSettings().role || "all").toLowerCase();
    const hideAtt = role === "speaker";
    const hideSpk = role === "attendee";
    document.querySelectorAll(".ep-nav-group").forEach((group) => {
      const label = (group.querySelector(".ep-nav-label")?.textContent || "").toLowerCase();
      if (label.includes("attendee")) group.style.display = hideAtt ? "none" : "";
      else if (label.includes("speaker")) group.style.display = hideSpk ? "none" : "";
    });
    document.querySelectorAll(".ep-nav-drawer a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (href.includes("/attendee/")) a.style.display = hideAtt ? "none" : "";
      if (href.includes("/speaker/")) a.style.display = hideSpk ? "none" : "";
    });
    document.querySelectorAll(".ep-nav-drawer .ep-nav-label").forEach((el) => {
      const text = (el.textContent || "").toLowerCase();
      if (text.includes("attendee")) el.style.display = hideAtt ? "none" : "";
      if (text.includes("speaker")) el.style.display = hideSpk ? "none" : "";
    });
  };

  /* ── Nav ── */
  function highlightNav() {
    const path = location.pathname.replace(/\\/g, "/");
    const file = path.split("/").pop() || "index.html";
    document.querySelectorAll(".ep-nav a[href], .ep-nav-drawer a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const target = href.split("/").pop().split("?")[0];
      if (target && (file === target || (file === "" && target === "index.html"))) {
        a.classList.add("active");
      }
    });
  }

  function wireMobileNav() {
    const toggle = document.getElementById("epNavToggle");
    const drawer = document.getElementById("epNavDrawer");
    if (!toggle || !drawer) return;
    toggle.addEventListener("click", () => {
      drawer.classList.toggle("open");
    });
    drawer.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => drawer.classList.remove("open"));
    });
  }

  EP.applyTheme = function applyTheme() {
    let theme = "light";
    try {
      theme = EP.getSettings().theme || localStorage.getItem(EP.KEYS.theme) || "light";
    } catch {
      theme = localStorage.getItem(EP.KEYS.theme) || localStorage.getItem("eventpulse-theme") || "light";
    }
    document.body.classList.toggle("dark", theme === "dark");
    return theme;
  };

  document.addEventListener("DOMContentLoaded", () => {
    EP.ensureSeed();
    EP.applyTheme();
    highlightNav();
    wireMobileNav();
    try {
      EP.applyI18nNav();
      EP.applyRoleNav();
    } catch (e) {
      console.warn(e);
    }
  });

  global.EventPulse = EP;
})(typeof window !== "undefined" ? window : globalThis);
