import { Link } from "react-router-dom";

// A hashtag that opens the hashtag results page (/hashtag/<name>).
export default function Hashtag({ tag }) {
  return (
    <Link to={`/hashtag/${encodeURIComponent(tag.replace(/^#/, ""))}`} className="hashtag-pill">
      {tag}
    </Link>
  );
}
