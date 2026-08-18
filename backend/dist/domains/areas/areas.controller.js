"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArea = exports.listAreas = void 0;
const auth_services_1 = require("../auth/auth.services");
const collections_services_1 = require("../collections/collections.services");
const areas_services_1 = require("./areas.services");
const isManagerOrAdmin = (role) => ["admin", "manager"].includes(String(role ?? "").toLowerCase());
const listAreas = async (req, res) => {
    try {
        const { collectionId } = req.params;
        if (typeof collectionId !== "string" || !collectionId) {
            return res.status(400).json({ message: "Collection ID is required." });
        }
        const areas = await (0, areas_services_1.getAreasByCollection)(collectionId);
        return res.status(200).json({ areas });
    }
    catch (error) {
        console.error("Error listing areas:", error);
        return res.status(500).json({ message: "Failed to load areas" });
    }
};
exports.listAreas = listAreas;
const createArea = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const profile = await (0, auth_services_1.getUserProfile)(req.user.id);
        if (!isManagerOrAdmin(profile?.role)) {
            return res.status(403).json({
                message: "Only managers and admins can add areas.",
            });
        }
        const { collection_id, area_name, province } = req.body ?? {};
        if (typeof collection_id !== "string" || !collection_id) {
            return res.status(400).json({
                message: "Collection is required.",
            });
        }
        if (typeof area_name !== "string" || !area_name.trim()) {
            return res.status(400).json({
                message: "Area name is required.",
            });
        }
        if (typeof province !== "string" || !province.trim()) {
            return res.status(400).json({
                message: "Province is required.",
            });
        }
        // Make sure the collection exists.
        await (0, collections_services_1.getCollectionById)(collection_id);
        const area = await (0, areas_services_1.createArea)({
            collection_id,
            area_name: area_name.trim(),
            province: province.trim(),
        });
        return res.status(201).json({ area });
    }
    catch (error) {
        console.error("Error creating area:", error);
        if (error?.code === "AREA_DUPLICATE") {
            return res.status(409).json({
                message: error.message,
            });
        }
        if (error?.code === "PGRST116") {
            return res.status(404).json({
                message: "Collection not found.",
            });
        }
        return res.status(500).json({
            message: "Failed to create area",
        });
    }
};
exports.createArea = createArea;
