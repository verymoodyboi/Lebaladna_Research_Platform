import { Router } from "express";
import {
  createCollection,
  getCollection,
  listCollections,
} from "./collections.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", requireAuth, listCollections);
router.get("/:collectionId", requireAuth, getCollection);
router.post("/", requireAuth, createCollection);

export default router;
