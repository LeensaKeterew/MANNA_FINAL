import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import EditProfile from "../components/EditProfile";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import "./SettingsPage.css";

const PRIVACY_LABELS = [
  { key: "privateAccount", label: "Private account (only followers can see your posts)" },
  { key: "showLocation", label: "Show my location on local feed" },
  { key: "allowTagging", label: "Allow others to tag me in posts" },
  { key: "showEmail", label: "Show my email to followers" },
  { key: "notifyComments", label: "Receive notifications for new comments" },
  { key: "notifyFollowers", label: "Receive notifications for new followers" },
];

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const saveAccount = async (fields) => {
    const data = await api.put("/api/users/me", fields);
    setUser(data.user);
  };

  const togglePrivacy = async (key) => {
    setError("");
    try {
      const data = await api.put("/api/users/me", { settings: { [key]: !user.settings[key] } });
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete your account? Your posts, albums, comments and friendships will be removed permanently.")) {
      return;
    }
    setError("");
    try {
      await api.del("/api/users/me");
      setUser(null);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app-shell">
      <NavBar />
      <div className="app-body">
        <main className="settings-main">
          <h1>Settings</h1>

          {error && <div className="auth-error">{error}</div>}

          <EditProfile key={user.id} user={user} onSave={saveAccount} />

          <div className="settings-card">
            <h4>Privacy Settings</h4>
            {PRIVACY_LABELS.map((p) => {
              const on = Boolean(user.settings[p.key]);
              return (
                <div className="privacy-row" key={p.key}>
                  <span>{p.label}</span>
                  <button
                    type="button"
                    className={`toggle ${on ? "on" : ""}`}
                    onClick={() => togglePrivacy(p.key)}
                    aria-pressed={on}
                    aria-label={p.label}
                  >
                    <span className="knob" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="settings-card danger-zone">
            <h4>Danger Zone</h4>
            <p>Deleting your account permanently removes your profile, posts, albums, comments and friendships.</p>
            <button type="button" className="btn-danger" onClick={deleteAccount}>Delete Account</button>
          </div>
        </main>
      </div>
    </div>
  );
}
