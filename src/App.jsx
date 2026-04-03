import { useState, useEffect, useRef, createContext, useContext } from "react";
import { auth, db, storage } from "./firebase";
import translations from "./translations";
import "./App.css";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const uid = () => Math.random().toString(36).slice(2, 10);
const inviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// ─── Language System ───
const LangContext = createContext();
function useLang() { return useContext(LangContext); }
function t(lang, key) { return translations[lang]?.[key] || translations.en[key] || key; }

const langNames = { en: "English", ka: "ქართული", ru: "Русский", tr: "Türkçe" };
const langFlags = { en: "🇬🇧", ka: "🇬🇪", ru: "🇷🇺", tr: "🇹🇷" };

// ─── Icons ───
const Icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  clients: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  cases: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  tasks: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  billing: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  calendar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  team: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  chevron: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  scale: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="M2 8l10-5 10 5"/><path d="M2 8v4c0 2 2 4 4.5 4S11 14 11 12V8"/><path d="M13 8v4c0 2 2 4 4.5 4S22 14 22 12V8"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  copy: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="10" y2="6"/><line x1="14" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/></svg>,
  userRemove: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>,
  file: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>,
  upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  note: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
};



// ─── Firestore Hook (now uses firmId instead of userId) ───
function useFirestoreCollection(collectionName, firmId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firmId) { setLoading(false); return; }
    const q = query(collection(db, collectionName), where("firmId", "==", firmId));
    const unsub = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error(`Error loading ${collectionName}:`, error);
      setLoading(false);
    });
    return () => unsub();
  }, [collectionName, firmId]);

  const addItem = async (item) => {
    try {
      const id = uid();
      await setDoc(doc(db, collectionName, id), { ...item, id, firmId });
      return true;
    } catch (error) {
      console.error(`Error adding to ${collectionName}:`, error);
      throw error;
    }
  };
  const updateItem = async (item) => {
    try {
      await setDoc(doc(db, collectionName, item.id), { ...item, firmId });
      return true;
    } catch (error) {
      console.error(`Error updating ${collectionName}:`, error);
      throw error;
    }
  };
  const removeItem = async (id) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
      return true;
    } catch (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
      throw error;
    }
  };

  return { items, loading, addItem, updateItem, removeItem };
}

// ─── Toast Notification System ───
let toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (message, type = "success") => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };
  const ToastContainer = () => (
    <div className="toast-container">
      {toasts.map((t) => <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>)}
    </div>
  );
  return { show, ToastContainer };
}

// ─── Confirm Dialog ───
function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger-solid" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Page ───
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const m = { "auth/user-not-found": "No account found.", "auth/wrong-password": "Incorrect password.", "auth/email-already-in-use": "Email already in use.", "auth/invalid-email": "Invalid email.", "auth/invalid-credential": "Invalid email or password." };
      setError(m[err.code] || err.message);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    setError(""); setSuccess("");
    if (!email) { setError("Please enter your email address first."); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Check your inbox.");
      setShowReset(false);
    } catch (err) {
      setError(err.code === "auth/user-not-found" ? "No account found with this email." : err.message);
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div className="auth-page"><div className="auth-container">
      <div className="auth-brand"><h1>{Icons.scale} LexCRM</h1><p>Legal Practice Manager</p></div>
      <div className="auth-card">
        <h2>{showReset ? "Reset Password" : isLogin ? "Sign In" : "Create Account"}</h2>
        <p className="subtitle">{showReset ? "We'll send you a reset link" : isLogin ? "Welcome back" : "Get started for free"}</p>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKey} placeholder="you@lawfirm.com" /></div>
        {!showReset && <div className="form-group"><label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKey} placeholder="At least 6 characters" /></div>}
        {showReset ? (
          <>
            <button className="btn btn-primary btn-full" onClick={handleReset} disabled={loading}>{loading ? "Sending..." : "Send Reset Email"}</button>
            <div className="auth-switch"><button onClick={() => { setShowReset(false); setError(""); setSuccess(""); }}>← Back to Sign In</button></div>
          </>
        ) : (
          <>
            <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={loading}>{loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}</button>
            {isLogin && <div className="auth-switch" style={{ marginTop: 12, marginBottom: 4 }}><button onClick={() => { setShowReset(true); setError(""); setSuccess(""); }}>Forgot password?</button></div>}
            <div className="auth-switch">{isLogin ? "Don't have an account? " : "Already have an account? "}<button onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }}>{isLogin ? "Sign Up" : "Sign In"}</button></div>
          </>
        )}
      </div>
    </div></div>
  );
}

