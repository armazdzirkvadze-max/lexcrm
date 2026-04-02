import { useState, useEffect, useCallback } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Icons ───
const Icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  clients: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  cases: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  tasks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  billing: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  chevron: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  scale: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M2 8l10-5 10 5"/><path d="M2 8v4c0 2 2 4 4.5 4S11 14 11 12V8"/><path d="M13 8v4c0 2 2 4 4.5 4S22 14 22 12V8"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

// ─── CSS ───
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@600;700&display=swap');

:root {
  --bg: #0F1117;
  --bg-card: #181A23;
  --bg-card-hover: #1E2130;
  --bg-elevated: #222536;
  --border: #2A2D3E;
  --border-light: #353849;
  --text: #E8E9ED;
  --text-secondary: #9498AB;
  --text-muted: #6B6F82;
  --accent: #7C6AE8;
  --accent-soft: rgba(124, 106, 232, 0.12);
  --accent-hover: #9484F0;
  --green: #3ECF8E;
  --green-soft: rgba(62, 207, 142, 0.12);
  --amber: #F0B954;
  --amber-soft: rgba(240, 185, 84, 0.12);
  --red: #EF6461;
  --red-soft: rgba(239, 100, 97, 0.12);
  --blue: #5BA4F5;
  --blue-soft: rgba(91, 164, 245, 0.12);
  --font: 'DM Sans', sans-serif;
  --font-display: 'Playfair Display', serif;
  --radius: 10px;
  --radius-sm: 6px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body, #root { font-family: var(--font); background: var(--bg); color: var(--text); min-height: 100vh; }

/* ─── Auth Page ─── */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 20px;
}
.auth-container {
  width: 100%;
  max-width: 420px;
}
.auth-brand {
  text-align: center;
  margin-bottom: 32px;
}
.auth-brand h1 {
  font-family: var(--font-display);
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.auth-brand h1 svg { width: 36px; height: 36px; color: var(--accent); }
.auth-brand p { color: var(--text-muted); font-size: 13px; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; }
.auth-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 32px;
}
.auth-card h2 { font-size: 20px; font-weight: 600; margin-bottom: 24px; text-align: center; }
.auth-error {
  background: var(--red-soft);
  color: var(--red);
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  margin-bottom: 16px;
}
.auth-switch {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}
.auth-switch button {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  font-family: var(--font);
  font-size: 13px;
  font-weight: 600;
}
.auth-switch button:hover { color: var(--accent-hover); }

