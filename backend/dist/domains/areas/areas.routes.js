"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const areas_controller_1 = require("./areas.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/collection/:collectionId", auth_middleware_1.requireAuth, areas_controller_1.listAreas);
router.post("/", auth_middleware_1.requireAuth, areas_controller_1.createArea);
exports.default = router;
