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
  }https://github.com/thamidu02/roamLanka/pull/9/conflict?name=backend%252Fmiddleware%252FauthMiddleware.js&base_oid=a6a629d8be81b0daab11474f5a9092ab653b8578&head_oid=be23af2c96cdd8e0892b2cad569f9d09c94085ab
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  next();
};
