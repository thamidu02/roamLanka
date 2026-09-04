import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    req.user = jwt.verify(authorization.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  next();
};