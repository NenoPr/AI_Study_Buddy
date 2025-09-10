import dotenv from "dotenv"
dotenv.config();
import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"
import pkg from "pg"
import authRouter from "./routes/auth.mjs"
import notesRouter from "./routes/notes.mjs"
import aiRoutes from "./routes/ai.mjs"

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "✅ Loaded" : "❌ Missing");

const { Pool } = pkg;

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in environment variables");
  }

const app = express();
app.use(cookieParser());

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use((req, res, next) => {
    req.pool = pool;
    next();
});
app.use("/api/auth", authRouter);
app.use("/api/notes", notesRouter);
app.use("/api/ai", aiRoutes);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

pool.connect()
    .then(() => console.log("✅ Connected to PostgreSQL"))
    .catch((err) => console.error("❌ DB connection error:", err));

app.get("/", (req, res) => {
    res.send("Hello from AI Study Buddy backend!")
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));