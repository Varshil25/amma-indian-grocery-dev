import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

const app = express();

// Behind the host's proxy — needed so rate limiting sees real client IPs
app.set("trust proxy", 1);

// Security middleware. The storefront and admin run on a different origin than the
// API, so images served from /api/media must be loadable cross-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: [env.FRONTEND_URL, env.ADMIN_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const rateLimitMessage = { error: { code: "RATE_LIMITED", message: "Too many requests, please try again later" } };

// General limit. A single page load fires several requests and the admin panel many
// more, so this is generous; the auth limiter below protects credential endpoints.
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: rateLimitMessage,
  })
);

// Strict limit on credential endpoints (brute force / spam)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  // Count only failed attempts: shoppers signing up on the store's Wi-Fi share one IP,
  // and successful sign-ins shouldn't use up the budget meant to stop password guessing
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});
app.use(["/api/auth/login", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password"], authLimiter);

// Body parsing. Keep the raw bytes too: Stripe and Square webhook signatures are
// computed over the exact request body.
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// API routes
app.get("/", (_req, res) => {
  res.json({ name: "Amma Grocery API", health: "/api/health" });
});
app.use("/api", routes);

// Unknown API routes → JSON 404 (instead of Express's HTML page)
app.use("/api", (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Endpoint not found" } });
});

// Error handling (must be last)
app.use(errorHandler);

export default app;
