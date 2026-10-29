const router = require("express").Router();
const { asyncHandler, badRequest } = require("../utils/errors");
const { requireAdmin } = require("../middleware/auth");
const adminService = require("../services/adminService");
const reportService = require("../services/reportService");

router.use(requireAdmin);

router.get("/users", asyncHandler(async (req, res) => {
  res.json({ ok: true, users: await adminService.listUsers() });
}));

router.put("/users/:id", asyncHandler(async (req, res) => {
  res.json({ ok: true, user: await adminService.updateUser(req.user, req.params.id, req.body) });
}));

router.delete("/users/:id", asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.user, req.params.id);
  res.json({ ok: true });
}));

router.get("/posts", asyncHandler(async (req, res) => {
  res.json({ ok: true, posts: await adminService.listPosts(req.user) });
}));

router.get("/albums", asyncHandler(async (req, res) => {
  res.json({ ok: true, albums: await adminService.listAlbums() });
}));

router.get("/comments", asyncHandler(async (req, res) => {
  res.json({ ok: true, comments: await adminService.listComments() });
}));

router.get("/activity", asyncHandler(async (req, res) => {
  res.json({ ok: true, activity: await adminService.activity() });
}));

router.get("/reports", asyncHandler(async (req, res) => {
  res.json({ ok: true, reports: await reportService.list(req.query.status) });
}));

router.get("/reports/grouped", asyncHandler(async (req, res) => {
  const status = req.query.status;
  if (status && !["open", "resolved"].includes(status)) throw badRequest("Status must be open or resolved.");
  res.json({ ok: true, groups: await reportService.listGrouped(status || null) });
}));

router.post("/reports/post/:postId/resolve", asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await reportService.resolvePost(req.params.postId, req.user, req.body)) });
}));

router.post("/reports/:id/resolve", asyncHandler(async (req, res) => {
  res.json({ ok: true, report: await reportService.resolve(req.params.id, req.user, req.body) });
}));

router.post("/report-reasons", asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, reason: await reportService.createReason(req.body) });
}));

module.exports = router;
