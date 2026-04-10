import { useEffect, useMemo, useState } from "react";
import "./ShiftSchedule.css";

const API = "http://localhost:5000";
const token = () => localStorage.getItem("token");
const myId  = () => {
  try { return JSON.parse(localStorage.getItem("user") || "{}").id; }
  catch { return null; }
};

// Convert any date value (ISO string or Date) → local "YYYY-MM-DD"
function localDate(val) {
  if (!val) return "";
  const d = new Date(val);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Local "YYYY-MM-DD" for today
function todayLocal() {
  return localDate(new Date());
}

// ── Calendar constants ────────────────────────────────────────────────────────
const HOUR_START  = 6;   // 06:00
const HOUR_END    = 22;  // 22:00
const HOUR_H      = 64;  // px per 1 hour row
const HEADER_H    = 64;  // px for day-header row
const TIME_COL_W  = 56;  // px for time column

const DAY_NAMES = ["T2\nMon", "T3\nTue", "T4\nWed", "T5\nThu", "T6\nFri", "T7\nSat", "CN\nSun"];

const SHIFT_PRESETS = [
  { label: "Ca sáng (8:00–12:00)",  start: "08:00", end: "12:00" },
  { label: "Ca chiều (13:00–17:00)", start: "13:00", end: "17:00" },
  { label: "Ca tối (17:00–21:00)",  start: "17:00", end: "21:00" },
  { label: "Cả ngày (8:00–17:00)",  start: "08:00", end: "17:00" },
];

const STATUS_COLORS = {
  approved: { bg: "#ee4d2d", border: "#d44225", text: "#fff" },
  pending:  { bg: "#f97316", border: "#ea6c10", text: "#fff" },
  rejected: { bg: "#ef4444", border: "#dc2626", text: "#fff" },
};

const STATUS_LABEL = { approved: "Đã duyệt", pending: "Chờ duyệt", rejected: "Từ chối" };

// ── Date helpers ──────────────────────────────────────────────────────────────
function getMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

function addDays(str, n) {
  const d = new Date(str);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function weekDates(monday) {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function fmtDateHeader(str) {
  const [, m, d] = str.split("-");
  return `${d}/${m}/${str.slice(0, 4)}`;
}

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function minutesToPx(minutes) {
  return ((minutes - HOUR_START * 60) / 60) * HOUR_H;
}

function durationPx(startMin, endMin) {
  return Math.max(((endMin - startMin) / 60) * HOUR_H, 28);
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ selected, onSelect }) {
  const [viewDate, setViewDate] = useState(new Date(selected));
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const offset   = firstDay === 0 ? 6 : firstDay - 1; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const fmt = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const MONTH_VI = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                    "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

  return (
    <div className="mini-cal">
      <div className="mini-cal-nav">
        <button onClick={prevMonth}>‹</button>
        <span>{MONTH_VI[month]} {year}</span>
        <button onClick={nextMonth}>›</button>
      </div>
      <div className="mini-cal-grid">
        {["T2","T3","T4","T5","T6","T7","CN"].map(d => (
          <div key={d} className="mini-cal-dow">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const dateStr = fmt(d);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selected;
          return (
            <button
              key={i}
              className={`mini-cal-day ${isToday ? "mini-today" : ""} ${isSelected ? "mini-selected" : ""}`}
              onClick={() => onSelect(dateStr)}
            >{d}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ShiftSchedule({ role = "STAFF" }) {
  const isManager = ["ADMIN", "MANAGER"].includes((role || "").toUpperCase());
  const todayStr  = todayLocal();

  const [monday,   setMonday]   = useState(getMonday(todayStr));
  const [shifts,   setShifts]   = useState([]);
  const [todayOns, setTodayOns] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState({ type: "", text: "" });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    shift_date: todayLocal(), start_time: "08:00", end_time: "12:00", note: "",
  });

  const dates = useMemo(() => weekDates(monday), [monday]);

  /* ── Fetch ── */
  async function fetchShifts() {
    setLoading(true);
    try {
      const url = isManager
        ? `${API}/api/shifts/all?week=${monday}`
        : `${API}/api/shifts/mine`;
      const res = await fetch(url, { headers: { Authorization: "Bearer " + token() } });
      setShifts(await res.json().then(d => Array.isArray(d) ? d : []));
    } catch { setShifts([]); }
    setLoading(false);
  }

  async function fetchToday() {
    try {
      const res = await fetch(`${API}/api/shifts/day?date=${todayStr}`, {
        headers: { Authorization: "Bearer " + token() },
      });
      setTodayOns(await res.json().then(d => Array.isArray(d) ? d : []));
    } catch { setTodayOns([]); }
  }

  useEffect(() => { fetchShifts(); fetchToday(); }, [monday, isManager]); // eslint-disable-line

  /* ── grouped by date ── */
  const byDate = useMemo(() => {
    const map = {};
    dates.forEach(d => { map[d] = []; });
    shifts.forEach(s => {
      const d = localDate(s.shift_date);
      if (d && map[d]) map[d].push(s);
    });
    return map;
  }, [shifts, dates]);

  /* ── Actions ── */
  async function submitShift(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/shifts/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg({ type: "success", text: "✅ Đăng ký ca thành công!" });
      setShowForm(false);
      fetchShifts();
    } catch (err) { setMsg({ type: "error", text: err.message || "Lỗi đăng ký" }); }
  }

  async function deleteShift(id) {
    if (!window.confirm("Hủy đăng ký ca này?")) return;
    try {
      const res = await fetch(`${API}/api/shifts/${id}`, {
        method: "DELETE", headers: { Authorization: "Bearer " + token() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg({ type: "success", text: "Đã hủy ca." });
      fetchShifts();
    } catch (err) { setMsg({ type: "error", text: err.message }); }
  }

  async function patchStatus(id, status) {
    try {
      const res = await fetch(`${API}/api/shifts/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMsg({ type: "success", text: `Đã ${status === "approved" ? "duyệt" : "từ chối"} ca.` });
      fetchShifts(); fetchToday();
    } catch (err) { setMsg({ type: "error", text: err.message }); }
  }

  const totalGridH = (HOUR_END - HOUR_START) * HOUR_H;
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  return (
    <div className="ss-page">

      {/* ── Left: Calendar Panel ── */}
      <div className="ss-sidebar">
        {/* Register button */}
        {!isManager && (
          <button className="ss-fab-btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? "× Đóng" : "+ Đăng Ký Ca"}
          </button>
        )}

        {/* Mini Calendar */}
        <MiniCalendar
          selected={form.shift_date}
          onSelect={(d) => {
            setForm(f => ({ ...f, shift_date: d }));
            setMonday(getMonday(d));
            if (!isManager) setShowForm(true);
          }}
        />

        {/* Who's working today */}
        <div className="ss-today-panel">
          <div className="ss-today-title">👥 Hôm nay – {todayStr.split("-").reverse().join("/")}</div>
          {todayOns.length === 0
            ? <p className="ss-empty-today">Chưa có ca hôm nay.</p>
            : todayOns.map(s => (
                <div key={s.id} className={`ss-today-item ss-today-${s.status}`}>
                  <div className="ss-today-name">{s.staff_name || s.staff_email}</div>
                  <div className="ss-today-time">
                    {(s.start_time || "").slice(0, 5)} – {(s.end_time || "").slice(0, 5)}
                  </div>
                  <span className="ss-today-badge">{STATUS_LABEL[s.status]}</span>
                </div>
              ))
          }
        </div>
      </div>

      {/* ── Right: Main Calendar ── */}
      <div className="ss-main">

        {/* Topbar */}
        <div className="ss-topbar">
          <div className="ss-topbar-left">
            <h2 className="ss-main-title">Lịch ca {isManager ? "nhân viên" : "cá nhân"}</h2>
            <div className="ss-week-nav">
              <button className="ss-nav-btn" onClick={() => setMonday(addDays(monday, -7))}>‹</button>
              <span className="ss-week-range">
                {fmtDateHeader(monday)} – {fmtDateHeader(dates[6])}
              </span>
              <button className="ss-nav-btn" onClick={() => setMonday(addDays(monday, +7))}>›</button>
              <button className="ss-today-btn" onClick={() => setMonday(getMonday(todayStr))}>Hôm nay</button>
            </div>
          </div>

          {msg.text && (
            <div className={`ss-alert ss-alert-${msg.type}`}>
              {msg.text}
              <button onClick={() => setMsg({ type: "", text: "" })}>×</button>
            </div>
          )}
        </div>

        {/* Register Form */}
        {showForm && !isManager && (
          <form className="ss-reg-form" onSubmit={submitShift}>
            <span className="ss-reg-title">📝 Đăng ký ca</span>
            <div className="ss-reg-fields">
              <label>Ngày <input type="date" value={form.shift_date} min={todayStr} required
                onChange={e => setForm(f => ({ ...f, shift_date: e.target.value }))} /></label>
              <label>Bắt đầu <input type="time" value={form.start_time} required
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} /></label>
              <label>Kết thúc <input type="time" value={form.end_time} required
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} /></label>
              <label>Ghi chú <input type="text" value={form.note} placeholder="Tuỳ chọn"
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></label>
            </div>
            <div className="ss-reg-presets">
              {SHIFT_PRESETS.map(p => (
                <button type="button" key={p.label} className="ss-preset-chip"
                  onClick={() => setForm(f => ({ ...f, start_time: p.start, end_time: p.end }))}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="ss-reg-actions">
              <button type="submit" className="ss-btn-submit">✓ Xác nhận</button>
              <button type="button" className="ss-btn-cancel" onClick={() => setShowForm(false)}>Hủy</button>
            </div>
          </form>
        )}

        {/* ── Time-Grid Calendar ── */}
        <div className="ss-cal-scroll">
          {loading && <div className="ss-loading"><div className="ss-spinner" /><p>Đang tải...</p></div>}

          <div className="ss-cal-wrap" style={{ minHeight: HEADER_H + totalGridH + 32 }}>

            {/* Corner cell + Day headers */}
            <div className="ss-cal-header-row" style={{ height: HEADER_H, paddingLeft: TIME_COL_W }}>
              {dates.map((d, i) => {
                const isToday = d === todayStr;
                return (
                  <div key={d} className={`ss-day-head ${isToday ? "ss-day-today" : ""}`}>
                    <span className="ss-dh-name">{DAY_NAMES[i].split("\n")[0]}</span>
                    <span className="ss-dh-sub">{DAY_NAMES[i].split("\n")[1]}</span>
                    <br />
                    <span className={`ss-dh-date ${isToday ? "ss-dh-today-badge" : ""}`}>
                      {fmtDateHeader(d)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid body */}
            <div className="ss-grid-body" style={{ height: totalGridH }}>

              {/* Time column */}
              <div className="ss-time-col" style={{ width: TIME_COL_W }}>
                {hours.map(h => (
                  <div key={h} className="ss-time-cell" style={{ height: HOUR_H }}>
                    <span className="ss-time-label">{String(h).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              <div className="ss-day-cols">
                {dates.map(d => {
                  const isToday = d === todayStr;
                  const dayShifts = byDate[d] || [];
                  return (
                    <div key={d} className={`ss-day-col ${isToday ? "ss-col-today" : ""}`}
                      style={{ height: totalGridH }}>

                      {/* Hour grid lines */}
                      {hours.map(h => (
                        <div key={h} className="ss-hour-line" style={{ top: (h - HOUR_START) * HOUR_H }} />
                      ))}

                      {/* Current time line */}
                      {isToday && (() => {
                        const now = new Date();
                        const nowMin = now.getHours() * 60 + now.getMinutes();
                        const top = minutesToPx(nowMin);
                        if (top < 0 || top > totalGridH) return null;
                        return (
                          <div className="ss-now-line" style={{ top }}>
                            <div className="ss-now-dot" />
                          </div>
                        );
                      })()}

                      {/* Shift blocks */}
                      {dayShifts.map(s => {
                        const startMin = timeToMinutes(s.start_time);
                        const endMin   = timeToMinutes(s.end_time);
                        const top  = minutesToPx(startMin);
                        const h    = durationPx(startMin, endMin);
                        const col  = STATUS_COLORS[s.status] || STATUS_COLORS.pending;
                        const isOwn = String(s.staff_id) === String(myId());

                        return (
                          <div key={s.id} className="ss-shift-block"
                            style={{ top, height: h, background: col.bg, borderColor: col.border, color: col.text }}>
                            {isManager && (
                              <div className="ss-block-staff">{s.staff_name || s.staff_email}</div>
                            )}
                            <div className="ss-block-time">
                              {(s.start_time || "").slice(0, 5)} – {(s.end_time || "").slice(0, 5)}
                            </div>
                            {s.note && <div className="ss-block-note">{s.note}</div>}
                            <div className="ss-block-status">{STATUS_LABEL[s.status]}</div>

                            {/* Manager approve/reject */}
                            {isManager && s.status === "pending" && (
                              <div className="ss-block-actions">
                                <button onClick={() => patchStatus(s.id, "approved")}>✓</button>
                                <button onClick={() => patchStatus(s.id, "rejected")}>✕</button>
                              </div>
                            )}
                            {/* Staff cancel */}
                            {!isManager && isOwn && s.status === "pending" && (
                              <button className="ss-block-cancel" onClick={() => deleteShift(s.id)}>×</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Manager pending table */}
        {isManager && shifts.filter(s => s.status === "pending").length > 0 && (
          <div className="ss-pending-section">
            <h4 className="ss-pending-title">⏳ Ca chờ duyệt</h4>
            <table className="ss-table">
              <thead>
                <tr><th>Nhân viên</th><th>Ngày</th><th>Giờ</th><th>Ghi chú</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {shifts.filter(s => s.status === "pending").map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.staff_name}</strong><br /><small>{s.staff_email}</small></td>
                    <td>{(s.shift_date || "").slice(0, 10)}</td>
                    <td>{(s.start_time || "").slice(0, 5)} – {(s.end_time || "").slice(0, 5)}</td>
                    <td>{s.note || "—"}</td>
                    <td>
                      <div className="ss-tbl-actions">
                        <button className="ss-act-approve" onClick={() => patchStatus(s.id, "approved")}>✓ Duyệt</button>
                        <button className="ss-act-reject"  onClick={() => patchStatus(s.id, "rejected")}>✕ Từ chối</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
