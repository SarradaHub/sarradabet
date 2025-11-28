import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { logger } from "../../utils/logger";
import { BadRequestError, TooManyRequestsError } from "../errors/AppError";

export const createRateLimit = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = "Too many requests from this IP, please try again later",
    skipSuccessfulRequests = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      errors: [{ field: "rateLimit", message, code: "TOO_MANY_REQUESTS" }],
    },
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      if (process.env.NODE_ENV === "development") {
        const ip = req.ip || req.connection.remoteAddress || "";
        return (
          ip.includes("127.0.0.1") ||
          ip.includes("::ffff:127.0.0.1") ||
          ip.includes("::1")
        );
      }
      return false;
    },
    handler: (req: Request, res: Response, next: NextFunction) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        method: req.method,
      });

      const error = new TooManyRequestsError(message);
      next(error);
    },
  });
};

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

export const requestSizeLimit = (maxSize: string = "10mb") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get("content-length");

    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseInt(maxSize);

      if (sizeInMB > maxSizeInMB) {
        logger.warn(`Request size exceeded for IP: ${req.ip}`, {
          ip: req.ip,
          contentLength,
          maxSize,
          path: req.path,
          method: req.method,
        });

        const error = new BadRequestError(
          `Request size cannot exceed ${maxSize}`,
        );
        return next(error);
      }
    }

    next();
  };
};

export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || "unknown";

    if (!allowedIPs.includes(clientIP)) {
      logger.warn(`Unauthorized IP access attempt: ${clientIP}`, {
        ip: clientIP,
        userAgent: req.get("User-Agent"),
        path: req.path,
        method: req.method,
      });

      const error = new BadRequestError("Access denied from this IP address");
      return next(error);
    }

    next();
  };
};

export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = (req.query[key] as string)
          .replace(/[<>"'&]/g, "")
          .trim();
      }
    });
  }

  if (req.body && typeof req.body === "object") {
    const sanitizeObject = (obj: unknown): unknown => {
      if (typeof obj === "string") {
        return obj.replace(/[<>"'&]/g, "").trim();
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      if (obj && typeof obj === "object") {
        const sanitized: Record<string, unknown> = {};
        Object.keys(obj as Record<string, unknown>).forEach((key) => {
          sanitized[key] = sanitizeObject(
            (obj as Record<string, unknown>)[key],
          );
        });
        return sanitized;
      }
      return obj;
    };

    req.body = sanitizeObject(req.body);
  }

  next();
};

export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [
      "http://localhost:8000",
    ];

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`CORS blocked request from origin: ${origin}`);
    callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
