const jwt = require("jsonwebtoken");
const db = require("../models");

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: "Access token required" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Optionally verify business exists and is active
        if (decoded.businessId) {
            const business = await db.Business.findByPk(decoded.businessId);
            if (!business || business.subscription_status !== "active") {
                return res
                    .status(401)
                    .json({ error: "Invalid or inactive business account" });
            }
            req.business = business;
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(403).json({ error: "Invalid token" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired" });
        }
        return res.status(500).json({ error: "Token verification failed" });
    }
};

// Middleware to check if user owns the business
const checkBusinessOwnership = (req, res, next) => {
    const businessId =
        req.params.businessId || req.body.business_id || req.query.business_id;

    if (!businessId) {
        return res.status(400).json({ error: "Business ID required" });
    }

    if (req.user.businessId && parseInt(businessId) !== req.user.businessId) {
        return res
            .status(403)
            .json({ error: "Access denied to this business" });
    }

    req.businessId = parseInt(businessId);
    next();
};

// Middleware for optional authentication (for public endpoints)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;

            if (decoded.businessId) {
                const business = await db.Business.findByPk(decoded.businessId);
                if (business && business.subscription_status === "active") {
                    req.business = business;
                }
            }
        }

        next();
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
};

module.exports = {
    authenticateToken,
    checkBusinessOwnership,
    optionalAuth,
};
