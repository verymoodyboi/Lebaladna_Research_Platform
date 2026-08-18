import { Router } from "express";
import { createArea, listAreas } from "./areas.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.get("/collection/:collectionId", requireAuth, listAreas);
router.post("/", requireAuth, createArea);

export default router;
