import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import pkg from "pg"

dotenv.config();
const { Pool } = pkg;

const app = express();

app.use(cors());
app.use(express.json());

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