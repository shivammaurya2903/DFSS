const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Authentication required",
    });
  }

  jwt.verify(token, require("../config").jwtSecret, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "TOKEN_EXPIRED",
          message: "Token expired",
        });
      }
      return res.status(403).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid token",
      });
    }

    // Canonical user object attached to req.
    // JWT payload uses { userId, role }
    // We expose both .userId and .id so all controllers work correctly.
    req.user = {
      ...decoded,
      id: decoded.userId || decoded.id,       // canonical: req.user.id
      userId: decoded.userId || decoded.id,   // also available as req.user.userId
    };

    // Attach a request ID for audit logging
    req.requestId = req.headers["x-request-id"] || crypto.randomUUID();

    next();
  });
};

module.exports = authenticateToken;
