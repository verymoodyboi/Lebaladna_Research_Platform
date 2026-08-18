import { getUserProfile } from "../auth/auth.services";
import {
  createCollection as insertCollection,
  getCollectionById,
  getCollections,
} from "./collections.services";

export const listCollections = async (req: any, res: any) => {
  try {
    const collections = await getCollections();
    return res.status(200).json({ collections });
  } catch (error) {
    console.error("Error listing collections:", error);
    return res.status(500).json({ message: "Failed to load collections" });
  }
};

export const getCollection = async (req: any, res: any) => {
  try {
    const { collectionId } = req.params;
    if (typeof collectionId !== "string" || !collectionId) {
      return res.status(400).json({ message: "Collection ID is required." });
    }

    const collection = await getCollectionById(collectionId);
    return res.status(200).json({ collection });
  } catch (error: any) {
    console.error("Error loading collection:", error);
    return res.status(error?.code === "PGRST116" ? 404 : 500).json({
      message:
        error?.code === "PGRST116"
          ? "Collection not found."
          : "Failed to load collection",
    });
  }
};

export const createCollection = async (req: any, res: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profile = await getUserProfile(req.user.id);

    if (String(profile?.role ?? "").toLowerCase() !== "admin") {
      return res.status(403).json({
        message: "Only admins can create collections.",
      });
    }

    const { collection_name, bg_path } = req.body ?? {};

    if (typeof collection_name !== "string" || !collection_name.trim()) {
      return res.status(400).json({ message: "Collection name is required." });
    }

    const collection = await insertCollection({
      collection_name: collection_name.trim(),
      bg_path: bg_path || null,
    });

    return res.status(201).json({ collection });
  } catch (error) {
    console.error("Error creating collection:", error);
    return res.status(500).json({ message: "Failed to create collection" });
  }
};
