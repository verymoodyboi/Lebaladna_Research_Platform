"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const user_controller_1 = require("./user.controller");
const router = (0, express_1.Router)();
router.patch("/update", auth_middleware_1.requireAuth, user_controller_1.updateProfile);
exports.default = router;