/* ─── App Layout ─── */
.app { display: flex; min-height: 100vh; }
.sidebar {
  width: 240px; min-width: 240px;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
}
.sidebar-brand { padding: 28px 24px 24px; border-bottom: 1px solid var(--border); }
.sidebar-brand h1 {
  font-family: var(--font-display); font-size: 20px; font-weight: 700;
  display: flex; align-items: center; gap: 10px;
}
.sidebar-brand h1 .brand-icon { width: 28px; height: 28px; color: var(--accent); }
.sidebar-brand p { font-size: 11.5px; color: var(--text-muted); margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase; }
.sidebar-nav { padding: 16px 12px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
.nav-item {
  display: flex; align-items: center; gap: 12px; padding: 11px 14px;
  border-radius: var(--radius-sm); cursor: pointer; font-size: 14px;
  color: var(--text-secondary); transition: all 0.15s;
  border: none; background: none; width: 100%; text-align: left;
}
.nav-item:hover { background: var(--bg-card-hover); color: var(--text); }
.nav-item.active { background: var(--accent-soft); color: var(--accent-hover); font-weight: 500; }
.nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
.nav-badge { margin-left: auto; background: var(--accent-soft); color: var(--accent); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.sidebar-footer { padding: 16px 12px; border-top: 1px solid var(--border); }
.sidebar-footer .user-email { font-size: 11px; color: var(--text-muted); padding: 0 14px; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; }

.main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; min-width: 0; }
.topbar {
  padding: 20px 32px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  background: var(--bg); position: sticky; top: 0; z-index: 10;
}
.topbar h2 { font-family: var(--font-display); font-size: 22px; font-weight: 600; }
.search-box {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 8px 14px; width: 260px;
}
.search-box svg { width: 16px; height: 16px; color: var(--text-muted); }
.search-box input { background: none; border: none; outline: none; color: var(--text); font-family: var(--font); font-size: 13px; width: 100%; }
.search-box input::placeholder { color: var(--text-muted); }
.content { padding: 28px 32px; flex: 1; }

/* ─── Cards & Stats ─── */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
.stat-card .label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.stat-card .value { font-size: 28px; font-weight: 700; font-family: var(--font-display); }
.stat-card .sub { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.card-header { padding: 18px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.card-header h3 { font-size: 15px; font-weight: 600; }
.card-body { padding: 0; }

/* ─── Table ─── */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
thead th { padding: 12px 16px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid var(--border); background: var(--bg-elevated); }
tbody td { padding: 14px 16px; font-size: 13.5px; border-bottom: 1px solid var(--border); vertical-align: middle; }
tbody tr:hover { background: var(--bg-card-hover); }
tbody tr:last-child td { border-bottom: none; }

/* ─── Badges & Buttons ─── */
.badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 600; }
.badge-green { background: var(--green-soft); color: var(--green); }
.badge-amber { background: var(--amber-soft); color: var(--amber); }
.badge-red { background: var(--red-soft); color: var(--red); }
.badge-blue { background: var(--blue-soft); color: var(--blue); }
.badge-purple { background: var(--accent-soft); color: var(--accent); }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border-radius: var(--radius-sm); font-family: var(--font); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text); transition: all 0.15s; }
.btn:hover { background: var(--border); }
.btn svg { width: 15px; height: 15px; }
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
.btn-sm { padding: 5px 10px; font-size: 12px; }
.btn-sm svg { width: 13px; height: 13px; }
.btn-icon { padding: 6px; border: none; background: none; cursor: pointer; color: var(--text-muted); border-radius: var(--radius-sm); display: flex; align-items: center; }
.btn-icon:hover { color: var(--text); background: var(--bg-elevated); }
.btn-icon svg { width: 16px; height: 16px; }
.btn-danger { color: var(--red); }
.btn-danger:hover { background: var(--red-soft); color: var(--red); }
.btn-full { width: 100%; justify-content: center; padding: 12px; font-size: 14px; }
.actions-cell { display: flex; gap: 4px; }

