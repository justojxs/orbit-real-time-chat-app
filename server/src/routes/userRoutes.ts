import express from "express";
import {
    registerUser,
    authUser,
    allUsers,
    refreshAccessToken,
    updateUserProfile,
    authGoogleUser,
} from "../controllers/userController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.route("/").post(registerUser).get(protect, allUsers);
router.route("/profile").put(protect, updateUserProfile);
router.post("/login", authUser);
router.post("/google", authGoogleUser);
router.post("/refresh", refreshAccessToken);

export default router;
