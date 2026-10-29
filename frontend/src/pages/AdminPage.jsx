import { useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import useFetch from "../hooks/useFetch";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/time";
import "./AdminPage.css";

const TABS = [
  ["users", "Users"],
  ["posts", "Posts"],
  ["albums", "Albums"],
  ["activity", "Activity"],
  ["reports", "Reports"],
  ["reasons", "Report reasons"],
];

// Shared loading / error / refresh handling for every tab.
function Panel({ req, error, children }) {
  return (
    <>
      {error && <div className="auth-error">{error}</div>}
      {req.loading && <p className="status-message">Loading&hellip;</p>}
      {req.error && <div className="auth-error">{req.error}</div>}
      {req.data && children}
    </>
  );
}

function useAction(reload) {
  const [error, setError] = useState("");
  const run = async (fn, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError("");
    try {
      await fn();
      reload();
    } catch (err) {
      setError(err.message);
    }
  };
  return { error, run };
}

function UsersTab() {
  const { user: me } = useAuth();
  const req = useFetch("/api/admin/users");
  const { error, run } = useAction(req.reload);
  const [editing, setEditing] = useState(null);

  const save = (e) => {
    e.preventDefault();
    const { id, name, username, email, bio, role } = editing;
    run(async () => {
      await api.put(`/api/admin/users/${id}`, { name, username, email, bio, role });
      setEditing(null);
    });
  };
  const set = (key) => (e) => setEditing({ ...editing, [key]: e.target.value });

  return (
    <Panel req={req} error={error}>
      {req.data?.users.map((u) =>
        editing?.id === u.id ? (
          <form className="admin-edit-form" key={u.id} onSubmit={save}>
            <div className="field"><label>Name</label><input value={editing.name} onChange={set("name")} /></div>
            <div className="field"><label>Username</label><input value={editing.username} onChange={set("username")} /></div>
            <div className="field"><label>Email</label><input type="email" value={editing.email} onChange={set("email")} /></div>
            <div className="field"><label>Bio</label><textarea rows={2} value={editing.bio} onChange={set("bio")} /></div>
            <div className="field">
              <label>Role</label>
              <select value={editing.role} onChange={set("role")}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="inline-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        ) : (
          <div className="admin-row" key={u.id}>
            <img src={u.avatar} alt={u.name} />
            <div className="admin-row-text">
              <strong><Link to={`/profile/${u.id}`}>{u.name}</Link></strong>
              <span>@{u.username} &middot; {u.email}</span>
              {u.role === "admin" && <span className="admin-badge">admin</span>}
            </div>
            <button type="button" className="btn-secondary" onClick={() => setEditing({ ...u })}>Edit</button>
            {u.id !== me.id && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => run(() => api.del(`/api/admin/users/${u.id}`), `Delete ${u.name} and everything they posted?`)}
              >
                Delete
              </button>
            )}
          </div>
        )
      )}
    </Panel>
  );
}

function PostsTab() {
  const req = useFetch("/api/admin/posts");
  const { error, run } = useAction(req.reload);
  return (
    <Panel req={req} error={error}>
      {req.data?.posts.length === 0 && <p className="empty-state">No posts.</p>}
      {req.data?.posts.map((p) => (
        <div className="admin-row" key={p.id}>
          <img className="square" src={p.image} alt="" />
          <div className="admin-row-text">
            <strong>{p.title}</strong>
            <span>by {p.author.name} &middot; {p.date}</span>
          </div>
          <Link to={`/post/${p.id}`} className="btn-secondary">View / Edit</Link>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => run(() => api.del(`/api/posts/${p.id}`), `Delete "${p.title}" and its comments?`)}
          >
            Delete
          </button>
        </div>
      ))}
    </Panel>
  );
}

function AlbumsTab() {
  const req = useFetch("/api/admin/albums");
  const { error, run } = useAction(req.reload);
  return (
    <Panel req={req} error={error}>
      {req.data?.albums.length === 0 && <p className="empty-state">No albums.</p>}
      {req.data?.albums.map((a) => (
        <div className="admin-row" key={a.id}>
          <img className="square" src={a.cover} alt="" />
          <div className="admin-row-text">
            <strong>{a.name}</strong>
            <span>by {a.owner.name} &middot; {a.postCount} posts</span>
          </div>
          <Link to={`/album/${a.id}`} className="btn-secondary">View / Edit</Link>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => run(() => api.del(`/api/albums/${a.id}`), `Delete album "${a.name}"?`)}
          >
            Delete
          </button>
        </div>
      ))}
    </Panel>
  );
}

