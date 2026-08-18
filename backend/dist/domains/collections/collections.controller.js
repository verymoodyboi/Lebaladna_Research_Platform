"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCollection = exports.getCollection = exports.listCollections = void 0;
const auth_services_1 = require("../auth/auth.services");
const collections_services_1 = require("./collections.services");
const listCollections = async (req, res) => {
    try {
        const collections = await (0, collections_services_1.getCollections)();
        return res.status(200).json({ collections });
    }
    catch (error) {
        console.error("Error listing collections:", error);
        return res.status(500).json({ message: "Failed to load collections" });
    }
};
exports.listCollections = listCollections;
const getCollection = async (req, res) => {
    try {
        const { collectionId } = req.params;
        if (typeof collectionId !== "string" || !collectionId) {
            return res.status(400).json({ message: "Collection ID is required." });
        }
        const collection = await (0, collections_services_1.getCollectionById)(collectionId);
        return res.status(200).json({ collection });
    }
    catch (error) {
        console.error("Error loading collection:", error);
        return res.status(error?.code === "PGRST116" ? 404 : 500).json({
            message: error?.code === "PGRST116"
                ? "Collection not found."
                : "Failed to load collection",
        });
    }
};
exports.getCollection = getCollection;
const createCollection = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const profile = await (0, auth_services_1.getUserProfile)(req.user.id);
        if (String(profile?.role ?? "").toLowerCase() !== "admin") {
            return res.status(403).json({
                message: "Only admins can create collections.",
            });
        }
        const { collection_name, bg_path } = req.body ?? {};
        if (typeof collection_name !== "string" || !collection_name.trim()) {
            return res.status(400).json({ message: "Collection name is required." });
        }
        const collection = await (0, collections_services_1.createCollection)({
            collection_name: collection_name.trim(),
            bg_path: bg_path || null,
        });
        return res.status(201).json({ collection });
    }
    catch (error) {
        console.error("Error creating collection:", error);
        return res.status(500).json({ message: "Failed to create collection" });
    }
};
exports.createCollection = createCollection;
