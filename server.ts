import express, { Request, Response } from "express";
import path from "path";
import { connectDB } from "./backend/config/db.ts";
import userRoutes from "./backend/routes/userRoutes.ts";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connect
connectDB().catch((err) => {
  console.error("DB Connection Error:", err);
});

// API Routes
app.use("/api", userRoutes);
app.use("/", userRoutes);

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "HealthMate Backend",
  });
});

// Production static frontend
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist");

  app.use(express.static(distPath));

  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;
