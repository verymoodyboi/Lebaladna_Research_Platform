import express from "express";
import cors from "cors";

import authRoutes from "./domains/auth/auth.routes";
import userRoutes from "./domains/user/user.routes";
import collectionsRoutes from "./domains/collections/collections.routes";
import surveysRoutes from "./domains/surveys/surveys.routes";
import areasRoutes from "./domains/areas/areas.routes";
import interviewRoutes from "./domains/audio-interview/audio-interview.routes"

export const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",

  }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/collections", collectionsRoutes);
app.use("/api/surveys", surveysRoutes);
app.use("/api/areas", areasRoutes);
app.use("/api/interviews", interviewRoutes);