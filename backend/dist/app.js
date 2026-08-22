"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./domains/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./domains/user/user.routes"));
const collections_routes_1 = __importDefault(require("./domains/collections/collections.routes"));
const surveys_routes_1 = __importDefault(require("./domains/surveys/surveys.routes"));
const areas_routes_1 = __importDefault(require("./domains/areas/areas.routes"));
const audio_interview_routes_1 = __importDefault(require("./domains/audio-interview/audio-interview.routes"));
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
}));
exports.app.use(express_1.default.json());
exports.app.get("/health", (_req, res) => {
    res.status(200).send("OK");
});
exports.app.use("/api/auth", auth_routes_1.default);
exports.app.use("/api/user", user_routes_1.default);
exports.app.use("/api/collections", collections_routes_1.default);
exports.app.use("/api/surveys", surveys_routes_1.default);
exports.app.use("/api/areas", areas_routes_1.default);
exports.app.use("/api/interviews", audio_interview_routes_1.default);
