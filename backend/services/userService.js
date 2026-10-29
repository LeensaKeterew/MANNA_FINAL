const bcrypt = require("bcryptjs");
const users = require("../db/users");
const posts = require("../db/posts");
const albums = require("../db/albums");
const friends = require("../db/friends");
const { oid } = require("../db/util");
const v = require("../utils/validate");
const { badRequest, unauthorized, notFound, conflict } = require("../utils/errors");
const { DEFAULT_AVATAR, publicUser, profileUser, selfUser, presentPosts, presentAlbums } = require("./presenters");
const cascade = require("./cascade");

// The project spec asks for plain-text passwords so markers can read and test them.
// Accounts created before that change still hold a bcrypt hash; they keep working and are
// upgraded to plain text the first time their owner signs in.
async function checkPassword(user, plain) {
  if (typeof user.password === "string") return user.password === plain;
  if (user.passwordHash) return bcrypt.compare(plain, user.passwordHash);
  return false;
}

async function signUp(body = {}) {
  const username = v.username(body.username);
  const email = v.email(body.email);
  const password = v.password(body.password);
  if (body.confirmPassword !== undefined && body.confirmPassword !== password) {
    throw badRequest("Passwords do not match.");
  }
  if (await users.findByUsername(username)) throw conflict("That username is already taken.");
  if (await users.findByEmail(email)) throw conflict("An account with that email already exists.");
  try {
    return await users.create({ username, email, password });
  } catch (err) {
    if (err.code === 11000) throw conflict("That username or email is already in use.");
    throw err;
  }
}

async function signIn(body = {}) {
  const identifier = v.text(body.identifier, { field: "Username or email", required: true, max: 254 });
  if (typeof body.password !== "string" || !body.password) throw badRequest("Password is required.");
  const user = await users.findByLogin(identifier);
  const ok = user && (await checkPassword(user, body.password));
  if (!ok) throw unauthorized("Invalid username/email or password.");
  if (typeof user.password !== "string") await users.updateById(user._id, { password: body.password });
  return user;
}

async function friendshipStatus(viewer, otherId) {
  if (viewer._id.equals(otherId)) return "self";
  const row = await friends.between(viewer._id, otherId);
  if (!row) return "none";
  if (row.status === "accepted") return "friends";
  return row.requester.equals(viewer._id) ? "outgoing" : "incoming";
}

// Everyone may see a name and picture. The bio, friend count and friends list are only for
// the owner, their friends and administrators.
const canSeePrivate = (viewer, status) => status === "self" || status === "friends" || viewer.role === "admin";

async function getProfile(viewer, id) {
  const user = await users.findById(id);
  if (!user) throw notFound("User not found.");
  const [postCount, friendList, status] = await Promise.all([
    posts.countByAuthor(user._id),
    friends.friendIds(user._id),
    friendshipStatus(viewer, user._id),
  ]);
  const full = canSeePrivate(viewer, status);
  let base = publicUser(user);
  if (viewer._id.equals(user._id) || viewer.role === "admin") base = selfUser(user);
  else if (full) base = profileUser(user);
  return {
    user: { ...base, postCount, friendCount: full ? friendList.length : null },
    friendship: status,
    restricted: !full,
  };
}

