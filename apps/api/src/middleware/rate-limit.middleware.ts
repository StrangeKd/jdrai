import rateLimit from "express-rate-limit";

// 10 requests per 15 minutes per IP on auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true, // Sets RateLimit-* and Retry-After headers
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests, please try again later",
        timestamp: new Date().toISOString(),
      },
    });
  },
});
