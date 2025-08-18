import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../middleware/authMiddleware.mjs";

const router = express.Router();
const SALT_ROUNDS = 12;


// Sign up route
router.post("/signup", async (req, res) => {
    const {email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required"});

    try {
        // Hash password
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
        // Insert user into DB
        const result = await req.pool.query(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
            [email, password_hash]
        );

        const user = result.rows[0];

        // Sign JWT with id
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json({ token });
    } catch (error) {
        if (error.code === "23505") { // unique_violation
            res.status(409).json({ error: "Email already exists"});
        } else {
            console.log(error);
            res.status(500).json({ error: "Internal server error"});
        }
    }
});

// Login route
router.post("/login", async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required"});

    try {
        const result = await req.pool.query("SELECT * FROM users WHERE email = $1", [email]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: "Invalid credentials"})

        // Compare passwords
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: "Invalid credentials"});

        // Create JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/signup", async (req, res) => {
    res.json({ message: "signup route hit!" });
})

router.get("/me", authenticateToken, (req, res) => {
    res.json({ user: req.user }); // { userId, email, iat, exp }
});

export default router;