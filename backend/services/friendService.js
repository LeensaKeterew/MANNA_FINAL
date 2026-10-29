const users = require("../db/users");
const friends = require("../db/friends");
const { badRequest, notFound, conflict } = require("../utils/errors");
const { publicUser, userMap } = require("./presenters");

async function target(id) {
  const user = await users.findById(id);
  if (!user) throw notFound("User not found.");
  return user;
}

async function sendRequest(me, otherId) {
  const other = await target(otherId);
  if (me._id.equals(other._id)) throw badRequest("You cannot add yourself as a friend.");
  const existing = await friends.between(me._id, other._id);
  if (existing) {
    if (existing.status === "accepted") throw conflict("You are already friends.");
    if (existing.requester.equals(me._id)) throw conflict("Friend request already sent.");
    throw conflict("This user already sent you a request. Accept it instead.");
  }
  await friends.request(me._id, other._id);
}

async function accept(me, fromId) {
  const from = await target(fromId);
  if (!(await friends.accept(from._id, me._id))) throw notFound("No pending request from this user.");
}

async function decline(me, fromId) {
  const from = await target(fromId);
  const row = await friends.between(from._id, me._id);
  if (!row || row.status !== "pending" || !row.requester.equals(from._id)) {
    throw notFound("No pending request from this user.");
  }
  await friends.removeBetween(from._id, me._id);
}

// Unfriends, or cancels a request you sent.
async function remove(me, otherId) {
  const other = await target(otherId);
  if (!(await friends.removeBetween(me._id, other._id))) throw notFound("You are not friends with this user.");
}

async function list(me) {
  return (await users.findByIds(await friends.friendIds(me._id))).map(publicUser);
}

async function requests(me) {
  const [inc, out] = await Promise.all([friends.incoming(me._id), friends.outgoing(me._id)]);
  const map = await userMap([...inc.map((r) => r.requester), ...out.map((r) => r.recipient)]);
  return {
    incoming: inc.map((r) => ({ user: publicUser(map[r.requester.toString()]), createdAt: r.createdAt })),
    outgoing: out.map((r) => ({ user: publicUser(map[r.recipient.toString()]), createdAt: r.createdAt })),
  };
}

module.exports = { sendRequest, accept, decline, remove, list, requests };
