import { useCallback, useEffect, useMemo, useState } from "react";
import {
  sendAuthRequest,
  getPlaces, createPlace, updatePlace, deletePlace,
  getHotels, createHotel, updateHotel, deleteHotel,
  getEvents, createEvent, updateEvent, deleteEvent,
} from "./services/api";
import "./App.css";

/* ═══════════════════════════════════════════════════════════════════════════
   TOAST SYSTEM
   ═══════════════════════════════════════════════════════════════════════════ */
let toastId = 0;

function ToastContainer({ toasts, dismiss }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === "success" ? "✓" : "✕"}</span>
          <span>{t.message}</span>
          <button className="toast-dismiss" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIRM DIALOG
   ═══════════════════════════════════════════════════════════════════════════ */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <h3>Are you sure?</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm-delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CRUD MODAL FORM
   ═══════════════════════════════════════════════════════════════════════════ */
function CrudModal({ title, fields, initial, onSave, onClose }) {
  const [form, setForm] = useState(() => {
    const state = {};
    fields.forEach((f) => {
      state[f.name] = initial?.[f.name] ?? f.default ?? "";
    });
    return state;
  });

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert numeric fields
    const payload = { ...form };
    fields.forEach((f) => {
      if (f.type === "number" && payload[f.name] !== "" && payload[f.name] !== undefined) {
        payload[f.name] = Number(payload[f.name]);
      }
    });
    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {fields.map((f) => {
              if (f.row) return null; // handled in form-row
              return (
                <div className="form-group" key={f.name}>
                  <label htmlFor={`field-${f.name}`}>{f.label}</label>
                  {f.type === "select" ? (
                    <select
                      id={`field-${f.name}`}
                      value={form[f.name] || ""}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                      required={f.required}
                    >
                      <option value="">Select {f.label.toLowerCase()}</option>
                      {f.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      id={`field-${f.name}`}
                      value={form[f.name] || ""}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                      required={f.required}
                      placeholder={f.placeholder || ""}
                    />
                  ) : (
                    <input
                      id={`field-${f.name}`}
                      type={f.type || "text"}
                      value={form[f.name] || ""}
                      onChange={(e) => handleChange(f.name, e.target.value)}
                      required={f.required}
                      placeholder={f.placeholder || ""}
                      min={f.min}
                      max={f.max}
                      step={f.step}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">
              {initial ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FIELD DEFINITIONS for each resource
   ═══════════════════════════════════════════════════════════════════════════ */
const PLACE_FIELDS = [
  { name: "name", label: "Name", required: true, placeholder: "e.g. Temple of the Tooth" },
  { name: "description", label: "Description", type: "textarea", required: true, placeholder: "Brief description of the place" },
  { name: "location", label: "Location", type: "select", required: true, options: ["Kandy", "Anuradhapura"] },
  { name: "category", label: "Category", type: "select", required: true, options: ["History", "Culture", "Nature", "Religious", "Adventure"] },
  { name: "estimatedCost", label: "Estimated Cost (Rs.)", type: "number", required: true, min: 0, placeholder: "0" },
  { name: "estimatedDuration", label: "Duration (hours)", type: "number", required: true, min: 0, step: "0.5", placeholder: "2" },
  { name: "address", label: "Address", placeholder: "Street address (optional)" },
  { name: "imageUrl", label: "Image URL", placeholder: "https://... (optional)" },
];

const HOTEL_FIELDS = [
  { name: "name", label: "Name", required: true, placeholder: "e.g. Queen's Hotel" },
  { name: "description", label: "Description", type: "textarea", required: true, placeholder: "Brief description of the hotel" },
  { name: "location", label: "Location", type: "select", required: true, options: ["Kandy", "Anuradhapura"] },
  { name: "pricePerNight", label: "Price Per Night (Rs.)", type: "number", required: true, min: 0, placeholder: "5000" },
  { name: "rating", label: "Rating (0–5)", type: "number", min: 0, max: 5, step: "0.1", placeholder: "4.5" },
  { name: "address", label: "Address", placeholder: "Street address (optional)" },
  { name: "imageUrl", label: "Image URL", placeholder: "https://... (optional)" },
];

const EVENT_FIELDS = [
  { name: "name", label: "Name", required: true, placeholder: "e.g. Esala Perahera" },
  { name: "description", label: "Description", type: "textarea", required: true, placeholder: "Brief description of the event" },
  { name: "location", label: "Location", type: "select", required: true, options: ["Kandy", "Anuradhapura"] },
  { name: "category", label: "Category", required: true, placeholder: "e.g. Cultural, Festival, Religious" },
  { name: "startDate", label: "Start Date", type: "date", required: true },
  { name: "endDate", label: "End Date", type: "date", required: true },
  { name: "estimatedCost", label: "Estimated Cost (Rs.)", type: "number", min: 0, placeholder: "0" },
  { name: "imageUrl", label: "Image URL", placeholder: "https://... (optional)" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN RESOURCE MANAGER COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
function AdminResourceManager({
  resourceName, icon, fields, columns,
  fetchFn, createFn, updateFn, deleteFn,
  toast,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);       // null | { mode: "create" } | { mode: "edit", item }
  const [confirmDelete, setConfirmDelete] = useState(null);  // null | item

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchFn();
      setItems(data);
    } catch (err) {
      toast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, toast]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (payload) => {
    try {
      if (modal.mode === "create") {
        await createFn(payload);
        toast("success", `${resourceName} created successfully.`);
      } else {
        await updateFn(modal.item._id, payload);
        toast("success", `${resourceName} updated successfully.`);
      }
      setModal(null);
      load();
    } catch (err) {
      toast("error", err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFn(confirmDelete._id);
      toast("success", `${resourceName} deleted successfully.`);
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast("error", err.message);
    }
  };

  const prepareInitial = (item) => {
    const copy = { ...item };
    // Format dates for date inputs
    if (copy.startDate) copy.startDate = copy.startDate.slice(0, 10);
    if (copy.endDate) copy.endDate = copy.endDate.slice(0, 10);
    return copy;
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>{icon} {resourceName}s</h1>
          <p>Manage all {resourceName.toLowerCase()} records in the system.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ mode: "create" })}>
          + Add {resourceName}
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total {resourceName}s</div>
          <div className="stat-value">{items.length}</div>
          <div className="stat-desc">Records in database</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Kandy</div>
          <div className="stat-value">{items.filter((i) => i.location === "Kandy").length}</div>
          <div className="stat-desc">In Kandy region</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Anuradhapura</div>
          <div className="stat-value">{items.filter((i) => i.location === "Anuradhapura").length}</div>
          <div className="stat-desc">In Anuradhapura region</div>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading {resourceName.toLowerCase()}s…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="data-table-wrap">
          <div className="empty-state">
            <div className="empty-icon">{icon}</div>
            <h2>No {resourceName.toLowerCase()}s found</h2>
            <p>Click &quot;Add {resourceName}&quot; to create your first record.</p>
          </div>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.header}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  {columns.map((col) => (
                    <td key={col.key} className={col.className || ""}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  <td>
                    <div className="td-actions">
                      <button className="btn-edit" onClick={() => setModal({ mode: "edit", item })}>
                        ✏️ Edit
                      </button>
                      <button className="btn-delete" onClick={() => setConfirmDelete(item)}>
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <CrudModal
          title={modal.mode === "create" ? `Add New ${resourceName}` : `Edit ${resourceName}`}
          fields={fields}
          initial={modal.mode === "edit" ? prepareInitial(modal.item) : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message={`This will permanently delete "${confirmDelete.name}". This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   USER BROWSE COMPONENT (read-only cards)
   ═══════════════════════════════════════════════════════════════════════════ */
function UserBrowse({ resourceName, icon, fetchFn, renderCard, toast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchFn();
      setItems(data);
    } catch (err) {
      toast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>{icon} {resourceName}s</h1>
          <p>Browse available {resourceName.toLowerCase()}s in Sri Lanka.</p>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder={`Search ${resourceName.toLowerCase()}s...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 400,
            padding: "0.75rem 1rem",
            background: "var(--bg-glass)",
            border: "1px solid var(--border-glass)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-primary)",
            fontSize: "0.9rem",
          }}
        />
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading {resourceName.toLowerCase()}s…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{icon}</div>
          <h2>No {resourceName.toLowerCase()}s found</h2>
          <p>{search ? "Try a different search term." : "No records available yet."}</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((item) => renderCard(item))}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COLUMN DEFINITIONS for admin tables
   ═══════════════════════════════════════════════════════════════════════════ */
const PLACE_COLUMNS = [
  { key: "name", header: "Name", className: "td-name" },
  { key: "location", header: "Location", render: (i) => <span className="location-badge">{i.location}</span> },
  { key: "category", header: "Category", render: (i) => <span className="category-badge">{i.category}</span> },
  { key: "estimatedCost", header: "Cost (Rs.)", render: (i) => Number(i.estimatedCost).toLocaleString() },
  { key: "estimatedDuration", header: "Duration", render: (i) => `${i.estimatedDuration}h` },
];

const HOTEL_COLUMNS = [
  { key: "name", header: "Name", className: "td-name" },
  { key: "location", header: "Location", render: (i) => <span className="location-badge">{i.location}</span> },
  { key: "pricePerNight", header: "Price/Night", render: (i) => `Rs. ${Number(i.pricePerNight).toLocaleString()}` },
  { key: "rating", header: "Rating", render: (i) => i.rating != null ? `★ ${i.rating}` : "—" },
  { key: "address", header: "Address", render: (i) => i.address || "—" },
];

const EVENT_COLUMNS = [
  { key: "name", header: "Name", className: "td-name" },
  { key: "location", header: "Location", render: (i) => <span className="location-badge">{i.location}</span> },
  { key: "category", header: "Category", render: (i) => <span className="category-badge">{i.category}</span> },
  { key: "startDate", header: "Start", render: (i) => new Date(i.startDate).toLocaleDateString() },
  { key: "endDate", header: "End", render: (i) => new Date(i.endDate).toLocaleDateString() },
  { key: "estimatedCost", header: "Cost", render: (i) => `Rs. ${Number(i.estimatedCost || 0).toLocaleString()}` },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════════════ */
function App() {
  // ── Auth state ──────────────────────────────────────────────────────────
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("lankaUser") || "null")
  );
  const [authPage, setAuthPage] = useState("login"); // "login" | "register"
  const [authError, setAuthError] = useState("");

  // ── Navigation ──────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState("places");

  // ── Toasts ──────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((type, message) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Auth handlers ───────────────────────────────────────────────────────
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");

    const formData = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const result = await sendAuthRequest(
        authPage === "login" ? "login" : "register",
        formData
      );

      if (authPage === "register") {
        toast("success", "Account created successfully! Please log in.");
        setAuthPage("login");
        return;
      }

      localStorage.setItem("lankaToken", result.token);
      localStorage.setItem("lankaUser", JSON.stringify(result.user));
      setUser(result.user);
      setActiveSection("places");
      toast("success", `Welcome back, ${result.user.name}!`);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("lankaToken");
    localStorage.removeItem("lankaUser");
    setUser(null);
    setAuthPage("login");
    setAuthError("");
  };

  // ══════════════════════════════════════════════════════════════════════
  //  NOT LOGGED IN → Show Login / Register
  // ══════════════════════════════════════════════════════════════════════
  if (!user) {
    const isLogin = authPage === "login";
    return (
      <>
        <ToastContainer toasts={toasts} dismiss={dismissToast} />
        <div className="auth-page">
          <form className="auth-card" onSubmit={handleAuth}>
            <div className="auth-brand">
              <h2>Roam<span style={{ color: "var(--teal)" }}>Lanka</span></h2>
              <p>Your Sri Lanka travel companion</p>
            </div>

            <span className="auth-eyebrow">
              {isLogin ? "Welcome Back" : "Create Account"}
            </span>

            <h1>{isLogin ? "Sign in to your account" : "Start your journey"}</h1>

            <p>
              {isLogin
                ? "Enter your credentials to access the dashboard."
                : "Create a free account to explore Sri Lanka."}
            </p>

            {authError && (
              <div style={{
                padding: "0.7rem 1rem",
                background: "var(--danger-bg)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "var(--radius-sm)",
                color: "var(--danger)",
                fontSize: "0.85rem",
              }}>
                {authError}
              </div>
            )}

            {!isLogin && (
              <label>
                Full Name
                <input name="name" required placeholder="Your full name" />
              </label>
            )}

            <label>
              Email Address
              <input name="email" type="email" required placeholder="you@example.com" />
            </label>

            <label>
              Password
              <input name="password" type="password" required placeholder="Your password" />
            </label>

            <button type="submit" className="auth-submit">
              {isLogin ? "Sign In" : "Create Account"}
            </button>

            <p className="auth-switch">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => { setAuthPage(isLogin ? "register" : "login"); setAuthError(""); }}
              >
                {isLogin ? "Register" : "Sign In"}
              </button>
            </p>
          </form>
        </div>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  //  LOGGED IN → Role-based dashboard
  // ══════════════════════════════════════════════════════════════════════
  const isAdmin = user.role === "admin";

  const navItems = isAdmin
    ? [
        { id: "places", label: "Places", icon: "📍" },
        { id: "hotels", label: "Hotels", icon: "🏨" },
        { id: "events", label: "Events", icon: "🎭" },
      ]
    : [
        { id: "places", label: "Places", icon: "📍" },
        { id: "hotels", label: "Hotels", icon: "🏨" },
        { id: "events", label: "Events", icon: "🎭" },
      ];

  const renderContent = () => {
    if (isAdmin) {
      // ── Admin CRUD views ────────────────────────────────────────────
      switch (activeSection) {
        case "places":
          return (
            <AdminResourceManager
              key="places"
              resourceName="Place"
              icon="📍"
              fields={PLACE_FIELDS}
              columns={PLACE_COLUMNS}
              fetchFn={getPlaces}
              createFn={createPlace}
              updateFn={updatePlace}
              deleteFn={deletePlace}
              toast={toast}
            />
          );
        case "hotels":
          return (
            <AdminResourceManager
              key="hotels"
              resourceName="Hotel"
              icon="🏨"
              fields={HOTEL_FIELDS}
              columns={HOTEL_COLUMNS}
              fetchFn={getHotels}
              createFn={createHotel}
              updateFn={updateHotel}
              deleteFn={deleteHotel}
              toast={toast}
            />
          );
        case "events":
          return (
            <AdminResourceManager
              key="events"
              resourceName="Event"
              icon="🎭"
              fields={EVENT_FIELDS}
              columns={EVENT_COLUMNS}
              fetchFn={getEvents}
              createFn={createEvent}
              updateFn={updateEvent}
              deleteFn={deleteEvent}
              toast={toast}
            />
          );
        default:
          return null;
      }
    } else {
      // ── User browse views ──────────────────────────────────────────
      switch (activeSection) {
        case "places":
          return (
            <UserBrowse
              key="places"
              resourceName="Place"
              icon="📍"
              fetchFn={getPlaces}
              toast={toast}
              renderCard={(item) => (
                <article className="browse-card" key={item._id}>
                  <div className="card-emoji">📍</div>
                  <div className="card-body">
                    <div className="card-badges">
                      <span className="location-badge">{item.location}</span>
                      <span className="category-badge">{item.category}</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="card-meta">
                      <span>💰 Rs. {Number(item.estimatedCost).toLocaleString()}</span>
                      <span>⏱ {item.estimatedDuration}h</span>
                    </div>
                  </div>
                </article>
              )}
            />
          );
        case "hotels":
          return (
            <UserBrowse
              key="hotels"
              resourceName="Hotel"
              icon="🏨"
              fetchFn={getHotels}
              toast={toast}
              renderCard={(item) => (
                <article className="browse-card" key={item._id}>
                  <div className="card-emoji">🏨</div>
                  <div className="card-body">
                    <div className="card-badges">
                      <span className="location-badge">{item.location}</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="card-meta">
                      <span>💰 Rs. {Number(item.pricePerNight).toLocaleString()} / night</span>
                      <span>⭐ {item.rating != null ? item.rating : "New"}</span>
                    </div>
                  </div>
                </article>
              )}
            />
          );
        case "events":
          return (
            <UserBrowse
              key="events"
              resourceName="Event"
              icon="🎭"
              fetchFn={getEvents}
              toast={toast}
              renderCard={(item) => (
                <article className="browse-card" key={item._id}>
                  <div className="card-emoji">🎭</div>
                  <div className="card-body">
                    <div className="card-badges">
                      <span className="location-badge">{item.location}</span>
                      <span className="category-badge">{item.category}</span>
                    </div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="card-meta">
                      <span>📅 {new Date(item.startDate).toLocaleDateString()} – {new Date(item.endDate).toLocaleDateString()}</span>
                      <span>💰 Rs. {Number(item.estimatedCost || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </article>
              )}
            />
          );
        default:
          return null;
      }
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} dismiss={dismissToast} />

      <div className="app-shell">
        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <h1>Roam<span>Lanka</span></h1>
            <small>{isAdmin ? "Admin Dashboard" : "Explorer Dashboard"}</small>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? "active" : ""}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <strong>{user.name}</strong>
                <small>{user.role}</small>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              🚪 Log Out
            </button>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────── */}
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </>
  );
}

export default App;
