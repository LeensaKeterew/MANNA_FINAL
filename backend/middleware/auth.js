const jwt = require("jsonwebtoken");
const users = require("../db/users");
const { unauthorized, forbidden, asyncHandler } = require("../utils/errors");

const COOKIE = "manna_token";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set.");
  return process.env.JWT_SECRET;
};

const signToken = (user) => jwt.sign({ sub: user._id.toString() }, secret(), { expiresIn: "7d" });

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx > -1 && part.slice(0, idx).trim() === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
  };
}

const setAuthCookie = (res, user) =>
  res.cookie(COOKIE, signToken(user), { ...cookieOptions(), maxAge: MAX_AGE_MS });

const clearAuthCookie = (res) => res.clearCookie(COOKIE, cookieOptions());

// Populates req.user (full DB document) when a valid token is present.
const loadUser = asyncHandler(async (req, res, next) => {
  let token = readCookie(req, COOKIE);
  const header = req.headers.authorization;
  if (!token && header && header.startsWith("Bearer ")) token = header.slice(7);
  if (token) {
    try {
      const payload = jwt.verify(token, secret());
      req.user = await users.findById(payload.sub);
    } catch {
      req.user = null;
    }
  }
  next();
});

const requireAuth = (req, res, next) => (req.user ? next() : next(unauthorized()));
const requireAdmin = (req, res, next) => {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== "admin") return next(forbidden("Administrator access required."));
  return next();
};

module.exports = { loadUser, requireAuth, requireAdmin, setAuthCookie, clearAuthCookie };
