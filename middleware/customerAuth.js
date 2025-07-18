const jwt = require("jsonwebtoken")

const customerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided, authorization denied" })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    req.tenantId = decoded.tenantId // Assuming tenantId is part of the JWT payload
    req.storeId = decoded.storeId // Assuming storeId is part of the JWT payload
    req.role = decoded.role // Assuming role is part of the JWT payload (e.g., 'customer')
    next()
  } catch (err) {
    console.error("Token verification error:", err)
    res.status(403).json({ message: "Token is not valid or expired" })
  }
}

module.exports = customerAuth
