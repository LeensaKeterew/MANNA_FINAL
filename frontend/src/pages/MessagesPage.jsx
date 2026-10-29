import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import Friend from "../components/Friend";
import useFetch from "../hooks/useFetch";
import { api } from "../api";
import { clock, timeAgo } from "../utils/time";
import "./MessagesPage.css";

export default function MessagesPage() {
  const convoReq = useFetch("/api/messages");
  const conversations = convoReq.data?.conversations || [];
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState("");

  const selectedId = activeId || conversations[0]?.friend.id || null;
  const active = conversations.find((c) => c.friend.id === selectedId);
  const friend = active?.friend;

  const threadReq = useFetch(selectedId ? `/api/messages/${selectedId}` : null);
  const thread = threadReq.data?.messages || [];

  // Keep the newest message in view.
  useEffect(() => {
    const el = document.querySelector(".chat-thread");
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length, selectedId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !selectedId) return;
    setSendError("");
    try {
      const data = await api.post(`/api/messages/${selectedId}`, { text: draft.trim() });
      threadReq.setData((d) => ({ ...d, messages: [...(d?.messages || []), data.message] }));
      convoReq.setData((d) => ({
        ...d,
        conversations: d.conversations.map((c) =>
          c.friend.id === selectedId ? { ...c, lastMessage: data.message.text, lastAt: data.message.createdAt } : c
        ),
      }));
      setDraft("");
    } catch (err) {
      setSendError(err.message);
    }
  };

  return (
    <div className="app-shell message-shell">
      <NavBar />
      <div className="app-body messages-body">
        <aside className="friends-panel">
          <h2>Friends</h2>
          {convoReq.loading && <p className="status-message">Loading&hellip;</p>}
          {convoReq.error && <div className="auth-error">{convoReq.error}</div>}
          {convoReq.data && conversations.length === 0 && (
            <p className="empty-state">Add friends from their profiles to start chatting.</p>
          )}
          {conversations.map((c) => (
            <Friend
              key={c.friend.id}
              user={c.friend}
              active={c.friend.id === selectedId}
              lastMessage={c.lastMessage || "Say hello"}
              time={c.lastAt ? timeAgo(c.lastAt) : ""}
              onClick={() => setActiveId(c.friend.id)}
            />
          ))}
        </aside>

        <section className="chat-panel">
          {friend && (
            <>
              <div className="chat-header">
                <img src={friend.avatar} alt={friend.name} />
                <div>
                  <strong>{friend.name}</strong>
                  <span className="chat-status">@{friend.username}</span>
                </div>
              </div>

              <div className="chat-thread">
                {threadReq.loading && <p className="status-message">Loading messages&hellip;</p>}
                {threadReq.error && <div className="auth-error">{threadReq.error}</div>}
                {threadReq.data && thread.length === 0 && <p className="empty-state">No messages yet.</p>}
                {thread.map((m) => (
                  <div key={m.id} className={`bubble-row ${m.fromMe ? "mine" : "theirs"}`}>
                    <div className="bubble">
                      <p>{m.text}</p>
                      <span>{clock(m.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {sendError && <div className="auth-error">{sendError}</div>}
              <form className="chat-input" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  maxLength={1000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" aria-label="Send">&rarr;</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
