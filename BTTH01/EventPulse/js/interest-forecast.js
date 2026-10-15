(() => {
  "use strict";
  const EP = window.EventPulse || {};
  if (typeof EP.ensureSeed === "function") EP.ensureSeed();

  const USER_ID = "USR102";
  const $ = (s) => document.querySelector(s);

  function buildFromShared() {
    const sessions =
      typeof EP.getSessionsForSpeaker === "function"
        ? EP.getSessionsForSpeaker(USER_ID)
        : [];
    const agendas = EP.getJSON
      ? EP.getJSON("eventpulse_agendas", []) || []
      : JSON.parse(localStorage.getItem("eventpulse_agendas") || "[]");

    if (!sessions.length) return null;

    return sessions.map((s) => {
      const agendaHits = agendas.filter(
        (a) => a.sessionId === s.id && a.status === "saved"
      ).length;
      const base = 40 + ((s.id.charCodeAt(3) || 10) % 40) + agendaHits * 8;
      const points = [0, 1, 2, 3, 4, 5].map((i) =>
        Math.max(8, Math.round(base * (0.55 + i * 0.09) + agendaHits * 2))
      );
      const saves = points[points.length - 1];
      const forecast = Math.round(saves * 1.2 + agendaHits * 3);
      const confidence = Math.min(95, 70 + agendaHits * 4 + (saves > 80 ? 8 : 0));
      return {
        id: s.id,
        title: s.title,
        saves,
        forecast,
        confidence,
        points,
        reasons: [
          [
            "Lượt quan tâm ước tính",
            saves + " tín hiệu lưu / theo dõi (mock từ seed + agenda).",
          ],
          [
            "Agenda",
            agendaHits
              ? agendaHits + " người đã thêm session vào agenda."
              : "Chưa có agenda gắn session này — dự báo thận trọng hơn.",
          ],
          [
            "Trạng thái session",
            "reviewStatus: " + (s.reviewStatus || s.status || "—") + ".",
          ],
        ],
        noteKey: "eventpulse_forecast_note_" + s.id,
      };
    });
  }

  const FALLBACK = [
    {
      id: "SES101",
      title: "Building AI-Powered Applications",
      saves: 128,
      forecast: 156,
      confidence: 91,
      points: [70, 82, 91, 104, 119, 128],
      reasons: [
        ["Lượt lưu tăng đều", "128 lượt lưu, xu hướng tăng liên tục."],
        ["Agenda có tín hiệu tốt", "92 người đã thêm session vào agenda."],
        ["Dữ liệu đủ mạnh", "Mẫu quan sát lớn hơn giúp dự báo ổn định."],
      ],
      noteKey: "eventpulse_forecast_note_SES101",
    },
    {
      id: "SES102",
      title: "Modern JavaScript Best Practices",
      saves: 76,
      forecast: 94,
      confidence: 82,
      points: [39, 47, 55, 59, 68, 76],
      reasons: [
        ["Lượt lưu ổn định", "76 lượt lưu và đang tăng."],
        ["Agenda chuyển đổi tốt", "51 lượt thêm agenda từ nhóm quan tâm."],
        ["Cần theo dõi", "Quy mô mẫu vừa phải nên AI giữ mức tin cậy thận trọng."],
      ],
      noteKey: "eventpulse_forecast_note_SES102",
    },
    {
      id: "SES103",
      title: "Design Systems in Practice",
      saves: 43,
      forecast: 55,
      confidence: 73,
      points: [21, 25, 29, 33, 38, 43],
      reasons: [
        ["Tệp quan tâm chuyên biệt", "43 lượt lưu cho thấy nhu cầu tập trung."],
        ["Agenda đang tăng", "28 người đã thêm session vào agenda."],
        ["Cần thêm dữ liệu", "Quy mô mẫu còn nhỏ nên dự báo dao động hơn."],
      ],
      noteKey: "eventpulse_forecast_note_SES103",
    },
  ];

  let DATA = buildFromShared() || FALLBACK;
  let cur = DATA[0];

  function state(id) {
    ["loading", "error", "empty", "app"].forEach((x) => {
      const el = $("#" + x);
      if (el) el.hidden = true;
    });
    const el = $("#" + id);
    if (el) el.hidden = false;
  }

  function level(n) {
    return n >= 100
      ? ["Cao", "Nhu cầu dự kiến nổi bật"]
      : n >= 60
        ? ["Trung bình", "Có tín hiệu quan tâm ổn định"]
        : ["Đang tăng", "Tiếp tục theo dõi"];
  }

  function renderSelect() {
    $("#session").innerHTML = DATA.map(
      (x) => '<option value="' + x.id + '">' + x.title + "</option>"
    ).join("");
    $("#session").value = cur.id;
  }

  function render() {
    const [l, h] = level(cur.saves);
    $("#saves").textContent = cur.saves;
    $("#forecast").textContent = cur.forecast;
    $("#level").textContent = l;
    $("#hint").textContent = h;
    $("#confidence").textContent = cur.confidence + "%";
    $("#updated").textContent = new Date().toLocaleString("vi-VN");
    const max = Math.max(...cur.points);
    $("#chart").innerHTML = cur.points
      .map(
        (v, i) =>
          '<div class="barwrap"><div class="bar" style="height:' +
          Math.max(7, (v / max) * 82) +
          '%"><b>' +
          v +
          '</b></div><span class="date">' +
          (24 + i) +
          "/09</span></div>"
      )
      .join("");
    $("#reasons").innerHTML = cur.reasons
      .map(
        (r) =>
          '<div class="reason"><b>' + r[0] + "</b><span>" + r[1] + "</span></div>"
      )
      .join("");
    $("#rows").innerHTML = cur.points
      .map(
        (v, i) =>
          "<tr><td>" +
          (24 + i) +
          "/09</td><td>" +
          v +
          "</td><td>" +
          Math.round(v * 0.72) +
          "</td><td>" +
          Math.round((v * cur.forecast) / cur.saves) +
          "</td></tr>"
      )
      .join("");
  }

  function run() {
    state("loading");
    setTimeout(() => {
      try {
        DATA = buildFromShared() || FALLBACK;
        if (!DATA.length) return state("empty");
        cur = DATA.find((x) => x.id === (cur && cur.id)) || DATA[0];
        renderSelect();
        render();
        state("app");
      } catch (e) {
        console.error(e);
        state("error");
      }
    }, 600);
  }

  $("#session").onchange = (e) => {
    cur = DATA.find((x) => x.id === e.target.value) || DATA[0];
    render();
  };
  $("#refresh").onclick = () => {
    run();
    setTimeout(() => {
      const n = $("#notice");
      if (!n) return;
      n.hidden = false;
      n.textContent = "✓ Đã làm mới dự báo từ sessions/agendas chung.";
      setTimeout(() => (n.hidden = true), 2200);
    }, 650);
  };
  $("#retry").onclick = run;
  $("#explain").onclick = () => {
    cur.reasons = cur.reasons.slice().reverse();
    render();
    const n = $("#notice");
    if (n) {
      n.hidden = false;
      n.textContent = "✓ Đã làm mới phần giải thích.";
      setTimeout(() => (n.hidden = true), 2200);
    }
  };

  function decisionKey() {
    return "eventpulse_forecast_decision_" + (cur && cur.id);
  }
  function noteKey() {
    return (cur && cur.noteKey) || ("eventpulse_forecast_note_" + (cur && cur.id));
  }
  function showDecision() {
    const el = $("#forecastDecision");
    if (!el || !cur) return;
    const d = localStorage.getItem(decisionKey());
    el.textContent = d === "accepted"
      ? "✓ Bạn đã chấp nhận dự báo này."
      : d === "dismissed"
        ? "Bạn đã bỏ qua dự báo này."
        : "";
  }
  function wireNote() {
    const note = $("#forecastNote");
    if (note) {
      note.value = localStorage.getItem(noteKey()) || "";
      note.onchange = () => {
        localStorage.setItem(noteKey(), note.value);
        const n = $("#notice");
        if (n) {
          n.hidden = false;
          n.textContent = "✓ Đã lưu ghi chú.";
          setTimeout(() => (n.hidden = true), 1800);
        }
      };
    }
    const acc = $("#acceptForecast");
    const dis = $("#dismissForecast");
    if (acc) {
      acc.onclick = () => {
        localStorage.setItem(decisionKey(), "accepted");
        showDecision();
        const n = $("#notice");
        if (n) {
          n.hidden = false;
          n.textContent = "✓ Đã chấp nhận dự báo.";
          setTimeout(() => (n.hidden = true), 2000);
        }
      };
    }
    if (dis) {
      dis.onclick = () => {
        localStorage.setItem(decisionKey(), "dismissed");
        showDecision();
        const n = $("#notice");
        if (n) {
          n.hidden = false;
          n.textContent = "Đã bỏ qua dự báo.";
          setTimeout(() => (n.hidden = true), 2000);
        }
      };
    }
    showDecision();
  }

  const _render = render;
  render = function () {
    _render();
    wireNote();
  };

  renderSelect();
  run();
})();
