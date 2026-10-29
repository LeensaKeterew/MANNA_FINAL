import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../pages/AuthPage.css";

// Registration form shown on the splash page. Registering logs the user in
// automatically (spec), so on success we go straight to /home.
export default function RegisterForm() {
  const { signUp } = useAuth();
  const [fields, setFields] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const update = (key) => (e) => {
    const { value } = e.target;
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signUp(fields);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <p className="auth-subtitle">Join Manna today and grow in faith and fullness to the tummy and soul</p>

      {error && <div className="auth-error" role="alert">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="register-username">Username</label>
          <input id="register-username" type="text" value={fields.username} onChange={update("username")} required />
        </div>

        <div className="field">
          <label htmlFor="register-email">Email</label>
          <input id="register-email" type="email" value={fields.email} onChange={update("email")} required />
        </div>

        <div className="field">
          <label htmlFor="register-password">Password</label>
          <input id="register-password" type="password" value={fields.password} onChange={update("password")} required />
        </div>

        <div className="field">
          <label htmlFor="register-confirm-password">Confirm Password</label>
          <input
            id="register-confirm-password"
            type="password"
            value={fields.confirmPassword}
            onChange={update("confirmPassword")}
            required
          />
        </div>

        <button type="submit" className="btn-primary">Register</button>
      </form>
    </>
  );
}
