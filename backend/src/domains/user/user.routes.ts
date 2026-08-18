import { Router } from "express";


import { requireAuth } from "../../middleware/auth.middleware";
import { updateProfile } from "./user.controller";

const router = Router();

router.patch("/update", requireAuth, updateProfile);

export default router;
