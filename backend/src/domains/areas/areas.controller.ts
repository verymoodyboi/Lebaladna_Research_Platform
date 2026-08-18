import { getUserProfile } from "../auth/auth.services";
import { getCollectionById } from "../collections/collections.services";
import {
  createArea as insertArea,
  getAreasByCollection,
} from "./areas.services";

const isManagerOrAdmin = (role: unknown) =>
  ["admin", "manager"].includes(String(role ?? "").toLowerCase());

export const listAreas = async (req: any, res: any) => {
  try {
    const { collectionId } = req.params;

    if (typeof collectionId !== "string" || !collectionId) {
      return res.status(400).json({ message: "Collection ID is required." });
    }

    const areas = await getAreasByCollection(collectionId);
    return res.status(200).json({ areas });
  } catch (error) {
    console.error("Error listing areas:", error);
    return res.status(500).json({ message: "Failed to load areas" });
  }
};

export const createArea = async (req: any, res: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const profile = await getUserProfile(req.user.id);

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
    await getCollectionById(collection_id);

    const area = await insertArea({
      collection_id,
      area_name: area_name.trim(),
      province: province.trim(),
    });

    return res.status(201).json({ area });
  } catch (error: any) {
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