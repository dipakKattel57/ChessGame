import express from 'express'
import {Login, Register, Logout} from "../controllers/auth.controller.js"
import tokenBucketLimiter from '../middleware/rateLimit.js';

const router = express.Router();
const rateLimiter = tokenBucketLimiter({});

router.post("/login",rateLimiter, Login);
router.post("/register",rateLimiter, Register);
router.post("/logout", Logout);

export default router;