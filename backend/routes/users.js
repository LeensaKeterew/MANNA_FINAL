const router = require("express").Router();
const { asyncHandler } = require("../utils/errors");
const { requireAuth, clearAuthCookie } = require("../middleware/auth");
const userService = require("../services/userService");
const { selfUser } = require("../services/presenters");

router.use(requireAuth);

router.get("/me", asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await userService.getProfile(req.user, req.user._id.toString())) });
}));

router.put("/me", asyncHandler(async (req, res) => {
  const updated = await userService.updateUser(req.user, req.body);
  res.json({ ok: true, user: selfUser(updated) });
}));

router.delete("/me", asyncHandler(async (req, res) => {
  await userService.deleteUser(req.user._id);
  clearAuthCookie(res);
  res.json({ ok: true });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await userService.getProfile(req.user, req.params.id)) });
}));

router.get("/:id/posts", asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await userService.listPosts(req.user, req.params.id, req.query)) });
}));

router.get("/:id/albums", asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await userService.listAlbums(req.params.id, req.query)) });
}));

router.get("/:id/friends", asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await userService.listFriends(req.user, req.params.id)) });
}));

module.exports = router;
