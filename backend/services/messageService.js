const messages = require("../db/messages");
const friends = require("../db/friends");
const users = require("../db/users");
const v = require("../utils/validate");
const { forbidden, notFound } = require("../utils/errors");
const { publicUser } = require("./presenters");

async function friendOrThrow(me, otherId) {
  const other = await users.findById(otherId);
  if (!other) throw notFound("User not found.");
  const row = await friends.between(me._id, other._id);
  if (!row || row.status !== "accepted") throw forbidden("You can only message your friends.");
  return other;
}

const present = (m, me) => ({
  id: m._id.toString(),
  fromMe: m.fromId.equals(me._id),
  text: m.text,
  createdAt: m.createdAt,
});

async function conversations(me) {
  const friendList = await users.findByIds(await friends.friendIds(me._id));
  const rows = await Promise.all(
    friendList.map(async (f) => {
      const last = await messages.lastBetween(me._id, f._id);
      return { friend: publicUser(f), lastMessage: last ? last.text : "", lastAt: last ? last.createdAt : null };
    })
  );
  return rows.sort((a, b) => (b.lastAt ? +new Date(b.lastAt) : 0) - (a.lastAt ? +new Date(a.lastAt) : 0));
}

async function thread(me, otherId) {
  const other = await friendOrThrow(me, otherId);
  return (await messages.thread(me._id, other._id)).map((m) => present(m, me));
}

async function send(me, otherId, body = {}) {
  const other = await friendOrThrow(me, otherId);
  const text = v.text(body.text, { field: "Message", required: true, max: 1000 });
  return present(await messages.create({ fromId: me._id, toId: other._id, text }), me);
}

module.exports = { conversations, thread, send };
