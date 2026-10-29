const users = require("../db/users");
const posts = require("../db/posts");
const albums = require("../db/albums");
const comments = require("../db/comments");
const reports = require("../db/reports");
const friends = require("../db/friends");
const messages = require("../db/messages");
const activities = require("../db/activities");
const albumService = require("./albumService");

// Delete every album that would be left empty because the given posts are going away
// (albums whose only post is one of them), using the normal album-delete service so
// the album's activity entries are cleaned up too. Albums that were already empty
// are left alone, and albums with other posts just lose the post later via pullPostFromAll.
async function deleteAlbumsEmptiedBy(postIds) {
  const emptied = await albums.findOnlyContaining(postIds);
  for (const album of emptied) await albumService.destroy(album);
}

// Deleting a post removes everything that hangs off it.
async function deletePost(postId) {
  await deleteAlbumsEmptiedBy([postId]);
  await Promise.all([comments.deleteByPost(postId), reports.deleteByPost(postId), albums.pullPostFromAll(postId), activities.removePost(postId)]);
  return posts.deleteById(postId);
}

// Deleting a user removes their posts, albums, comments, reports, likes, friendships and messages.
async function deleteUser(userId) {
  const postIds = await posts.idsByAuthor(userId);
  await deleteAlbumsEmptiedBy(postIds);
  await Promise.all([
    comments.deleteByPosts(postIds),
    reports.deleteByPosts(postIds),
    ...postIds.map((id) => albums.pullPostFromAll(id)),
  ]);
  await activities.removePosts(postIds);
  await posts.deleteByAuthor(userId);
  await Promise.all([
    albums.deleteByOwner(userId),
    activities.removeByActor(userId),
    comments.deleteByAuthor(userId),
    reports.deleteByReporter(userId),
    posts.pullLikesBy(userId),
    friends.deleteAllFor(userId),
    messages.deleteAllFor(userId),
  ]);
  return users.deleteById(userId);
}

module.exports = { deletePost, deleteUser };
