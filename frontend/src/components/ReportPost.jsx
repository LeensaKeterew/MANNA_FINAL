import { useState } from "react";
import { api } from "../api";
import useFetch from "../hooks/useFetch";

// Report form: choose one of the admin-managed reasons, optionally add details.
export default function ReportPost({ postId }) {
  const [open, setOpen] = useState(false);
  const reasons = useFetch(open ? "/api/report-reasons" : null);
  const [reasonId, setReasonId] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!reasonId) {
      setError("Choose a reason for your report.");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/api/posts/${postId}/report`, { reasonId, details });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) return <p className="album-placeholder-empty">Thanks &mdash; an administrator will review this post.</p>;

  if (!open) {
    return (
      <button type="button" className="btn-secondary report-open" onClick={() => setOpen(true)}>
        Report post
      </button>
    );
  }

  return (
    <form className="report-box" onSubmit={submit}>
      <h4>Report this post</h4>
      {error && <div className="auth-error">{error}</div>}
      {reasons.loading && <p className="status-message">Loading reasons&hellip;</p>}
      {reasons.error && <div className="auth-error">{reasons.error}</div>}
      {reasons.data && (
        <div className="field">
          <label htmlFor="report-reason">Reason</label>
          <select id="report-reason" value={reasonId} onChange={(e) => setReasonId(e.target.value)}>
            <option value="">Select a reason&hellip;</option>
            {reasons.data.reasons.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="field">
        <label htmlFor="report-details">Details (optional)</label>
        <textarea id="report-details" rows={3} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} />
      </div>
      <div className="inline-actions">
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={busy}>Submit report</button>
      </div>
    </form>
  );
}
