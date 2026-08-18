import { Router } from "express";
import { checkUsernameAvailability, createProfile, getMe } from "./auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.get("/me", requireAuth, getMe);
router.post("/profile", requireAuth, createProfile);
router.get("/username-available", checkUsernameAvailability);

export default router;
