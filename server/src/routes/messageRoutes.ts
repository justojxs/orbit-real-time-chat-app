import express from "express";
import { allMessages, sendMessage, deleteMessage, reactToMessage, searchMessages } from "../controllers/messageController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.route("/:chatId").get(protect, allMessages);
router.route("/").post(protect, sendMessage);
router.route("/delete").put(protect, deleteMessage);
router.route("/react").put(protect, reactToMessage);
router.route("/search/:chatId").get(protect, searchMessages);

export default router;
