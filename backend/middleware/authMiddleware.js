import jwt from "jsonwebtoken";

const getJwtSecret = () => process.env.JWT_SECRET || "roamlanka_jwt_secret_fallback_2026";

export const protect = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    req.user = jwt.verify(authorization.split(" ")[1], getJwtSecret());
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
