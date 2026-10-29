import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import "./NavBar.css";

const EMPTY = { posts: [], users: [], albums: [], hashtags: [] };

export default function NavBar() {
  const { user: currentUser, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(EMPTY);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);

  const profilePath = `/profile/${currentUser.id}`;
  const isAdmin = currentUser.role === "admin";

  const tabs = useMemo(() => {
    const base = [
      { label: "Home", path: "/home", match: "/home" },
      { label: "Messages", path: "/messages", match: "/messages" },
      { label: "Profile", path: profilePath, match: "/profile" },
      { label: "Settings", path: "/settings", match: "/settings" },
    ];
    // Admin controls are only offered to administrators.
    if (isAdmin) base.push({ label: "Admin", path: "/admin", match: "/admin" });
    return base;
  }, [profilePath, isAdmin]);

  // Debounced autocomplete over people, posts, albums and hashtags; "See all results" opens /search.
  useEffect(() => {
    const q = query.trim();
    setActiveIndex(-1);
    if (!q) {
      setResults(EMPTY);
      return undefined;
    }
    let live = true;
    const timer = setTimeout(() => {
      api
        .get(`/api/search?q=${encodeURIComponent(q)}`)
        .then((data) => live && setResults({ ...EMPTY, ...data }))
        .catch(() => live && setResults(EMPTY));
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query]);

  const items = useMemo(
    () => [
      ...results.users.map((u) => ({
        key: `u-${u.id}`, path: `/profile/${u.id}`, image: u.avatar, round: true, title: u.name, sub: `@${u.username}`,
      })),
      ...results.albums.map((a) => ({
        key: `a-${a.id}`, path: `/album/${a.id}`, image: a.cover, round: false, title: a.name, sub: `Album by ${a.owner.name}`,
      })),
      ...results.hashtags.map((h) => ({
        key: `h-${h.tag}`, path: `/hashtag/${encodeURIComponent(h.tag.replace(/^#/, ""))}`, image: null, round: false, title: h.tag,
        sub: `${h.count} ${h.count === 1 ? "post" : "posts"}`,
      })),
      ...results.posts.map((p) => ({
        key: `p-${p.id}`, path: `/post/${p.id}`, image: p.image, round: false, title: p.title, sub: `by ${p.author.name}`,
      })),
    ],
    [results]
  );

  // Close the dropdown on outside click.
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const go = (path) => {
    navigate(path);
    setQuery("");
    setIsOpen(false);
  };

  const seeAll = () => go(`/search?q=${encodeURIComponent(query.trim())}`);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!query.trim()) return;
      if (isOpen && activeIndex >= 0 && items[activeIndex]) go(items[activeIndex].path);
      else seeAll();
    } else if (!isOpen || items.length === 0) {
      // nothing to move through
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/home" className="navbar-logo">
        <img src="/logo.png" alt="Manna logo" className="navbar-logo-img" />
        <span>MANNA</span>
      </Link>

      <div className="navbar-search" ref={searchRef}>
        <input
          type="text"
          placeholder="Search recipes, people, albums, #hashtags..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search recipes"
          aria-expanded={isOpen}
          role="combobox"
          aria-autocomplete="list"
        />

        {query && (
          <button
            type="button"
            className="navbar-search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
          >
            &times;
          </button>
        )}

        {isOpen && query && (
          <div className="navbar-search-results" role="listbox">
            {items.length === 0 ? (
              <div className="navbar-search-empty">No results for &ldquo;{query}&rdquo;</div>
            ) : (
              items.map((item, i) => (
                <button
                  key={item.key}
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`navbar-search-item ${i === activeIndex ? "active" : ""}`}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => go(item.path)}
                >
                  {item.image ? (
                    <img src={item.image} alt="" className={`navbar-search-thumb ${item.round ? "round" : ""}`} />
                  ) : (
                    <span className="navbar-search-thumb tag" aria-hidden="true">#</span>
                  )}
                  <div className="navbar-search-item-text">
                    <strong>{item.title}</strong>
                    <span>{item.sub}</span>
                  </div>
                </button>
              ))
            )}
            <button type="button" className="navbar-search-all" onClick={seeAll}>
              See all results for &ldquo;{query.trim()}&rdquo;
            </button>
          </div>
        )}
      </div>

      <nav className="navbar-tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={location.pathname.startsWith(tab.match) ? "active" : ""}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="navbar-actions">
        <ThemeToggle />
        <Link to="/create" className="navbar-add" aria-label="Create post">+</Link>
        <Link to={profilePath}>
          <img src={currentUser.avatar} alt={currentUser.name} className="navbar-avatar" />
        </Link>
        <button type="button" className="navbar-logout" onClick={handleLogout}>Log out</button>
      </div>
    </header>
  );
}
