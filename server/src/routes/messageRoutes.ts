import express from "express";
import { allMessages, sendMessage, deleteMessage, reactToMessage, searchMessages, summarizeChat } from "../controllers/messageController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/delete").put(protect, deleteMessage);
router.route("/react").put(protect, reactToMessage);
router.route("/summary/:chatId").post(protect, summarizeChat);
router.route("/search/:chatId").get(protect, searchMessages);
router.route("/:chatId").get(protect, allMessages);

export default router;