function ActivityTab() {
  const req = useFetch("/api/admin/activity");
  const { error, run } = useAction(req.reload);
  return (
    <Panel req={req} error={error}>
      {req.data?.activity.length === 0 && <p className="empty-state">No activity yet.</p>}
      {req.data?.activity.map((a) => (
        <div className="admin-row" key={`${a.type}-${a.id}`}>
          <img src={a.actor.avatar} alt={a.actor.name} />
          <div className="admin-row-text">
            <span className="admin-badge">{a.type}</span>
            <strong>{a.summary}</strong>
            <span>{a.actor.name} &middot; {timeAgo(a.createdAt)}</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => run(() => api.del(`/api/${a.type}s/${a.id}`), `Delete this ${a.type}?`)}
          >
            Delete
          </button>
        </div>
      ))}
    </Panel>
  );
}

function ReportsTab() {
  const [status, setStatus] = useState("open");
  const req = useFetch(`/api/admin/reports/grouped?status=${status}`);
  const { error, run } = useAction(req.reload);
  return (
    <>
      <div className="inline-actions admin-toolbar">
        <button type="button" className={`btn-secondary ${status === "open" ? "active" : ""}`} onClick={() => setStatus("open")}>
          Open
        </button>
        <button type="button" className={`btn-secondary ${status === "resolved" ? "active" : ""}`} onClick={() => setStatus("resolved")}>
          Resolved
        </button>
      </div>
      <Panel req={req} error={error}>
        {req.data?.groups.length === 0 && <p className="empty-state">No {status} reports.</p>}
        {req.data?.groups.map((g) => (
          <div className="report-group" key={g.post?.id || g.reports[0].id}>
            <div className="admin-row">
              <img className="square" src={g.post?.image || "/logo.png"} alt="" />
              <div className="admin-row-text">
                <strong>{g.post ? <Link to={`/post/${g.post.id}`}>{g.post.title}</Link> : "Post already deleted"}</strong>
                <span>
                  {g.count} {g.count === 1 ? "report" : "reports"}
                  {status === "open" && g.openCount > 2 ? " \u00b7 hidden behind a warning in feeds" : ""} &middot; latest {timeAgo(g.latestAt)}
                </span>
                <span>Reasons: {g.reasons.map((r) => `${r.name} (${r.count})`).join(", ")}</span>
              </div>
              {g.post && g.openCount > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => run(() => api.post(`/api/admin/reports/post/${g.post.id}/resolve`, {}))}
                >
                  Resolve all
                </button>
              )}
              {g.post && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => run(() => api.del(`/api/posts/${g.post.id}`), `Delete "${g.post.title}"?`)}
                >
                  Delete post
                </button>
              )}
            </div>
            <ul className="report-list">
              {g.reports.map((r) => (
                <li key={r.id}>
                  <strong>{r.reason?.name || "Unknown reason"}</strong> &middot; {r.reporter.name} &middot; {timeAgo(r.createdAt)}
                  {r.status === "resolved" && " \u00b7 resolved"}
                  {r.details && <> &mdash; &ldquo;{r.details}&rdquo;</>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Panel>
    </>
  );
}

function ReasonsTab() {
  const req = useFetch("/api/report-reasons");
  const { error, run } = useAction(req.reload);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post("/api/admin/report-reasons", { name, description });
      setName("");
      setDescription("");
    });
  };

  return (
    <>
      <form className="admin-add-form" onSubmit={add}>
        <div className="field">
          <label htmlFor="reason-name">New reason</label>
          <input id="reason-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="reason-description">Description (optional)</label>
          <input id="reason-description" value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div><button type="submit" className="btn-primary">Add reason</button></div>
      </form>
      <Panel req={req} error={error}>
        {req.data?.reasons.map((r) => (
          <div className="admin-row" key={r.id}>
            <div className="admin-row-text">
              <strong>{r.name}</strong>
              {r.description && <span>{r.description}</span>}
            </div>
          </div>
        ))}
      </Panel>
    </>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState("users");
  return (
    <div className="app-shell">
      <NavBar />
      <div className="app-body">
        <main className="admin-main">
          <h1>Admin</h1>
          <p className="admin-subtitle">Manage accounts, posts, albums, activity and reports.</p>
          <div className="admin-tabs">
            {TABS.map(([key, label]) => (
              <button key={key} type="button" className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>
          {tab === "users" && <UsersTab />}
          {tab === "posts" && <PostsTab />}
          {tab === "albums" && <AlbumsTab />}
          {tab === "activity" && <ActivityTab />}
          {tab === "reports" && <ReportsTab />}
          {tab === "reasons" && <ReasonsTab />}
        </main>
      </div>
    </div>
  );
}