// Validates the editable profile fields and returns only those that were supplied.
async function buildUpdate(current, body = {}, { allowRole = false } = {}) {
  const fields = {};
  if (body.name !== undefined) fields.name = v.text(body.name, { field: "Name", required: true, max: 60 });
  if (body.bio !== undefined) fields.bio = v.text(body.bio, { field: "Bio", max: 300 });
  if (body.pronouns !== undefined) fields.pronouns = v.text(body.pronouns, { field: "Pronouns", max: 30 });
  if (body.socialLinks !== undefined) fields.socialLinks = v.links(body.socialLinks);
  if (body.avatar !== undefined) {
    // The built-in placeholder is not stored; an empty value means "use the default".
    fields.avatar = body.avatar === DEFAULT_AVATAR ? "" : v.imageRef(body.avatar, { field: "Avatar" });
  }
  if (body.username !== undefined) {
    const username = v.username(body.username);
    if (username.toLowerCase() !== current.usernameLower) {
      if (await users.findByUsername(username)) throw conflict("That username is already taken.");
      fields.username = username;
      fields.usernameLower = username.toLowerCase();
    }
  }
  if (body.email !== undefined) {
    const email = v.email(body.email);
    if (email !== current.email) {
      if (await users.findByEmail(email)) throw conflict("An account with that email already exists.");
      fields.email = email;
    }
  }
  if (body.newPassword) {
    // Users must prove they know the current password; admins editing someone else's account are exempt.
    if (!allowRole) {
      if (typeof body.currentPassword !== "string" || !body.currentPassword) {
        throw badRequest("Enter your current password to set a new one.");
      }
      if (!(await checkPassword(current, body.currentPassword))) {
        throw badRequest("Your current password is incorrect.");
      }
    }
    const pw = v.password(body.newPassword, "New password");
    if (body.confirmPassword !== undefined && body.confirmPassword !== pw) throw badRequest("Passwords do not match.");
    fields.password = pw;
  }
  if (body.settings !== undefined) {
    if (typeof body.settings !== "object" || body.settings === null || Array.isArray(body.settings)) {
      throw badRequest("Settings must be an object.");
    }
    const merged = { ...users.DEFAULT_SETTINGS, ...(current.settings || {}) };
    for (const [key, val] of Object.entries(body.settings)) {
      if (!(key in users.DEFAULT_SETTINGS)) throw badRequest(`Unknown setting "${key}".`);
      if (typeof val !== "boolean") throw badRequest(`Setting "${key}" must be true or false.`);
      merged[key] = val;
    }
    fields.settings = merged;
  }
  if (allowRole && body.role !== undefined) {
    if (!["user", "admin"].includes(body.role)) throw badRequest("Role must be user or admin.");
    fields.role = body.role;
  }
  return fields;
}

async function updateUser(current, body, opts) {
  const fields = await buildUpdate(current, body, opts);
  if (!Object.keys(fields).length) throw badRequest("Nothing to update.");
  try {
    return await users.updateById(current._id, fields);
  } catch (err) {
    if (err.code === 11000) throw conflict("That username or email is already in use.");
    throw err;
  }
}

const deleteUser = (userId) => cascade.deleteUser(userId);

// ?page=1&limit=12 -> { limit, skip }. limit is capped at 200.
function pageArgs({ page, limit } = {}) {
  const l = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 200);
  const pg = Math.max(parseInt(page, 10) || 1, 1);
  return { limit: l, skip: (pg - 1) * l };
}

async function listPosts(viewer, id, query = {}) {
  const _id = oid(id);
  if (!_id || !(await users.findById(_id))) throw notFound("User not found.");
  const { limit, skip } = pageArgs(query);
  const [rows, total] = await Promise.all([posts.list({ authorIds: [_id], limit, skip }), posts.countByAuthor(_id)]);
  return { posts: await presentPosts(rows, viewer), total, hasMore: skip + rows.length < total };
}

async function listAlbums(id, query = {}) {
  const _id = oid(id);
  if (!_id || !(await users.findById(_id))) throw notFound("User not found.");
  const { limit, skip } = pageArgs(query);
  const [rows, total] = await Promise.all([albums.listByOwner(_id, { skip, limit }), albums.countByOwner(_id)]);
  return { albums: await presentAlbums(rows), total, hasMore: skip + rows.length < total };
}

async function listFriends(viewer, id) {
  const _id = oid(id);
  if (!_id || !(await users.findById(_id))) throw notFound("User not found.");
  if (!canSeePrivate(viewer, await friendshipStatus(viewer, _id))) return { friends: [], restricted: true };
  const rows = await users.findByIds(await friends.friendIds(_id));
  return { friends: rows.map(publicUser), restricted: false };
}

module.exports = {
  signUp, signIn, getProfile, updateUser, deleteUser, listPosts, listAlbums, listFriends, friendshipStatus,
};
