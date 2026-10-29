const { badRequest } = require("./errors");

function text(value, { field, min = 0, max = 1000, required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) throw badRequest(`${field} is required.`);
    return "";
  }
  if (typeof value !== "string") throw badRequest(`${field} must be text.`);
  const v = value.trim();
  if (required && !v) throw badRequest(`${field} is required.`);
  if (v && v.length < min) throw badRequest(`${field} must be at least ${min} characters.`);
  if (v.length > max) throw badRequest(`${field} must be at most ${max} characters.`);
  return v;
}

function hashtags(input) {
  if (input === undefined || input === null) return [];
  const raw = Array.isArray(input) ? input : typeof input === "string" ? input.split(/[\s,]+/) : null;
  if (!raw) throw badRequest("Hashtags must be a list or text.");
  const out = [];
  const seen = new Set();
  for (const item of raw) {
    if (typeof item !== "string") throw badRequest("Hashtags must be text.");
    let tag = item.trim();
    if (!tag) continue;
    if (!tag.startsWith("#")) tag = `#${tag}`;
    if (!/^#[\p{L}\p{N}_]{1,40}$/u.test(tag)) throw badRequest(`"${tag}" is not a valid hashtag.`);
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  if (out.length > 15) throw badRequest("Use at most 15 hashtags.");
  return out;
}

// Accepts an uploaded file path (/uploads/...) or an http(s) URL.
function imageRef(value, { field = "Image", required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) throw badRequest(`${field} is required.`);
    return "";
  }
  if (typeof value !== "string") throw badRequest(`${field} must be a link or an uploaded file.`);
  const v = value.trim();
  const ok = /^\/uploads\/[\w.-]+$/.test(v) || (/^https?:\/\/\S+$/i.test(v) && v.length <= 2000);
  if (!ok) throw badRequest(`${field} must be an uploaded file or a valid http(s) link.`);
  return v;
}

const USERNAME_RX = /^[A-Za-z0-9_.]{3,30}$/;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function username(value) {
  const v = text(value, { field: "Username", required: true });
  if (!USERNAME_RX.test(v)) {
    throw badRequest("Username must be 3-30 characters: letters, numbers, dots or underscores.");
  }
  return v;
}

function email(value) {
  const v = text(value, { field: "Email", required: true, max: 254 });
  if (!EMAIL_RX.test(v)) throw badRequest("Enter a valid email address.");
  return v.toLowerCase();
}

function password(value, field = "Password") {
  if (typeof value !== "string" || value.length === 0) throw badRequest(`${field} is required.`);
  if (value.length < 8) throw badRequest(`${field} must be at least 8 characters.`);
  if (value.length > 128) throw badRequest(`${field} must be at most 128 characters.`);
  return value;
}

// Social links: a list (or one link per line). "site.com/me" is accepted and stored as https://site.com/me.
function links(input, { max = 4 } = {}) {
  if (input === undefined || input === null) return [];
  const raw = Array.isArray(input) ? input : typeof input === "string" ? input.split(/\r?\n/) : null;
  if (!raw) throw badRequest("Social links must be a list.");
  const out = [];
  for (const item of raw) {
    if (typeof item !== "string") throw badRequest("Social links must be text.");
    let s = item.trim();
    if (!s) continue;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`;
    let url;
    try {
      url = new URL(s);
    } catch {
      throw badRequest(`"${item.trim()}" is not a valid link.`);
    }
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".") || s.length > 200) {
      throw badRequest(`"${item.trim()}" is not a valid link.`);
    }
    if (!out.includes(url.href)) out.push(url.href);
  }
  if (out.length > max) throw badRequest(`Add at most ${max} social links.`);
  return out;
}

module.exports = { text, hashtags, imageRef, username, email, password, links };
