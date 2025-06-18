import { Router } from "express";
import { getRewardWallet } from "../controllers/rewardController.js";
import { authenticate } from "../middleware/authMiddleware.js";
const router = Router();

router.get('/getreward',authenticate, getRewardWallet);

export default router;