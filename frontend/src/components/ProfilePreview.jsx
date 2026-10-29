import { Link } from "react-router-dom";
import Friend from "./Friend";

// Compact profile preview (avatar + first name) linking to that user's profile.
export default function ProfilePreview({ user }) {
  return (
    <Link to={`/profile/${user.id}`}>
      <Friend user={user} variant="chip" />
    </Link>
  );
}
