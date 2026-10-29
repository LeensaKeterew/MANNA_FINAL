// Thin wrapper around the native Fetch API. Every call uses a relative /api/...
// route and sends the httpOnly login cookie automatically.

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

async function request(method, url, body) {
  // X-Soft-Errors: the API answers failures as { ok:false, message, status } with HTTP 200,
  // so handled errors (wrong password, validation...) never show up as red console errors.
  const options = { method, credentials: "same-origin", headers: { "X-Soft-Errors": "1" } };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || data?.ok === false) {
    throw new ApiError(data?.message || `Request failed (${res.status}).`, data?.status || res.status);
  }
  return data;
}

async function upload(file) {
  const form = new FormData();
  form.append("image", file);
  let res;
  try {
    res = await fetch("/api/uploads", {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-Soft-Errors": "1" },
      body: form,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.ok === false) {
    throw new ApiError(data?.message || "Image upload failed.", data?.status || res.status);
  }
  return data.url;
}

export const api = {
  get: (url) => request("GET", url),
  post: (url, body = {}) => request("POST", url, body),
  put: (url, body = {}) => request("PUT", url, body),
  del: (url) => request("DELETE", url),
  upload,
};
