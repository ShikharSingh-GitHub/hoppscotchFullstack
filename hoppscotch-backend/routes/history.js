const express = require("express");
const router = express.Router();
const {
  getHistory,
  addHistory,
  deleteHistory,
  toggleStar,
  clearHistory,
} = require("../controllers/historyController");

// GET /api/history - Get all history entries
router.get("/", getHistory);

// POST /api/history - Add new history entry
router.post("/", addHistory);

// DELETE /api/history/:id - Delete specific history entry
router.delete("/:id", deleteHistory);

// PATCH /api/history/:id/star - Toggle star status
router.patch("/:id/star", toggleStar);

// DELETE /api/history - Clear all history
router.delete("/", clearHistory);

module.exports = router;
