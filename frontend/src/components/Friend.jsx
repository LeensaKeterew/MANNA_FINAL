// A single friend/user entry. Two shapes, both taken verbatim from the pages
// they were inlined in:
//   variant="row"  — the conversation row in MessagesPage
//   variant="chip" — the compact friend chip in ProfilePage
export default function Friend({
  user,
  variant = "row",
  active = false,
  lastMessage,
  time,
  unread = 0,
  onClick,
}) {
  if (variant === "chip") {
    return (
      <div className="follower-chip">
        <img src={user.avatar} alt={user.name} />
        <span>{user.name.split(" ")[0]}</span>
      </div>
    );
  }

  return (
    <button className={`friend-row ${active ? "active" : ""}`} onClick={onClick}>
      <img src={user.avatar} alt={user.name} />
      <div className="friend-row-text">
        <strong>{user.name}</strong>
        <span>{lastMessage}</span>
      </div>
      <div className="friend-row-meta">
        <span className="friend-row-time">{time}</span>
        {unread > 0 && <span className="unread-badge">{unread}</span>}
      </div>
    </button>
  );
}