// ─── Firm Setup Page (shown after signup if no firm) ───
function FirmSetupPage({ user, onComplete }) {
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [firmName, setFirmName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createFirm = async () => {
    if (!firmName.trim()) { setError("Please enter a firm name."); return; }
    setLoading(true);
    setError("");
    try {
      const firmId = "firm_" + uid();
      const code = inviteCode();
      await setDoc(doc(db, "firms", firmId), {
        id: firmId,
        name: firmName.trim(),
        inviteCode: code,
        adminId: user.uid,
        members: [{ uid: user.uid, email: user.email, role: "Admin", joinedAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
      });
      await setDoc(doc(db, "userProfiles", user.uid), { uid: user.uid, email: user.email, firmId, role: "Admin" });
      onComplete(firmId);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const joinFirm = async () => {
    if (!joinCode.trim()) { setError("Please enter an invite code."); return; }
    setLoading(true);
    setError("");
    try {
      const firmsQuery = query(collection(db, "firms"), where("inviteCode", "==", joinCode.trim().toUpperCase()));
      const snap = await getDocs(firmsQuery);
      if (snap.empty) { setError("Invalid invite code. Please check and try again."); setLoading(false); return; }
      const firmDoc = snap.docs[0];
      const firmData = firmDoc.data();
      const alreadyMember = firmData.members?.some((m) => m.uid === user.uid);
      if (alreadyMember) { setError("You're already a member of this firm."); setLoading(false); return; }
      await updateDoc(doc(db, "firms", firmData.id), {
        members: arrayUnion({ uid: user.uid, email: user.email, role: "Member", joinedAt: new Date().toISOString() })
      });
      await setDoc(doc(db, "userProfiles", user.uid), { uid: user.uid, email: user.email, firmId: firmData.id, role: "Member" });
      onComplete(firmData.id);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div className="auth-page"><div className="auth-container">
      <div className="auth-brand"><h1>{Icons.scale} LexCRM</h1><p>Legal Practice Manager</p></div>
      <div className="auth-card">
        {!mode && <>
          <h2>Set Up Your Workspace</h2>
          <p className="subtitle">Create a new firm or join an existing one</p>
          <div className="setup-options">
            <button className="setup-option" onClick={() => setMode("create")}>
              <h3>{Icons.building} Create a New Firm</h3>
              <p>Start a new workspace and invite your team</p>
            </button>
            <button className="setup-option" onClick={() => setMode("join")}>
              <h3>{Icons.team} Join an Existing Firm</h3>
              <p>Enter an invite code from your colleague</p>
            </button>
          </div>
          <button className="nav-item" style={{ justifyContent: "center", marginTop: 8 }} onClick={() => signOut(auth)}>{Icons.logout}<span>Sign Out</span></button>
        </>}
        {mode === "create" && <>
          <h2>Create Your Firm</h2>
          <p className="subtitle">This will be your team's workspace name</p>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group"><label>Firm Name</label><input value={firmName} onChange={(e) => setFirmName(e.target.value)} placeholder="e.g. Santos & Associates" onKeyDown={(e) => e.key === "Enter" && createFirm()} /></div>
          <button className="btn btn-primary btn-full" onClick={createFirm} disabled={loading}>{loading ? "Creating..." : "Create Firm"}</button>
          <div className="auth-switch"><button onClick={() => { setMode(null); setError(""); }}>← Back</button></div>
        </>}
        {mode === "join" && <>
          <h2>Join a Firm</h2>
          <p className="subtitle">Enter the invite code shared by your admin</p>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group"><label>Invite Code</label><input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. AB3F7K" maxLength={6} style={{ fontSize: 20, letterSpacing: 4, textAlign: "center", fontFamily: "'Courier New', monospace" }} onKeyDown={(e) => e.key === "Enter" && joinFirm()} /></div>
          <button className="btn btn-primary btn-full" onClick={joinFirm} disabled={loading}>{loading ? "Joining..." : "Join Firm"}</button>
          <div className="auth-switch"><button onClick={() => { setMode(null); setError(""); }}>← Back</button></div>
        </>}
      </div>
    </div></div>
  );
}

// ─── Language Switcher Component ───
function LanguageSwitcher({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div className="lang-switcher" ref={ref}>
      <button className="lang-btn" onClick={() => setOpen(!open)}>
        <span className="flag">{langFlags[lang]}</span>
        <span>{langNames[lang]}</span>
      </button>
      {open && (
        <div className="lang-dropdown">
          {Object.keys(langNames).map((l) => (
            <button key={l} className={`lang-option ${lang === l ? "active" : ""}`} onClick={() => { setLang(l); setOpen(false); localStorage.setItem("lexcrm-lang", l); }}>
              <span className="flag">{langFlags[l]}</span>
              <span>{langNames[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modal ───
function Modal({ title, onClose, children, onSave }) {
  return (
    <div className="modal-overlay" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header"><h3>{title}</h3><button className="btn-icon" onClick={onClose}>{Icons.x}</button></div>
      <div className="modal-body">{children}</div>
      <div className="modal-footer"><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={onSave}>Save</button></div>
    </div></div>
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
        <div className="card"><div className="card-header"><h3>Upcoming Events</h3><button className="btn btn-sm" onClick={() => setPage("calendar")}>{Icons.chevron}</button></div><div className="card-body">
          {upcomingEvents.length === 0 && <div className="empty-state">No upcoming events</div>}
          {upcomingEvents.map((ev) => { const d = new Date(ev.date + "T00:00:00"); return (<div className="upcoming-item" key={ev.id}><div className="upcoming-date"><div className="day">{d.getDate()}</div><div className="month">{d.toLocaleString("en-US", { month: "short" })}</div></div><div className="upcoming-info"><h4>{ev.title}</h4><p>{ev.time} · {ev.type}{ev.location ? ` · ${ev.location}` : ""}</p></div></div>); })}
        </div></div>
        <div className="card"><div className="card-header"><h3>Priority Tasks</h3><button className="btn btn-sm" onClick={() => setPage("tasks")}>{Icons.chevron}</button></div><div className="card-body">
          {sortedTasks.map((t) => { const cs = cases.find((c) => c.id === t.caseId); return (<div className="task-item" key={t.id}><span className={`priority-dot ${t.priority}`} /><div className="task-info"><h4>{t.title}</h4><p>{cs?.caseNumber} · Due {t.dueDate}</p></div><span className={`badge ${t.status === "In Progress" ? "badge-blue" : "badge-amber"}`}>{t.status}</span></div>); })}
        </div></div>
      </div>
    </div>
  );
}

// ─── Clients ───
function ClientsPage({ clients, addClient, updateClient, removeClient, toast }) {
  const [modal, setModal] = useState(null); const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const openNew = () => { setForm({ name: "", email: "", phone: "", company: "", notes: "" }); setModal("new"); };
  const openEdit = (c) => { setForm({ ...c }); setModal("edit"); };
  const save = async () => {
    if (!form.name) return;
    try {
      if (modal === "new") { await addClient({ ...form, createdAt: new Date().toISOString().split("T")[0] }); toast.show("Client added"); }
      else { await updateClient(form); toast.show("Client updated"); }
      setModal(null);
    } catch (e) { toast.show("Error saving client", "error"); }
  };
  const handleDelete = async () => {
    try { await removeClient(confirmDelete); toast.show("Client deleted"); } catch (e) { toast.show("Error deleting client", "error"); }
    setConfirmDelete(null);
  };
  return (<div>
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}><button className="btn btn-primary" onClick={openNew}>{Icons.plus}<span>Add Client</span></button></div>
    <div className="card"><div className="table-wrap"><table><thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Since</th><th></th></tr></thead><tbody>
      {clients.map((c) => (<tr key={c.id}><td style={{ fontWeight: 600 }}>{c.name}</td><td>{c.company}</td><td style={{ color: "var(--text-secondary)" }}>{c.email}</td><td style={{ color: "var(--text-secondary)" }}>{c.phone}</td><td style={{ color: "var(--text-muted)", fontSize: 12 }}>{c.createdAt}</td><td><div className="actions-cell"><button className="btn-icon" onClick={() => openEdit(c)}>{Icons.edit}</button><button className="btn-icon btn-danger" onClick={() => setConfirmDelete(c.id)}>{Icons.trash}</button></div></td></tr>))}
      {clients.length === 0 && <tr><td colSpan={6} className="empty-state">No clients yet — add your first one</td></tr>}
    </tbody></table></div></div>
    {confirmDelete && <ConfirmDialog title="Delete Client" message="Are you sure you want to delete this client? This action cannot be undone." onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
    {modal && <Modal title={modal === "new" ? "New Client" : "Edit Client"} onClose={() => setModal(null)} onSave={save}>
      <div className="form-group"><label>Name</label><input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="form-row"><div className="form-group"><label>Email</label><input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div className="form-group"><label>Phone</label><input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div></div>
      <div className="form-group"><label>Company</label><input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
      <div className="form-group"><label>Notes</label><textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
    </Modal>}
  </div>);
}

// ─── Cases ───
function CasesPage({ cases, clients, addCase, updateCase, removeCase, toast, firmId, user }) {
  const [modal, setModal] = useState(null); const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const openNew = () => { setForm({ clientId: clients[0]?.id || "", title: "", caseNumber: "", type: "Civil Litigation", status: "Active", priority: "Medium", description: "", openDate: new Date().toISOString().split("T")[0], dueDate: "" }); setModal("new"); };
  const openEdit = (c) => { setForm({ ...c }); setModal("edit"); };
  const save = async () => {
    if (!form.title) return;
    try {
      if (modal === "new") { await addCase(form); toast.show("Case created"); }
      else { await updateCase(form); toast.show("Case updated"); }
      setModal(null);
    } catch (e) { toast.show("Error saving case", "error"); }
  };
  const handleDelete = async () => {
    try { await removeCase(confirmDelete); toast.show("Case deleted"); } catch (e) { toast.show("Error deleting case", "error"); }
    setConfirmDelete(null);
  };
  const statusBadge = (s) => <span className={`badge ${({ Active: "badge-green", Pending: "badge-amber", Closed: "badge-blue" })[s] || "badge-purple"}`}>{s}</span>;

  if (selectedCase) {
    const client = clients.find((c) => c.id === selectedCase.clientId);
    return <CaseDetailPage caseData={selectedCase} client={client} firmId={firmId} user={user} toast={toast} onBack={() => setSelectedCase(null)} />;
  }

  return (<div>
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}><button className="btn btn-primary" onClick={openNew}>{Icons.plus}<span>New Case</span></button></div>
    <div className="card"><div className="table-wrap"><table><thead><tr><th>Case</th><th>Client</th><th>Type</th><th>Status</th><th>Priority</th><th>Due</th><th></th></tr></thead><tbody>
      {cases.map((c) => { const cl = clients.find((x) => x.id === c.clientId); return (<tr key={c.id}><td><div style={{ fontWeight: 600, cursor: "pointer", color: "var(--accent)" }} onClick={() => setSelectedCase(c)}>{c.title}</div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.caseNumber}</div></td><td>{cl?.name || "—"}</td><td>{c.type}</td><td>{statusBadge(c.status)}</td><td><span className={`priority-dot ${c.priority}`} />{c.priority}</td><td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{c.dueDate || "—"}</td><td><div className="actions-cell"><button className="btn-icon" onClick={() => openEdit(c)}>{Icons.edit}</button><button className="btn-icon btn-danger" onClick={() => setConfirmDelete(c.id)}>{Icons.trash}</button></div></td></tr>); })}
      {cases.length === 0 && <tr><td colSpan={7} className="empty-state">No cases yet — create your first one</td></tr>}
    </tbody></table></div></div>
    {confirmDelete && <ConfirmDialog title="Delete Case" message="Are you sure? This will permanently delete this case." onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
    {modal && <Modal title={modal === "new" ? "New Case" : "Edit Case"} onClose={() => setModal(null)} onSave={save}>
      <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="form-row"><div className="form-group"><label>Case Number</label><input value={form.caseNumber} onChange={(e) => setForm({ ...form, caseNumber: e.target.value })} /></div><div className="form-group"><label>Client</label><select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
      <div className="form-row"><div className="form-group"><label>Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["Civil Litigation","Corporate","Immigration","Estate","Criminal","Family","Real Estate","IP","Tax","Other"].map((t) => <option key={t}>{t}</option>)}</select></div><div className="form-group"><label>Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{["High","Medium","Low"].map((p) => <option key={p}>{p}</option>)}</select></div></div>
      <div className="form-row"><div className="form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Active","Pending","Closed"].map((s) => <option key={s}>{s}</option>)}</select></div><div className="form-group"><label>Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div></div>
      <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
    </Modal>}
  </div>);
}

// ─── Tasks ───
function TasksPage({ tasks, cases, addTask, updateTask, removeTask, toast }) {
  const [modal, setModal] = useState(null); const [form, setForm] = useState({}); const [filter, setFilter] = useState("All");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const openNew = () => { setForm({ caseId: cases[0]?.id || "", title: "", status: "Todo", priority: "Medium", dueDate: "", notes: "" }); setModal("new"); };
  const openEdit = (t) => { setForm({ ...t }); setModal("edit"); };
  const save = async () => {
    if (!form.title) return;
    try {
      if (modal === "new") { await addTask(form); toast.show("Task added"); }
      else { await updateTask(form); toast.show("Task updated"); }
      setModal(null);
    } catch (e) { toast.show("Error saving task", "error"); }
  };
  const toggleDone = async (t) => { try { await updateTask({ ...t, status: t.status === "Done" ? "Todo" : "Done" }); } catch (e) { toast.show("Error updating task", "error"); } };
  const handleDelete = async () => {
    try { await removeTask(confirmDelete); toast.show("Task deleted"); } catch (e) { toast.show("Error deleting task", "error"); }
    setConfirmDelete(null);
  };
  const filtered = tasks.filter((t) => filter === "All" || t.status === filter);
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
      <div style={{ display: "flex", gap: 6 }}>{["All","Todo","In Progress","Done"].map((f) => <button key={f} className={`btn btn-sm ${filter === f ? "btn-primary" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}</div>
      <button className="btn btn-primary" onClick={openNew}>{Icons.plus}<span>Add Task</span></button>
    </div>
    <div className="card"><div className="table-wrap"><table><thead><tr><th style={{ width: 36 }}></th><th>Task</th><th>Case</th><th>Priority</th><th>Status</th><th>Due</th><th></th></tr></thead><tbody>
      {filtered.map((t) => { const cs = cases.find((c) => c.id === t.caseId); return (<tr key={t.id}><td><div className={`task-checkbox ${t.status === "Done" ? "done" : ""}`} onClick={() => toggleDone(t)} /></td><td><span style={t.status === "Done" ? { textDecoration: "line-through", color: "var(--text-muted)" } : { fontWeight: 500 }}>{t.title}</span></td><td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{cs?.caseNumber || "—"}</td><td><span className={`priority-dot ${t.priority}`} />{t.priority}</td><td><span className={`badge ${t.status === "Done" ? "badge-green" : t.status === "In Progress" ? "badge-blue" : "badge-amber"}`}>{t.status}</span></td><td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{t.dueDate}</td><td><div className="actions-cell"><button className="btn-icon" onClick={() => openEdit(t)}>{Icons.edit}</button><button className="btn-icon btn-danger" onClick={() => setConfirmDelete(t.id)}>{Icons.trash}</button></div></td></tr>); })}
      {filtered.length === 0 && <tr><td colSpan={7} className="empty-state">No tasks found</td></tr>}
    </tbody></table></div></div>
    {confirmDelete && <ConfirmDialog title="Delete Task" message="Are you sure you want to delete this task?" onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
    {modal && <Modal title={modal === "new" ? "New Task" : "Edit Task"} onClose={() => setModal(null)} onSave={save}>
      <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="form-row"><div className="form-group"><label>Case</label><select value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })}>{cases.map((c) => <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>)}</select></div><div className="form-group"><label>Priority</label><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{["High","Medium","Low"].map((p) => <option key={p}>{p}</option>)}</select></div></div>
      <div className="form-row"><div className="form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Todo","In Progress","Done"].map((s) => <option key={s}>{s}</option>)}</select></div><div className="form-group"><label>Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div></div>
      <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
    </Modal>}
  </div>);
}

// ─── Billing ───
function BillingPage({ billing, cases, addBilling, updateBilling, removeBilling, toast }) {
  const [modal, setModal] = useState(null); const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const openNew = () => { setForm({ caseId: cases[0]?.id || "", description: "", hours: "", rate: 350, date: new Date().toISOString().split("T")[0], status: "Draft" }); setModal("new"); };
  const openEdit = (b) => { setForm({ ...b }); setModal("edit"); };
  const save = async () => {
    if (!form.description) return;
    try {
      const e = { ...form, hours: parseFloat(form.hours) || 0, rate: parseFloat(form.rate) || 0 };
      if (modal === "new") { await addBilling(e); toast.show("Billing entry added"); }
      else { await updateBilling(e); toast.show("Billing entry updated"); }
      setModal(null);
    } catch (e) { toast.show("Error saving billing entry", "error"); }
  };
  const handleDelete = async () => {
    try { await removeBilling(confirmDelete); toast.show("Billing entry deleted"); } catch (e) { toast.show("Error deleting entry", "error"); }
    setConfirmDelete(null);
  };
  const fmt = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });
  const totalBy = (s) => billing.filter((b) => b.status === s).reduce((sum, b) => sum + (b.hours || 0) * (b.rate || 0), 0);
  return (<div>
    <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 20 }}>
      <div className="stat-card"><div className="label">Paid</div><div className="value" style={{ color: "var(--green)" }}>{fmt(totalBy("Paid"))}</div></div>
      <div className="stat-card"><div className="label">Invoiced</div><div className="value" style={{ color: "var(--amber)" }}>{fmt(totalBy("Invoiced"))}</div></div>
      <div className="stat-card"><div className="label">Draft</div><div className="value" style={{ color: "var(--text-secondary)" }}>{fmt(totalBy("Draft"))}</div></div>
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}><button className="btn btn-primary" onClick={openNew}>{Icons.plus}<span>Add Entry</span></button></div>
    <div className="card"><div className="table-wrap"><table><thead><tr><th>Date</th><th>Case</th><th>Description</th><th>Hours</th><th>Rate</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>
      {[...billing].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((b) => { const cs = cases.find((c) => c.id === b.caseId); return (<tr key={b.id}><td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{b.date}</td><td style={{ fontSize: 12 }}>{cs?.caseNumber || "—"}</td><td style={{ fontWeight: 500 }}>{b.description}</td><td>{b.hours}h</td><td>{fmt(b.rate)}/hr</td><td style={{ fontWeight: 600 }}>{fmt((b.hours || 0) * (b.rate || 0))}</td><td><span className={`badge ${b.status === "Paid" ? "badge-green" : b.status === "Invoiced" ? "badge-amber" : "badge-blue"}`}>{b.status}</span></td><td><div className="actions-cell"><button className="btn-icon" onClick={() => openEdit(b)}>{Icons.edit}</button><button className="btn-icon btn-danger" onClick={() => setConfirmDelete(b.id)}>{Icons.trash}</button></div></td></tr>); })}
    </tbody></table></div></div>
    {confirmDelete && <ConfirmDialog title="Delete Billing Entry" message="Are you sure you want to delete this billing entry?" onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />}
    {modal && <Modal title={modal === "new" ? "New Billing Entry" : "Edit Entry"} onClose={() => setModal(null)} onSave={save}>
      <div className="form-group"><label>Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="form-row"><div className="form-group"><label>Case</label><select value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })}>{cases.map((c) => <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>)}</select></div><div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div></div>
      <div className="form-row"><div className="form-group"><label>Hours</label><input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div><div className="form-group"><label>Rate ($/hr)</label><input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></div></div>
      <div className="form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["Draft","Invoiced","Paid"].map((s) => <option key={s}>{s}</option>)}</select></div>
    </Modal>}
  </div>);
}

// ─── Case Detail Page (Documents + Notes) ───
function CaseDetailPage({ caseData, client, firmId, user, toast, onBack }) {
  const [tab, setTab] = useState("notes");
  const [docs, setDocs] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [docTag, setDocTag] = useState("General");
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(null);
  const fileInputRef = useRef(null);

  // Load documents
  useEffect(() => {
    if (!caseData?.id || !firmId) return;
    const q = query(collection(db, "documents"), where("caseId", "==", caseData.id), where("firmId", "==", firmId));
    const unsub = onSnapshot(q, (snap) => setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.uploadedAt || "").localeCompare(a.uploadedAt || ""))));
    return () => unsub();
  }, [caseData?.id, firmId]);

  // Load notes
  useEffect(() => {
    if (!caseData?.id || !firmId) return;
    const q = query(collection(db, "caseNotes"), where("caseId", "==", caseData.id), where("firmId", "==", firmId));
    const unsub = onSnapshot(q, (snap) => setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))));
    return () => unsub();
  }, [caseData?.id, firmId]);

  const getFileType = (name) => {
    const ext = name?.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext)) return "pdf";
    if (["doc", "docx"].includes(ext)) return "doc";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "img";
    return "other";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) { toast.show(`${file.name} is too large (max 10MB)`, "error"); continue; }
        const fileId = uid();
        const storagePath = `firms/${firmId}/cases/${caseData.id}/${fileId}_${file.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        await setDoc(doc(db, "documents", fileId), {
          id: fileId, firmId, caseId: caseData.id,
          name: file.name, size: file.size, type: file.type,
          tag: docTag, storagePath, downloadURL,
          uploadedBy: user.email, uploadedAt: new Date().toISOString(),
        });
        // Auto-log activity
        await addNote(`Uploaded document: ${file.name}`, "activity", false);
      }
      toast.show(`${files.length} file(s) uploaded`);
    } catch (e) { console.error(e); toast.show("Error uploading file", "error"); }
    setUploading(false);
  };

  const deleteDocument = async () => {
    if (!confirmDeleteDoc) return;
    try {
      const docData = docs.find((d) => d.id === confirmDeleteDoc);
      if (docData?.storagePath) {
        try { await deleteObject(ref(storage, docData.storagePath)); } catch (e) { /* file may already be deleted */ }
      }
      await deleteDoc(doc(db, "documents", confirmDeleteDoc));
      toast.show("Document deleted");
    } catch (e) { toast.show("Error deleting document", "error"); }
    setConfirmDeleteDoc(null);
  };

  const addNote = async (text, type = "note", showToast = true) => {
    if (!text?.trim()) return;
    const noteId = uid();
    await setDoc(doc(db, "caseNotes", noteId), {
      id: noteId, firmId, caseId: caseData.id,
      text: text.trim(), type,
      isPrivate: type === "note" ? isPrivate : false,
      author: user.email,
      createdAt: new Date().toISOString(),
    });
    if (showToast && type === "note") { toast.show("Note added"); setNoteText(""); }
  };

  const handleSubmitNote = async () => {
    if (!noteText.trim()) return;
    try { await addNote(noteText); } catch (e) { toast.show("Error adding note", "error"); }
  };

  const deleteNote = async (noteId) => {
    try { await deleteDoc(doc(db, "caseNotes", noteId)); toast.show("Note deleted"); } catch (e) { toast.show("Error deleting note", "error"); }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files); };
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const statusColors = { Active: "badge-green", Pending: "badge-amber", Closed: "badge-blue", New: "badge-purple", "In Progress": "badge-blue", "Awaiting Client": "badge-amber", "In Court": "badge-red" };

  return (
    <div>
      <div className="case-detail-header">
        <div className="case-detail-title">
          <button className="back-btn" onClick={onBack}>{Icons.back} Back to Cases</button>
          <h2>{caseData.title}</h2>
          <div className="case-meta">
            <span>{caseData.caseNumber}</span>
            <span><span className={`badge ${statusColors[caseData.status] || "badge-purple"}`}>{caseData.status}</span></span>
            <span>{caseData.type}</span>
            {client && <span>Client: {client.name}</span>}
            {caseData.dueDate && <span>Due: {caseData.dueDate}</span>}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "notes" ? "active" : ""}`} onClick={() => setTab("notes")}>{Icons.note} Notes & Activity ({notes.length})</button>
        <button className={`tab ${tab === "documents" ? "active" : ""}`} onClick={() => setTab("documents")}>{Icons.file} Documents ({docs.length})</button>
      </div>

      {tab === "documents" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
            <select value={docTag} onChange={(e) => setDocTag(e.target.value)} style={{ padding: "8px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text)", fontFamily: "var(--font)", fontSize: 13 }}>
              {["General", "Contract", "Claim", "Evidence", "Invoice", "Correspondence", "Court Filing", "Other"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Tag for new uploads</span>
          </div>

          <div className={`drop-zone ${dragging ? "dragging" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onClick={() => fileInputRef.current?.click()}>
            {Icons.upload}
            <p>{uploading ? "Uploading..." : "Drop files here or click to browse"}</p>
            <div className="hint">PDF, Word, Images — Max 10MB per file</div>
            <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={(e) => { handleUpload(e.target.files); e.target.value = ""; }} />
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><h3>Documents</h3></div>
            <div className="card-body">
              {docs.length === 0 && <div className="empty-state">No documents yet — upload your first file</div>}
              {docs.map((d) => (
                <div className="doc-item" key={d.id}>
                  <div className={`doc-icon ${getFileType(d.name)}`}>{Icons.file}</div>
                  <div className="doc-info">
                    <h4>{d.name}</h4>
                    <p>{formatFileSize(d.size)} · {d.uploadedBy} · {d.uploadedAt?.split("T")[0]}</p>
                  </div>
                  <span className={`badge ${d.tag === "Evidence" ? "badge-red" : d.tag === "Contract" ? "badge-blue" : d.tag === "Invoice" ? "badge-green" : "badge-purple"}`}>{d.tag}</span>
                  <a href={d.downloadURL} target="_blank" rel="noopener noreferrer" className="btn-icon" title="Download">{Icons.download}</a>
                  <button className="btn-icon btn-danger" onClick={() => setConfirmDeleteDoc(d.id)} title="Delete">{Icons.trash}</button>
                </div>
              ))}
            </div>
          </div>
          {confirmDeleteDoc && <ConfirmDialog title="Delete Document" message="This will permanently delete this document." onConfirm={deleteDocument} onCancel={() => setConfirmDeleteDoc(null)} />}
        </div>
      )}

      {tab === "notes" && (
        <div>
          <div className="note-input-area">
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note about this case..." onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleSubmitNote(); }} />
            <div className="note-input-actions">
              <label className="privacy-toggle" onClick={() => setIsPrivate(!isPrivate)} style={{ cursor: "pointer" }}>
                {isPrivate ? Icons.lock : Icons.eye}
                <span>{isPrivate ? "Private (only you)" : "Visible to team"}</span>
              </label>
              <button className="btn btn-primary btn-sm" onClick={handleSubmitNote}>Add Note</button>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Activity & Notes</h3></div>
            <div className="card-body" style={{ padding: "0 20px" }}>
              {notes.length === 0 && <div className="empty-state">No notes yet — add the first one</div>}
              {notes.map((n) => (
                <div className="note-item" key={n.id}>
                  <div className="note-avatar">{n.author?.[0]?.toUpperCase()}</div>
                  <div className="note-content">
                    <div className="note-header">
                      <span className="author">{n.author}</span>
                      <span className="time">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</span>
                      {n.isPrivate && <span className="private-badge">{Icons.lock} Private</span>}
                    </div>
                    <span className={`note-type-badge ${n.type}`}>{n.type === "activity" ? "Activity" : "Note"}</span>
                    <div className="note-text">{n.text}</div>
                  </div>
                  {n.type === "note" && <button className="btn-icon btn-danger" onClick={() => deleteNote(n.id)} style={{ alignSelf: "flex-start" }}>{Icons.trash}</button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar ───
function CalendarPage({ events, cases, addEvent, updateEvent }) {
  const [viewDate, setViewDate] = useState(new Date()); const [modal, setModal] = useState(null); const [form, setForm] = useState({});
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate(); const daysInPrev = new Date(year, month, 0).getDate();
  const cells = []; for (let i = 0; i < firstDay; i++) cells.push({ day: daysInPrev - firstDay + 1 + i, current: false }); for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, current: true }); const rem = 7 - (cells.length % 7); if (rem < 7) for (let i = 1; i <= rem; i++) cells.push({ day: i, current: false });
  const todayStr = new Date().toISOString().split("T")[0]; const getDateStr = (day) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const openNew = () => { setForm({ caseId: cases[0]?.id || "", title: "", date: new Date().toISOString().split("T")[0], time: "09:00", duration: 60, type: "Meeting", location: "" }); setModal("new"); };
  const save = async () => { if (!form.title) return; const e = { ...form, duration: parseInt(form.duration) || 0 }; if (modal === "new") await addEvent(e); else await updateEvent(e); setModal(null); };
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div className="cal-header" style={{ marginBottom: 0 }}><button className="btn btn-sm" onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button><h3>{viewDate.toLocaleString("en-US", { month: "long", year: "numeric" })}</h3><button className="btn btn-sm" onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button></div>
      <button className="btn btn-primary" onClick={openNew}>{Icons.plus}<span>Add Event</span></button>
    </div>
    <div className="cal-grid">
      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="cal-day-header">{d}</div>)}
      {cells.map((cell, i) => { const dateStr = cell.current ? getDateStr(cell.day) : ""; const dayEvents = events.filter((e) => e.date === dateStr); return (<div key={i} className={`cal-cell ${!cell.current ? "other-month" : ""} ${dateStr === todayStr ? "today" : ""}`}><div className="day-num">{cell.day}</div>{dayEvents.map((ev) => <div key={ev.id} className={`cal-event ${ev.type}`} onClick={() => { setForm({ ...ev }); setModal("edit"); }}>{ev.time} {ev.title}</div>)}</div>); })}
    </div>
    {modal && <Modal title={modal === "new" ? "New Event" : "Edit Event"} onClose={() => setModal(null)} onSave={save}>
      <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="form-row"><div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div><div className="form-group"><label>Time</label><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div></div>
      <div className="form-row"><div className="form-group"><label>Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{["Meeting","Court","Deadline","Deposition","Other"].map((t) => <option key={t}>{t}</option>)}</select></div><div className="form-group"><label>Duration (min)</label><input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div></div>
      <div className="form-group"><label>Case</label><select value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })}><option value="">— None —</option>{cases.map((c) => <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>)}</select></div>
      <div className="form-group"><label>Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
    </Modal>}
  </div>);
}

// ─── Team Page ───
function TeamPage({ firm, userRole, user }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(firm.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeMember = async (memberUid) => {
    if (memberUid === firm.adminId) return;
    const updated = firm.members.filter((m) => m.uid !== memberUid);
    await updateDoc(doc(db, "firms", firm.id), { members: updated });
    await deleteDoc(doc(db, "userProfiles", memberUid));
  };

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 20 }}>
        <div className="stat-card"><div className="label">Firm Name</div><div className="value" style={{ fontSize: 20 }}>{firm.name}</div></div>
        <div className="stat-card"><div className="label">Members</div><div className="value">{firm.members?.length || 1}</div></div>
        <div className="stat-card"><div className="label">Your Role</div><div className="value" style={{ fontSize: 20, color: "var(--accent)" }}>{userRole}</div></div>
      </div>

      {userRole === "Admin" && (
        <div className="invite-code-box">
          <div className="label">Invite Code — Share with your team</div>
          <div className="code">{firm.inviteCode}</div>
          <button className="copy-btn" onClick={copyCode}>{Icons.copy}{copied ? "Copied!" : "Copy Code"}</button>
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><h3>Team Members</h3></div>
        <div className="card-body">
          {(firm.members || []).map((m) => (
            <div className="member-card" key={m.uid}>
              <div className="member-info">
                <div className="member-avatar">{m.email?.[0]?.toUpperCase()}</div>
                <div className="member-details">
                  <h4>{m.email}</h4>
                  <p>{m.role} · Joined {m.joinedAt?.split("T")[0]}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`badge ${m.role === "Admin" ? "badge-purple" : "badge-blue"}`}>{m.role}</span>
                {userRole === "Admin" && m.uid !== firm.adminId && (
                  <button className="btn-icon btn-danger" onClick={() => removeMember(m.uid)} title="Remove member">{Icons.userRemove}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [firm, setFirm] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const toast = useToast();
  const [lang, setLang] = useState(() => localStorage.getItem("lexcrm-lang") || "en");
  const T = (key) => t(lang, key);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  // Profile & Firm listener
  useEffect(() => {
    if (!user) { setProfile(null); setFirm(null); setProfileLoading(false); return; }
    const unsub = onSnapshot(doc(db, "userProfiles", user.uid), async (snap) => {
      if (snap.exists()) {
        const prof = snap.data();
        setProfile(prof);
        if (prof.firmId) {
          const firmUnsub = onSnapshot(doc(db, "firms", prof.firmId), (firmSnap) => {
            if (firmSnap.exists()) setFirm(firmSnap.data());
            setProfileLoading(false);
          });
          return () => firmUnsub();
        }
      } else {
        setProfile(null);
      }
      setProfileLoading(false);
    });
    return () => unsub();
  }, [user]);

  const firmId = profile?.firmId;
  const userRole = profile?.role || "Member";

  const { items: clients, addItem: addClient, updateItem: updateClient, removeItem: removeClient } = useFirestoreCollection("clients", firmId);
  const { items: cases, addItem: addCase, updateItem: updateCase, removeItem: removeCase } = useFirestoreCollection("cases", firmId);
  const { items: tasks, addItem: addTask, updateItem: updateTask, removeItem: removeTask } = useFirestoreCollection("tasks", firmId);
  const { items: billing, addItem: addBilling, updateItem: updateBilling, removeItem: removeBilling } = useFirestoreCollection("billing", firmId);
  const { items: events, addItem: addEvent, updateItem: updateEvent } = useFirestoreCollection("events", firmId);

  const handleSignOut = async () => { await signOut(auth); setProfile(null); setFirm(null); };

  if (authLoading || profileLoading) return <><div className="loading-page"><div className="spinner" /></div></>;
  if (!user) return <><AuthPage /></>;
  if (!profile || !profile.firmId) return <><FirmSetupPage user={user} onComplete={(fId) => setProfile({ ...profile, firmId: fId })} /></>;

  const pages = [
    { key: "dashboard", icon: Icons.dashboard },
    { key: "clients", icon: Icons.clients, count: clients.length },
    { key: "cases", icon: Icons.cases, count: cases.filter((c) => c.status !== "Closed").length },
    { key: "tasks", icon: Icons.tasks, count: tasks.filter((t) => t.status !== "Done").length },
    { key: "billing", icon: Icons.billing },
    { key: "calendar", icon: Icons.calendar },
    { key: "team", icon: Icons.team, count: firm?.members?.length },
  ];

  return (
    <>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-brand"><h1><span className="brand-icon">{Icons.scale}</span><span>LexCRM</span></h1><p>{T("legalPracticeManager")}</p>{firm && <div className="firm-name">{firm.name}</div>}</div>
          <nav className="sidebar-nav">
            {pages.map((p) => <button key={p.key} className={`nav-item ${page === p.key ? "active" : ""}`} onClick={() => setPage(p.key)}>{p.icon}<span>{T(p.key)}</span>{p.count !== undefined && <span className="nav-badge">{p.count}</span>}</button>)}
          </nav>
          <div className="sidebar-footer">
            <div className="user-role">{userRole}</div>
            <div className="user-email">{user.email}</div>
            <button className="nav-item" onClick={handleSignOut}>{Icons.logout}<span>{T("signOut")}</span></button>
          </div>
        </aside>
        <div className="main">
          <div className="topbar"><h2>{T(page)}</h2><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div className="search-box">{Icons.search}<input placeholder={T("search")} value={search} onChange={(e) => setSearch(e.target.value)} /></div><LanguageSwitcher lang={lang} setLang={setLang} /></div></div>
          <div className="content">
            {page === "dashboard" && <Dashboard clients={clients} cases={cases} tasks={tasks} billing={billing} events={events} setPage={setPage} />}
            {page === "clients" && <ClientsPage clients={clients} addClient={addClient} updateClient={updateClient} removeClient={removeClient} toast={toast} />}
            {page === "cases" && <CasesPage cases={cases} clients={clients} addCase={addCase} updateCase={updateCase} removeCase={removeCase} toast={toast} firmId={firmId} user={user} />}
            {page === "tasks" && <TasksPage tasks={tasks} cases={cases} addTask={addTask} updateTask={updateTask} removeTask={removeTask} toast={toast} />}
            {page === "billing" && <BillingPage billing={billing} cases={cases} addBilling={addBilling} updateBilling={updateBilling} removeBilling={removeBilling} toast={toast} />}
            {page === "calendar" && <CalendarPage events={events} cases={cases} addEvent={addEvent} updateEvent={updateEvent} />}
            {page === "team" && firm && <TeamPage firm={firm} userRole={userRole} user={user} />}
          </div>
        </div>
      </div>
      <toast.ToastContainer />
    </>
  );
}
