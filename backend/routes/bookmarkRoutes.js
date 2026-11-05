
const express = require("express");
const router = express.Router();

const {
  addBookmark,
  getMyBookmarks,
  removeBookmark,
} = require("../controllers/bookmarkController");

const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/", addBookmark);
router.get("/", getMyBookmarks);
router.delete("/:id", removeBookmark);

module.exports = router;
