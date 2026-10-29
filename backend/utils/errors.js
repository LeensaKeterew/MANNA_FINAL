class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const badRequest = (m) => new HttpError(400, m);
const unauthorized = (m = "Please log in to continue.") => new HttpError(401, m);
const forbidden = (m = "You are not allowed to do that.") => new HttpError(403, m);
const notFound = (m = "Not found.") => new HttpError(404, m);
const conflict = (m) => new HttpError(409, m);

// Express 4 does not catch rejected promises on its own.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict, asyncHandler };
