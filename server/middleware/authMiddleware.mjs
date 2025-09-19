import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  let token;
   // Check for Bearer token first
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // Fallback: Check for cookie
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  console.log(authHeader, token)

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
}

export function validateUserId(req, res, next) {
  if (!req.user || !Number.isInteger(req.user.userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  next();
}
