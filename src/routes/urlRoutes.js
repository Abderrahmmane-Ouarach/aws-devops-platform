const express = require("express");
const router = express.Router();
const { shortenUrl, redirectUrl, getStats } = require("../controllers/urlController");

router.post("/shorten", shortenUrl);
router.get("/stats/:code", getStats);
router.get("/:code", redirectUrl);

module.exports = router;