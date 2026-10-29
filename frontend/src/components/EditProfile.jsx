import { useRef, useState } from "react";
import { api } from "../api";

// Account-editing form. Saves through PUT /api/users/me (via onSave).
export default function EditProfile({ user, onSave }) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [bio, setBio] = useState(user.bio || "");
  const [pronouns, setPronouns] = useState(user.pronouns || "");
  const [links, setLinks] = useState((user.socialLinks || []).join("\n"));
  const [avatar, setAvatar] = useState(user.avatar);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const handlePicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      setAvatar(await api.upload(file));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword && !currentPassword) {
      setError("Enter your current password to set a new one.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const body = { name, username, email, bio, avatar, pronouns, socialLinks: links.split("\n") };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
        body.confirmPassword = confirmPassword;
      }
      await onSave?.(body);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Your changes have been saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="settings-card" onSubmit={handleSave}>
      <h4>Account</h4>
      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}
      <div className="account-row">
        <div className="account-avatar">
          <img src={avatar} alt={user.name} />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            hidden
            onChange={handlePicture}
          />
          <button type="button" className="change-picture-btn" onClick={() => fileRef.current?.click()}>
            Change picture
          </button>
        </div>

        <div className="account-fields">
          <div className="field">
            <label htmlFor="name">Display name</label>
            <input id="name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" rows={3} maxLength={300} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pronouns">Pronouns</label>
            <input id="pronouns" value={pronouns} maxLength={30} placeholder="e.g. she/her" onChange={(e) => setPronouns(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="socialLinks">Social links (one per line, up to 4)</label>
            <textarea
              id="socialLinks"
              rows={3}
              placeholder={"instagram.com/yourname\nhttps://example.com"}
              value={links}
              onChange={(e) => setLinks(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <button type="submit" className="btn-secondary save-btn" disabled={busy}>Save Changes</button>
    </form>
  );
}
