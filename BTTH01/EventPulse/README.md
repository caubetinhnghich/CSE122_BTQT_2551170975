# EventPulse — Website thống nhất

Gộp các module BTL (HTML/CSS/JS thuần) thành một site chạy bằng một `index.html`.

## Cách chạy

1. Giải nén / mở thư mục `EventPulse` trong VS Code  
2. Cài extension **Live Server** → chuột phải `index.html` → **Open with Live Server**  
3. Hoặc mở trực tiếp `index.html` bằng trình duyệt  

> Nên dùng Live Server để LocalStorage và đường dẫn tương đối ổn định.

## Cấu trúc thư mục

```
EventPulse/
  index.html                 # Dashboard
  README.md
  css/
    shared.css               # Design tokens, navbar, dark mode, typography
    recommendations.css      # A5
    conflict.css             # A4
    my-agenda.css            # My Agenda
    settings.css             # S6
    interest-forecast.css    # SP5
    materials.css            # SP4
    my-sessions.css          # SP2
    profile.css              # SP1
    session-edit.css         # SP3
  js/
    shared.js                # Seed chung, merge sessions, theme, nav
    recommendations.js
    conflict-resolver.js
    my-agenda.js
    settings.js
    interest-forecast.js
    speaker-materials.js
    speaker-my-sessions.js
    speaker-profile.js
    speaker-session-edit.js
  pages/
    attendee/
      recommendations.html   # AI gợi ý session
      my-agenda.html         # Lịch đã lưu + phát hiện trùng giờ
      schedule-conflict.html # AI xử lý xung đột lịch
    speaker/
      profile.html
      my-sessions.html       # + Feedback overview (SP6 mock)
      speaker-session-detail.html      # ?id=  · khóa field theo trạng thái
      materials.html         # ?id=
      interest-forecast.html
    common/
      settings.html
  assets/
```

## Danh sách trang

| Nhóm | Trang | Chức năng |
|------|--------|-----------|
| Attendee | Gợi ý Session (A5) | Recommend theo interests; thêm agenda; điểm phù hợp |
| Attendee | My Agenda | Session đã lưu; trùng giờ; xóa; link Conflict |
| Attendee | Xung đột lịch (A4) | Overlap đúng; AI đề xuất; accept → My Agenda |
| Speaker | Hồ sơ (SP1) | CRUD hồ sơ, avatar (persist dataset.src) |
| Speaker | Session của tôi (SP2) | List/filter; tạo/sửa; **save không xóa session user khác** |
| Speaker | Chỉnh sửa Session (SP3) | Autosave; approved khóa phòng/giờ; rejected → Gửi lại |
| Speaker | Tài liệu (SP4) | Upload mock, xóa |
| Speaker | Dự báo (SP5) | Forecast từ sessions/agendas chung |
| Chung | Cài đặt (S6) | Theme sáng/tối toàn site, prefs, mật khẩu mock |

## LocalStorage keys

| Key | Dùng bởi |
|-----|----------|
| `eventpulse_sessions` | SP2, SP3, SP4, A4, A5, Forecast (seed + merge) |
| `eventpulse_agendas` | A5, A4, My Agenda |
| `eventpulse_notifications` | A4, A5 |
| `eventpulse_currentUser` | A4 / seed |
| `eventpulse_aiConflict` | A4 |
| `eventpulse_speaker_profile` | SP1 |
| `eventpulse_session_materials` | SP4 |
| `eventpulse-theme` | S6 + mọi trang (body.dark) |

## Bug đã sửa (review)

1. **SP2 save** — merge theo speakerId, không ghi đè user khác (có SES999 để test)  
2. **Seed chung** — `EventPulse.ensureSeed()` trong `shared.js`  
3. **A4 overlap** — `start < other.end && end > other.start`  
4. **SP1 avatar** — `fill()` set `dataset.src`  
5. **A5** — `showReason` lấy score từ list đã tính  
6. **SP3** — khóa schedule khi approved; CTA gửi lại khi rejected  
7. **Theme** — áp dụng mọi trang qua `applyTheme()`  
8. **A4 redirect** — về My Agenda  

## Ghi chú demo

- Attendee seed: `USR001` — agenda SES001 + SES003 (cùng 10:00–11:00) để A4 chạy được.  
- Speaker seed: `USR102` — SES101 (approved), SES102 (pending), SES103 (rejected).  
- Xóa LocalStorage rồi F5 để seed lại sạch.


## Inventory file names

| File | Ghi chú |
|------|---------|
| `speaker-session-detail.html` | SP3 (alias `session-edit.html` redirect) |
| Các trang khác giữ tên module ngắn trong `pages/` |

## Responsive

Breakpoints: 1024 / 900 / 768 / 480. Menu mobile drawer từ ≤900px.
