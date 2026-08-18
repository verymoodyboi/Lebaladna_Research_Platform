import { Router } from "express";
import { createSurvey, deleteSurvey, listSurveys } from "./surveys.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.get("/collection/:collectionId", requireAuth, listSurveys);
router.post("/", requireAuth, createSurvey);
router.delete("/:surveyId", requireAuth, deleteSurvey);

export default router;