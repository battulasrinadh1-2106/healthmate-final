import express from "express";
import { type Request, type Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { connectDB } from "./backend/config/db.ts";
import userRoutes from "./backend/routes/userRoutes.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser limit increase for reliability
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize Database Connection gracefully
  await connectDB();

  // API routing - Dual-mounted for total endpoint compatibility with multiple fetch styles
  app.use("/api", userRoutes);
  app.use("/", userRoutes); // Direct root APIs also respond

  // Base API health indicators
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "HealthMate Backend Foundation with MongoDB",
    });
  });

  app.get("/api/info", (req: Request, res: Response) => {
    res.json({
      name: "HEALTHMATE MVP DB-FOUNDATION",
      version: "1.2.0",
      description: "Smart digital health companion platform backend database layer",
      features: [
        "Mongoose & MongoDB production schemas",
        "Dual API routing structure",
        "Safe in-memory database simulation redundancy",
        "Scalable BMIRecord tracking controller loggers"
      ],
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware for development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the compiled assets in /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 HealthMate Server successfully running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("❌ Critical error starting Express backend server:", error);
});
