import { useState } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import ThemeToggle from "../components/ThemeToggle";
import "./SplashPage.css";

const VERSE = {
  text: "I am the bread of life. Whoever comes to me will never go hungry, and whoever believes in me will never be thirsty.",
  reference: "John 6:35",
};

const TABS = [
  { id: "login", label: "Log in" },
  { id: "register", label: "Register" },
];

export default function SplashPage() {
  const verse = VERSE;
  const [tab, setTab] = useState("login");

  // Left/Right arrows move between the two tabs (standard tab-list keyboard behaviour).
  const handleTabKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = tab === "login" ? "register" : "login";
    setTab(next);
    document.getElementById(`splash-tab-${next}`)?.focus();
  };

  return (
    <div className="splash-page">
      <ThemeToggle className="theme-toggle-floating" />
      <div className="splash-content">
        <div className="splash-fade splash-fade-1 splash-brand">
          <div className="splash-logo">
            <img src="/logo.png" alt="Manna logo" />
          </div>

          <h1 className="splash-title">MANNA</h1>
          <div className="splash-divider" />
        </div>

        <blockquote className="splash-verse splash-fade splash-fade-2">
          &ldquo;{verse.text}&rdquo;
          <span className="splash-verse-ref">{verse.reference}</span>
        </blockquote>

        <div className="splash-columns">
          <section className="splash-about splash-fade splash-fade-3">
            <h2>What is MANNA?</h2>
            <p>
              MANNA is a faith and food community where you share the meals that nourish you, along
              with the stories and scripture behind them. Post photos, collect them into albums,
              connect with friends and encourage one another. Log in to pick up where you left off,
              or register to join in.
            </p>
          </section>

          <div className="splash-panel splash-fade splash-fade-4">
            <div className="splash-tabs" role="tablist" aria-label="Log in or register" onKeyDown={handleTabKeyDown}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`splash-tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls="splash-tabpanel"
                  tabIndex={tab === t.id ? 0 : -1}
                  className="splash-tab"
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div role="tabpanel" id="splash-tabpanel" aria-labelledby={`splash-tab-${tab}`}>
              {tab === "login" ? <LoginForm /> : <RegisterForm />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}