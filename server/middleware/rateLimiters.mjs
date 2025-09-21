// middleware/rateLimiters.js
import rateLimit from "express-rate-limit";

// Helper: get userId if logged in, else fallback to IP
const userOrIpKey = (req) => {
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    return req.ip; // fallback
  };

// 🌍 Global limiter (applies to all requests)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // each IP can make up to 1000 requests / 15min (~66/min)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// 🔐 Login limiter (prevent brute force attacks)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // only 5 attempts per IP / 15min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
});

// 🤖 AI request limiter (expensive operations like AI queries)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 20 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests, please slow down." },
});
