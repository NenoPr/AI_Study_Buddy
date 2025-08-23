import dotenv from "dotenv"
dotenv.config();
import express from "express"
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

app.use(cors());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use((req, res, next) => {
    req.pool = pool;
    next();
});
app.use("/auth", authRouter);
app.use("/notes", notesRouter);
app.use("/ai", aiRoutes);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.connect()
    .then(() => console.log("✅ Connected to PostgreSQL"))
    .catch((err) => console.error("❌ DB connection error:", err));

app.get("/", (req, res) => {
    res.send("Hello from AI Study Buddy backend!")
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));