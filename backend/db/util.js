const { ObjectId } = require("mongodb");

// Returns an ObjectId, or null when the value is not a valid id.
function oid(value) {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && /^[a-f\d]{24}$/i.test(value)) return new ObjectId(value);
  return null;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { oid, escapeRegex };
