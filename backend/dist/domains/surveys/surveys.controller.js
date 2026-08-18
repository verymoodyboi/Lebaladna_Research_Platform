"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSurvey = exports.createSurvey = exports.listSurveys = void 0;
const auth_services_1 = require("../auth/auth.services");
const areas_services_1 = require("../areas/areas.services");
const surveys_services_1 = require("./surveys.services");
const parseFilters = (query) => {
    const dateFrom = typeof query.date_from === "string" ? query.date_from : undefined;
    const dateTo = typeof query.date_to === "string" ? query.date_to : undefined;
    const areaId = typeof query.area_id === "string" ? query.area_id : undefined;
    const memberId = typeof query.member_id === "string" ? query.member_id : undefined;
    for (const value of [dateFrom, dateTo]) {
        if (value && Number.isNaN(Date.parse(value))) {
            throw new Error("Invalid date filter.");
        }
    }
    return { dateFrom, dateTo, areaId, memberId };
};
const listSurveys = async (req, res) => {
    try {
        const { collectionId } = req.params;
        if (typeof collectionId !== "string" || !collectionId) {
            return res.status(400).json({ message: "Collection ID is required." });
        }
        const filters = parseFilters(req.query);
        const result = await (0, surveys_services_1.getSurveysByCollection)(collectionId, filters);
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("Error listing surveys:", error);
        return res.status(400).json({
            message: error?.message === "Invalid date filter."
                ? error.message
                : "Failed to load surveys",
        });
    }
};
exports.listSurveys = listSurveys;
const createSurvey = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const profile = await (0, auth_services_1.getUserProfile)(req.user.id);
        if (!profile) {
            return res.status(403).json({ message: "User profile not found." });
        }
        const { subject_name, subject_national_id, area_id, subject_family_members_number, food_packs_number, blankets_number, training_suites, subject_mobile_number, bride, health, microfinance, microfinance_notes, health_notes, additional_notes, collection_id, } = req.body ?? {};
        if (typeof subject_name !== "string" || !subject_name.trim()) {
            return res.status(400).json({ message: "Subject name is required." });
        }
        if (typeof collection_id !== "string" || !collection_id) {
            return res.status(400).json({ message: "Collection is required." });
        }
        if (typeof area_id !== "string" || !area_id) {
            return res.status(400).json({ message: "Area is required." });
        }
        let area;
        try {
            area = await (0, areas_services_1.getAreaById)(area_id);
        }
        catch (error) {
            if (error?.code === "PGRST116") {
                return res.status(400).json({ message: "Selected area was not found." });
            }
            throw error;
        }
        if (area.collection_id !== collection_id) {
            return res.status(400).json({
                message: "Selected area does not belong to this collection.",
            });
        }
        const survey = await (0, surveys_services_1.createSurvey)({
            subject_name: subject_name.trim(),
            subject_national_id: subject_national_id || null,
            area_id,
            subject_family_members_number: subject_family_members_number ?? null,
            food_packs_number: food_packs_number ?? 0,
            blankets_number: blankets_number ?? 0,
            training_suites: training_suites || null,
            subject_mobile_number: subject_mobile_number || null,
            bride: !!bride,
            health: !!health,
            microfinance: !!microfinance,
            microfinance_notes: microfinance_notes || null,
            health_notes: health_notes || null,
            additional_notes: additional_notes || null,
            collection_id,
            created_by: profile.user_id,
        });
        const normalizedSurvey = {
            ...survey,
            area: survey.area?.area_name ?? null,
        };
        return res.status(201).json({ survey: normalizedSurvey });
    }
    catch (error) {
        console.error("Error creating survey:", error);
        return res.status(500).json({ message: "Failed to create survey" });
    }
};
exports.createSurvey = createSurvey;
const deleteSurvey = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { surveyId } = req.params;
        if (typeof surveyId !== "string" || !surveyId) {
            return res.status(400).json({ message: "Survey ID is required." });
        }
        const profile = await (0, auth_services_1.getUserProfile)(req.user.id);
        if (!profile) {
            return res.status(403).json({ message: "User profile not found." });
        }
        const isPrivileged = ["admin", "manager"].includes(String(profile.role ?? "").toLowerCase());
        const deleted = await (0, surveys_services_1.deleteSurvey)(surveyId, isPrivileged ? undefined : profile.user_id);
        return res.status(200).json({
            message: "Survey deleted successfully.",
            survey: deleted,
        });
    }
    catch (error) {
        const status = error?.code === "PGRST116" ? 404 : 500;
        console.error("Error deleting survey:", error);
        return res.status(status).json({
            message: status === 404
                ? "Survey not found or you do not have permission to delete it."
                : "Failed to delete survey",
        });
    }
};
exports.deleteSurvey = deleteSurvey;
