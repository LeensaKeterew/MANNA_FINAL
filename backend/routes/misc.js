// Feed, search, hashtags, report reasons, messages and image uploads.
const router = require("express").Router();
const { asyncHandler, badRequest } = require("../utils/errors");
const { requireAuth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const feedService = require("../services/feedService");
const reportService = require("../services/reportService");
const messageService = require("../services/messageService");

router.use(requireAuth);

router.get("/feed", asyncHandler(async (req, res) => {
  res.json({ ok: true, items: await feedService.feed(req.user, req.query.scope || "local", { sort: req.query.sort, limit: req.query.limit }) });
}));

router.get("/hashtags/trending", asyncHandler(async (req, res) => {
  res.json({ ok: true, hashtags: await feedService.trending(req.user, req.query.scope || "local") });
}));

router.get("/search", asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await feedService.search(req.user, req.query.q, { full: req.query.full === "1" })) });
}));

router.get("/report-reasons", asyncHandler(async (req, res) => {
  res.json({ ok: true, reasons: await reportService.listReasons() });
}));

router.get("/messages", asyncHandler(async (req, res) => {
  res.json({ ok: true, conversations: await messageService.conversations(req.user) });
}));

router.get("/messages/:userId", asyncHandler(async (req, res) => {
  res.json({ ok: true, messages: await messageService.thread(req.user, req.params.userId) });
}));

router.post("/messages/:userId", asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, message: await messageService.send(req.user, req.params.userId, req.body) });
}));

router.post("/uploads", upload.single("image"), (req, res, next) => {
  if (!req.file) return next(badRequest("Choose an image to upload."));
  return res.status(201).json({ ok: true, url: `/uploads/${req.file.filename}` });
});

module.exports = router;
