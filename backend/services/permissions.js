const { forbidden } = require("../utils/errors");

const isAdmin = (user) => user?.role === "admin";
const isOwner = (user, ownerId) => Boolean(user && ownerId && user._id.equals(ownerId));

function assertOwnerOrAdmin(user, ownerId) {
  if (!isOwner(user, ownerId) && !isAdmin(user)) throw forbidden("Only the owner can do that.");
}

module.exports = { isAdmin, isOwner, assertOwnerOrAdmin };
