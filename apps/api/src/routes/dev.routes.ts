import { Router } from "express";
import { Request, Response } from "express";

const router = Router();

if (process.env.NODE_ENV === "development") {
  router.post("/clear-rate-limit", (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "Rate limit cache cleared (development only)",
      timestamp: new Date().toISOString(),
    });
  });

  router.get("/info", (req: Request, res: Response) => {
    res.json({
      success: true,
      environment: process.env.NODE_ENV,
      rateLimitInfo: {
        windowMs: "15 minutes",
        max: process.env.NODE_ENV === "development" ? 1000 : 100,
        skipSuccessfulRequests: process.env.NODE_ENV === "development",
        skipLocalhost: process.env.NODE_ENV === "development",
      },
      timestamp: new Date().toISOString(),
    });
  });

  router.post("/debug-bet-validation", async (req: Request, res: Response) => {
    const { CreateBetSchema } = await import(
      "../core/validation/ValidationSchemas"
    );

    console.log("Debug - Received data:", req.body);

    const result = CreateBetSchema.safeParse(req.body);

    if (!result.success) {
      console.log("Debug - Validation failed:", result.error.errors);
      res.json({
        success: false,
        message: "Validation failed",
        errors: result.error.errors,
        receivedData: req.body,
      });
    } else {
      console.log("Debug - Validation passed:", result.data);
      res.json({
        success: true,
        message: "Validation passed",
        data: result.data,
      });
    }
  });
}

export default router;