/* ─── Modal ─── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
.modal { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; width: 100%; max-width: 520px; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
.modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.modal-header h3 { font-size: 16px; font-weight: 600; }
.modal-body { padding: 24px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; }

/* ─── Form ─── */
.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-family: var(--font); font-size: 13.5px; outline: none; transition: border-color 0.15s; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--accent); }
.form-group textarea { resize: vertical; min-height: 70px; }
.form-group select { cursor: pointer; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* ─── Dashboard ─── */
.dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.upcoming-item { display: flex; align-items: flex-start; gap: 14px; padding: 14px 20px; border-bottom: 1px solid var(--border); }
.upcoming-item:last-child { border-bottom: none; }
.upcoming-date { background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 6px 10px; text-align: center; min-width: 50px; }
.upcoming-date .day { font-size: 18px; font-weight: 700; line-height: 1.2; }
.upcoming-date .month { font-size: 10px; color: var(--text-muted); text-transform: uppercase; }
.upcoming-info h4 { font-size: 13.5px; font-weight: 500; }
.upcoming-info p { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.task-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid var(--border); }
.task-item:last-child { border-bottom: none; }
.task-checkbox { width: 18px; height: 18px; border-radius: 4px; border: 2px solid var(--border-light); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s; }
.task-checkbox.done { background: var(--green); border-color: var(--green); }
.task-checkbox.done::after { content: '✓'; color: #fff; font-size: 11px; font-weight: 700; }
.task-info { flex: 1; min-width: 0; }
.task-info h4 { font-size: 13px; font-weight: 500; }
.task-info p { font-size: 11.5px; color: var(--text-secondary); margin-top: 2px; }

/* ─── Calendar ─── */
.cal-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.cal-header h3 { font-family: var(--font-display); font-size: 18px; font-weight: 600; min-width: 180px; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.cal-day-header { background: var(--bg-elevated); padding: 10px; text-align: center; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
.cal-cell { background: var(--bg-card); min-height: 100px; padding: 8px; }
.cal-cell.other-month { background: var(--bg); }
.cal-cell.today { background: var(--accent-soft); }
.cal-cell .day-num { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
.cal-cell.today .day-num { color: var(--accent); }
.cal-event { font-size: 10.5px; padding: 3px 6px; border-radius: 4px; margin-bottom: 3px; cursor: default; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
.cal-event.Court { background: var(--red-soft); color: var(--red); }
.cal-event.Meeting { background: var(--blue-soft); color: var(--blue); }
.cal-event.Deadline { background: var(--amber-soft); color: var(--amber); }
.cal-event.Deposition { background: var(--accent-soft); color: var(--accent); }
.empty-state { padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px; }
.priority-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
.priority-dot.High { background: var(--red); }
.priority-dot.Medium { background: var(--amber); }
.priority-dot.Low { background: var(--green); }

.loading-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
.spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .sidebar { width: 64px; min-width: 64px; }
  .sidebar-brand h1 span, .sidebar-brand p, .nav-item span, .nav-badge, .sidebar-footer .user-email { display: none; }
  .sidebar-brand { padding: 20px 12px; }
  .sidebar-brand h1 { justify-content: center; }
  .nav-item { justify-content: center; padding: 12px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .dash-grid { grid-template-columns: 1fr; }
  .topbar { padding: 16px 20px; }
  .content { padding: 20px; }
  .search-box { width: 180px; }
}
`;

// ─── Firestore Helpers ───
function useFirestoreCollection(collectionName, userId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, collectionName), where("userId", "==", userId));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(data);
      setLoading(false);
    });
    return () => unsub();
  }, [collectionName, userId]);

  const addItem = async (item) => {
    const id = uid();
    await setDoc(doc(db, collectionName, id), { ...item, id, userId });
  };

  const updateItem = async (item) => {
    await setDoc(doc(db, collectionName, item.id), { ...item, userId });
  };

  const removeItem = async (id) => {
    await deleteDoc(doc(db, collectionName, id));
  };

  return { items, loading, addItem, updateItem, removeItem };
}

// ─── Auth Page ───
function AuthPage({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const messages = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/invalid-credential": "Invalid email or password.",
      };
      setError(messages[err.code] || err.message);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <h1>{Icons.scale} LexCRM</h1>
          <p>Legal Practice Manager</p>
        </div>
        <div className="auth-card">
          <h2>{isLogin ? "Sign In" : "Create Account"}</h2>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} placeholder="you@lawfirm.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder="At least 6 characters" />
          </div>
          <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
          <div className="auth-switch">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(""); }}>
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal ───
function Modal({ title, onClose, children, onSave }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}>{Icons.x}</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───
function Dashboard({ clients, cases, tasks, billing, events, setPage }) {
  const activeCases = cases.filter((c) => c.status !== "Closed");
  const openTasks = tasks.filter((t) => t.status !== "Done");
  const urgentTasks = openTasks.filter((t) => t.priority === "High");
  const totalBilled = billing.reduce((s, b) => s + (b.hours || 0) * (b.rate || 0), 0);
  const unpaid = billing.filter((b) => b.status !== "Paid").reduce((s, b) => s + (b.hours || 0) * (b.rate || 0), 0);
  const upcomingEvents = [...events].filter((e) => e.date >= new Date().toISOString().split("T")[0]).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 5);
  const sortedTasks = [...openTasks].sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a.priority] || 2) - ({ High: 0, Medium: 1, Low: 2 }[b.priority] || 2)).slice(0, 5);
  const fmt = (n) => "$" + n.toLocaleString("en-US");

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card"><div className="label">Active Cases</div><div className="value">{activeCases.length}</div><div className="sub">{cases.filter((c) => c.status === "Closed").length} closed</div></div>
        <div className="stat-card"><div className="label">Open Tasks</div><div className="value">{openTasks.length}</div><div className="sub" style={{ color: urgentTasks.length > 0 ? "var(--red)" : undefined }}>{urgentTasks.length} urgent</div></div>
        <div className="stat-card"><div className="label">Total Billed</div><div className="value">{fmt(totalBilled)}</div><div className="sub">{fmt(unpaid)} outstanding</div></div>
        <div className="stat-card"><div className="label">Clients</div><div className="value">{clients.length}</div><div className="sub">{events.length} events</div></div>
      </div>
      <div className="dash-grid">
        <div className="card">
          <div className="card-header"><h3>Upcoming Events</h3><button className="btn btn-sm" onClick={() => setPage("calendar")}>{Icons.chevron}</button></div>
          <div className="card-body">
            {upcomingEvents.length === 0 && <div className="empty-state">No upcoming events</div>}
            {upcomingEvents.map((ev) => { const d = new Date(ev.date + "T00:00:00"); return (
              <div className="upcoming-item" key={ev.id}><div className="upcoming-date"><div className="day">{d.getDate()}</div><div className="month">{d.toLocaleString("en-US", { month: "short" })}</div></div><div className="upcoming-info"><h4>{ev.title}</h4><p>{ev.time} · {ev.type}{ev.location ? ` · ${ev.location}` : ""}</p></div></div>
            ); })}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Priority Tasks</h3><button className="btn btn-sm" onClick={() => setPage("tasks")}>{Icons.chevron}</button></div>
          <div className="card-body">
            {sortedTasks.map((t) => { const cs = cases.find((c) => c.id === t.caseId); return (
              <div className="task-item" key={t.id}><span className={`priority-dot ${t.priority}`} /><div className="task-info"><h4>{t.title}</h4><p>{cs?.caseNumber} · Due {t.dueDate}</p></div><span className={`badge ${t.status === "In Progress" ? "badge-blue" : "badge-amber"}`}>{t.status}</span></div>
            ); })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Clients Page ───
function ClientsPage({ clients, addClient, updateClient, removeClient }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const openNew = () => { setForm({ name: "", email: "", phone: "", company: "", notes: "" }); setModal("new"); };
  const openEdit = (c) => { setForm({ ...c }); setModal("edit"); };
  const save = async () => {
    if (!form.name) return;
    if (modal === "new") await addClient({ ...form, createdAt: new Date().toISOString().split("T")[0] });
    else await updateClient(form);
    setModal(null);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}><button className="btn btn-primary" onClick={openNew}>{Icons.plus}<span>Add Client</span></button></div>
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Since</th><th></th></tr></thead>
        <tbody>{clients.map((c) => (
          <tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.name}</td><td>{c.company}</td>
            <td style={{ color: "var(--text-secondary)" }}>{c.email}</td><td style={{ color: "var(--text-secondary)" }}>{c.phone}</td>
            <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{c.createdAt}</td>
            <td><div className="actions-cell"><button className="btn-icon" onClick={() => openEdit(c)}>{Icons.edit}</button><button className="btn-icon btn-danger" onClick={() => removeClient(c.id)}>{Icons.trash}</button></div></td>
          </tr>
        ))}</tbody>
      </table></div></div>
      {modal && <Modal title={modal === "new" ? "New Client" : "Edit Client"} onClose={() => setModal(null)} onSave={save}>
        <div className="form-group"><label>Name</label><input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="form-row"><div className="form-group"><label>Email</label><input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div className="form-group"><label>Phone</label><input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div></div>
        <div className="form-group"><label>Company</label><input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
        <div className="form-group"><label>Notes</label><textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </Modal>}
    </div>
  );
}

// ─── Cases Page ───
function CasesPage({ cases, clients, addCase, updateCase, removeCase }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const openNew = () => { setForm({ clientId: clients[0]?.id || "", title: "", caseNumber: "", type: "Civil Litigation", status: "Active", priority: "Medium", description: "", openDate: new Date().toISOString().split("T")[0], dueDate: "" }); setModal("new"); };
  const openEdit = (c) => { setForm({ ...c }); setModal("edit"); };
  const save = async () => { if (!form.title) return; if (modal === "new") await addCase(form); else await updateCase(form); setModal(null); };
  const statusBadge = (s) => <span className={`badge ${({ Active: "badge-green", Pending: "badge-amber", Closed: "badge-blue" })[s] || "badge-purple"}`}>{s}</span>;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}><button className="btn btn-primary" onClick={openNew}>{Icons.plus}<span>New Case</span></button></div>
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>Case</th><th>Client</th><th>Type</th><th>Status</th><th>Priority</th><th>Due</th><th></th></tr></thead>
        <tbody>{cases.map((c) => { const cl = clients.find((x) => x.id === c.clientId); return (
          <tr key={c.id}>
            <td><div style={{ fontWeight: 600 }}>{c.title}</div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.caseNumber}</div></td>
            <td>{cl?.name || "—"}</td><td>{c.type}</td><td>{statusBadge(c.status)}</td>
            <td><span className={`priority-dot ${c.priority}`} />{c.priority}</td>
            <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{c.dueDate || "—"}</td>
            <td><div className="actions-cell"><button className="btn-icon" onClick={() => openEdit(c)}>{Icons.edit}</button><button className="btn-icon btn-danger" onClick={() => removeCase(c.id)}>{Icons.trash}</button></div></td>
          </tr>); })}</tbody>
      </table></div></div>
      {modal && <Modal title={modal === "new" ? "New Case" : "Edit Case"} onClose={() => setModal(null)} onSave={save}>
        <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="form-row"><div className="form-group"><label>Case Number</label><input value={form.caseNumber} onChange={(e) => setForm({ ...form, caseNumber: e.target.value })} /></div><div className="form-group"><label>Client</label><select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
        <div className="form-row"><div className="form-group"><label>Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["Civil Litigation","Corporate","Immigration","Estate","Criminal","Family","Real Estate","IP","Tax","Other"].map((t) => <option key={t}>{t}</option>)}</select></div><div className="form-group"><label>Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{["High","Medium","Low"].map((p) => <option key={p}>{p}</option>)}</select></div></div>
        <div className="form-row"><div className="form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Active","Pending","Closed"].map((s) => <option key={s}>{s}</option>)}</select></div><div className="form-group"><label>Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div></div>
        <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      </Modal>}
    </div>
  );
}

// ─── Tasks Page ───
function TasksPage({ tasks, cases, addTask, updateTask, removeTask }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filter, setFilter] = useState("All");
  const openNew = () => { setForm({ caseId: cases[0]?.id || "", title: "", status: "Todo", priority: "Medium", dueDate: "", notes: "" }); setModal("new"); };
  const openEdit = (t) => { setForm({ ...t }); setModal("edit"); };
  const save = async () => { if (!form.title) return; if (modal === "new") await addTask(form); else await updateTask(form); setModal(null); };
  const toggleDone = async (t) => { await updateTask({ ...t, status: t.status === "Done" ? "Todo" : "Done" }); };
  const filtered = tasks.filter((t) => filter === "All" || t.status === filter);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>{["All","Todo","In Progress","Done"].map((f) => <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}</div>
        <button className="btn btn-primary" onClick={openNew}>{Icons.plus}<span>Add Task</span></button>
      </div>
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th style={{ width: 36 }}></th><th>Task</th><th>Case</th><th>Priority</th><th>Status</th><th>Due</th><th></th></tr></thead>
        <tbody>{filtered.map((t) => { const cs = cases.find((c) => c.id === t.caseId); return (
          <tr key={t.id}>
            <td><div className={`task-checkbox ${t.status === "Done" ? "done" : ""}`} onClick={() => toggleDone(t)} /></td>
            <td><span style={t.status === "Done" ? { textDecoration: "line-through", color: "var(--text-muted)" } : { fontWeight: 500 }}>{t.title}</span></td>
            <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{cs?.caseNumber || "—"}</td>
            <td><span className={`priority-dot ${t.priority}`} />{t.priority}</td>
            <td><span className={`badge ${t.status === "Done" ? "badge-green" : t.status === "In Progress" ? "badge-blue" : "badge-amber"}`}>{t.status}</span></td>
            <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{t.dueDate}</td>
            <td><div className="actions-cell"><button className="btn-icon" onClick={() => openEdit(t)}>{Icons.edit}</button><button className="btn-icon btn-danger" onClick={() => removeTask(t.id)}>{Icons.trash}</button></div></td>
          </tr>); })}
          {filtered.length === 0 && <tr><td colSpan={7} className="empty-state">No tasks found</td></tr>}
        </tbody>
      </table></div></div>
      {modal && <Modal title={modal === "new" ? "New Task" : "Edit Task"} onClose={() => setModal(null)} onSave={save}>
        <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="form-row"><div className="form-group"><label>Case</label><select value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })}>{cases.map((c) => <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>)}</select></div><div className="form-group"><label>Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{["High","Medium","Low"].map((p) => <option key={p}>{p}</option>)}</select></div></div>
        <div className="form-row"><div className="form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Todo","In Progress","Done"].map((s) => <option key={s}>{s}</option>)}</select></div><div className="form-group"><label>Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div></div>
        <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </Modal>}
    </div>
  );
}

// ─── Billing Page ───
function BillingPage({ billing, cases, addBilling, updateBilling, removeBilling }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const openNew = () => { setForm({ caseId: cases[0]?.id || "", description: "", hours: "", rate: 350, date: new Date().toISOString().split("T")[0], status: "Draft" }); setModal("new"); };
  const openEdit = (b) => { setForm({ ...b }); setModal("edit"); };
  const save = async () => { if (!form.description) return; const entry = { ...form, hours: parseFloat(form.hours) || 0, rate: parseFloat(form.rate) || 0 }; if (modal === "new") await addBilling(entry); else await updateBilling(entry); setModal(null); };
  const fmt = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });
  const totalBy = (s) => billing.filter((b) => b.status === s).reduce((sum, b) => sum + (b.hours || 0) * (b.rate || 0), 0);
  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 20 }}>
        <div className="stat-card"><div className="label">Paid</div><div className="value" style={{ color: "var(--green)" }}>{fmt(totalBy("Paid"))}</div></div>
        <div className="stat-card"><div className="label">Invoiced</div><div className="value" style={{ color: "var(--amber)" }}>{fmt(totalBy("Invoiced"))}</div></div>
        <div className="stat-card"><div className="label">Draft</div><div className="value" style={{ color: "var(--text-secondary)" }}>{fmt(totalBy("Draft"))}</div></div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}><button className="btn btn-primary" onClick={openNew}>{Icons.plus}<span>Add Entry</span></button></div>
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>Date</th><th>Case</th><th>Description</th><th>Hours</th><th>Rate</th><th>Amount</th><th>Status</th><th></th></tr></thead>
        <tbody>{[...billing].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((b) => { const cs = cases.find((c) => c.id === b.caseId); return (
          <tr key={b.id}>
            <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{b.date}</td>
            <td style={{ fontSize: 12 }}>{cs?.caseNumber || "—"}</td>
            <td style={{ fontWeight: 500 }}>{b.description}</td>
            <td>{b.hours}h</td><td>{fmt(b.rate)}/hr</td>
            <td style={{ fontWeight: 600 }}>{fmt((b.hours || 0) * (b.rate || 0))}</td>
            <td><span className={`badge ${b.status === "Paid" ? "badge-green" : b.status === "Invoiced" ? "badge-amber" : "badge-blue"}`}>{b.status}</span></td>
            <td><div className="actions-cell"><button className="btn-icon" onClick={() => openEdit(b)}>{Icons.edit}</button><button className="btn-icon btn-danger" onClick={() => removeBilling(b.id)}>{Icons.trash}</button></div></td>
          </tr>); })}</tbody>
      </table></div></div>
      {modal && <Modal title={modal === "new" ? "New Billing Entry" : "Edit Entry"} onClose={() => setModal(null)} onSave={save}>
        <div className="form-group"><label>Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="form-row"><div className="form-group"><label>Case</label><select value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })}>{cases.map((c) => <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>)}</select></div><div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div></div>
        <div className="form-row"><div className="form-group"><label>Hours</label><input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div><div className="form-group"><label>Rate ($/hr)</label><input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></div></div>
        <div className="form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Draft","Invoiced","Paid"].map((s) => <option key={s}>{s}</option>)}</select></div>
      </Modal>}
    </div>
  );
}

// ─── Calendar Page ───
function CalendarPage({ events, cases, addEvent, updateEvent }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: daysInPrev - firstDay + 1 + i, current: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, current: true });
  const rem = 7 - (cells.length % 7); if (rem < 7) for (let i = 1; i <= rem; i++) cells.push({ day: i, current: false });
  const todayStr = new Date().toISOString().split("T")[0];
  const getDateStr = (day) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const openNew = () => { setForm({ caseId: cases[0]?.id || "", title: "", date: new Date().toISOString().split("T")[0], time: "09:00", duration: 60, type: "Meeting", location: "" }); setModal("new"); };
  const save = async () => { if (!form.title) return; const entry = { ...form, duration: parseInt(form.duration) || 0 }; if (modal === "new") await addEvent(entry); else await updateEvent(entry); setModal(null); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="cal-header" style={{ marginBottom: 0 }}>
          <button className="btn btn-sm" onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
          <h3>{viewDate.toLocaleString("en-US", { month: "long", year: "numeric" })}</h3>
          <button className="btn btn-sm" onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
        </div>
        <button className="btn btn-primary" onClick={openNew}>{Icons.plus}<span>Add Event</span></button>
      </div>
      <div className="cal-grid">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="cal-day-header">{d}</div>)}
        {cells.map((cell, i) => { const dateStr = cell.current ? getDateStr(cell.day) : ""; const dayEvents = events.filter((e) => e.date === dateStr); return (
          <div key={i} className={`cal-cell ${!cell.current ? "other-month" : ""} ${dateStr === todayStr ? "today" : ""}`}>
            <div className="day-num">{cell.day}</div>
            {dayEvents.map((ev) => <div key={ev.id} className={`cal-event ${ev.type}`} onClick={() => { setForm({ ...ev }); setModal("edit"); }}>{ev.time} {ev.title}</div>)}
          </div>); })}
      </div>
      {modal && <Modal title={modal === "new" ? "New Event" : "Edit Event"} onClose={() => setModal(null)} onSave={save}>
        <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="form-row"><div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div><div className="form-group"><label>Time</label><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div></div>
        <div className="form-row"><div className="form-group"><label>Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["Meeting","Court","Deadline","Deposition","Other"].map((t) => <option key={t}>{t}</option>)}</select></div><div className="form-group"><label>Duration (min)</label><input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div></div>
        <div className="form-group"><label>Case</label><select value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })}><option value="">— None —</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>)}</select></div>
        <div className="form-group"><label>Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
      </Modal>}
    </div>
  );
}

// ─── Main App ───
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  const userId = user?.uid;
  const { items: clients, addItem: addClient, updateItem: updateClient, removeItem: removeClient } = useFirestoreCollection("clients", userId);
  const { items: cases, addItem: addCase, updateItem: updateCase, removeItem: removeCase } = useFirestoreCollection("cases", userId);
  const { items: tasks, addItem: addTask, updateItem: updateTask, removeItem: removeTask } = useFirestoreCollection("tasks", userId);
  const { items: billing, addItem: addBilling, updateItem: updateBilling, removeItem: removeBilling } = useFirestoreCollection("billing", userId);
  const { items: events, addItem: addEvent, updateItem: updateEvent, removeItem: removeEvent } = useFirestoreCollection("events", userId);

  const handleSignOut = async () => { await signOut(auth); };

  if (authLoading) return <><style>{css}</style><div className="loading-page"><div className="spinner" /></div></>;
  if (!user) return <><style>{css}</style><AuthPage /></>;

  const pages = [
    { key: "dashboard", label: "Dashboard", icon: Icons.dashboard },
    { key: "clients", label: "Clients", icon: Icons.clients, count: clients.length },
    { key: "cases", label: "Cases", icon: Icons.cases, count: cases.filter((c) => c.status !== "Closed").length },
    { key: "tasks", label: "Tasks", icon: Icons.tasks, count: tasks.filter((t) => t.status !== "Done").length },
    { key: "billing", label: "Billing", icon: Icons.billing },
    { key: "calendar", label: "Calendar", icon: Icons.calendar },
  ];

  const titles = { dashboard: "Dashboard", clients: "Clients", cases: "Cases", tasks: "Tasks", billing: "Billing", calendar: "Calendar" };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-brand"><h1><span className="brand-icon">{Icons.scale}</span><span>LexCRM</span></h1><p>Legal Practice Manager</p></div>
          <nav className="sidebar-nav">
            {pages.map((p) => <button key={p.key} className={`nav-item ${page === p.key ? "active" : ""}`} onClick={() => setPage(p.key)}>{p.icon}<span>{p.label}</span>{p.count !== undefined && <span className="nav-badge">{p.count}</span>}</button>)}
          </nav>
          <div className="sidebar-footer">
            <div className="user-email">{user.email}</div>
            <button className="nav-item" onClick={handleSignOut}>{Icons.logout}<span>Sign Out</span></button>
          </div>
        </aside>
        <div className="main">
          <div className="topbar"><h2>{titles[page]}</h2><div className="search-box">{Icons.search}<input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
          <div className="content">
            {page === "dashboard" && <Dashboard clients={clients} cases={cases} tasks={tasks} billing={billing} events={events} setPage={setPage} />}
            {page === "clients" && <ClientsPage clients={clients} addClient={addClient} updateClient={updateClient} removeClient={removeClient} />}
            {page === "cases" && <CasesPage cases={cases} clients={clients} addCase={addCase} updateCase={updateCase} removeCase={removeCase} />}
            {page === "tasks" && <TasksPage tasks={tasks} cases={cases} addTask={addTask} updateTask={updateTask} removeTask={removeTask} />}
            {page === "billing" && <BillingPage billing={billing} cases={cases} addBilling={addBilling} updateBilling={updateBilling} removeBilling={removeBilling} />}
            {page === "calendar" && <CalendarPage events={events} cases={cases} addEvent={addEvent} updateEvent={updateEvent} />}
          </div>
        </div>
      </div>
    </>
  );
}