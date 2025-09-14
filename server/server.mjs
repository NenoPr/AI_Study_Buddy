import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import pkg from "pg";
import authRouter from "./routes/auth.mjs";
import notesRouter from "./routes/notes.mjs";
import aiRoutes from "./routes/ai.mjs";

console.log(
  "OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing"
);

const { Pool } = pkg;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in environment variables");
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // server-to-server
    if (origin.endsWith("-nenoprs-projects.vercel.app")) {
      callback(null, origin); // ✅ echo the request origin
    } else if (origin.endsWith("ai-study-buddy-silk.vercel.app")) {
      callback(null, origin); // ✅ echo the request origin
    } else if (origin.endsWith("localhost:5173")) {
      callback(null, origin); // ✅ echo the request origin
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const app = express();

//ai-study-buddy-silk.vercel.app'

https: app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // preflight requests
app.use(cookieParser());
app.use(express.json());
app.use((req, res, next) => {
  req.pool = pool;
  next();
});
app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);
app.use("/api/ai", aiRoutes);

const pool = new Pool({
  connectionString: process.env.NODE_ENV === "production" ?  process.env.DATABASE_URL  : process.env.LOCAL_DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ DB connection error:", err));

app.get("/", (req, res) => {
  res.send("Hello from AI Study Buddy backend!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
