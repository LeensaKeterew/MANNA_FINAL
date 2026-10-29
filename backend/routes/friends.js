const router = require("express").Router();
const { asyncHandler } = require("../utils/errors");
const { requireAuth } = require("../middleware/auth");
const friendService = require("../services/friendService");

router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  res.json({ ok: true, friends: await friendService.list(req.user) });
}));

router.get("/requests", asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await friendService.requests(req.user)) });
}));

router.post("/request/:userId", asyncHandler(async (req, res) => {
  await friendService.sendRequest(req.user, req.params.userId);
  res.status(201).json({ ok: true });
}));

router.post("/accept/:userId", asyncHandler(async (req, res) => {
  await friendService.accept(req.user, req.params.userId);
  res.json({ ok: true });
}));

router.post("/decline/:userId", asyncHandler(async (req, res) => {
  await friendService.decline(req.user, req.params.userId);
  res.json({ ok: true });
}));

router.delete("/:userId", asyncHandler(async (req, res) => {
  await friendService.remove(req.user, req.params.userId);
  res.json({ ok: true });
}));

module.exports = router;
