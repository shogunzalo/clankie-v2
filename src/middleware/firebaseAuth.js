"use strict";

const { auth } = require("../config/firebase");
const { User } = require("../models");

/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens and attaches user data to request
 */
const verifyFirebaseToken = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "No valid authorization header found",
            });
        }

        const token = authHeader.split("Bearer ")[1];

        if (!token) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "No token provided",
            });
        }

        // Verify the Firebase ID token
        const decodedToken = await auth.verifyIdToken(token);

        // Attach Firebase user data to request
        req.firebaseUser = decodedToken;
        req.firebaseUid = decodedToken.uid;
        req.firebaseEmail = decodedToken.email;

        // Find or create user in our database
        let user = await User.findOne({
            where: { firebase_uid: decodedToken.uid },
        });

        if (!user) {
            // Create new user if doesn't exist
            user = await User.create({
                firebase_uid: decodedToken.uid,
                email: decodedToken.email,
                display_name:
                    decodedToken.name || decodedToken.email.split("@")[0],
                photo_url: decodedToken.picture || null,
                roles: ["user"],
                metadata: {
                    email_verified: decodedToken.email_verified,
                    firebase_sign_in_provider:
                        decodedToken.firebase?.sign_in_provider,
                    created_via: "firebase_auth",
                },
                last_login: new Date(),
            });
        } else {
            // Update last login time
            await user.update({
                last_login: new Date(),
                email: decodedToken.email, // Update email in case it changed
                display_name: decodedToken.name || user.display_name,
                photo_url: decodedToken.picture || user.photo_url,
            });
        }

        // Attach user data to request
        req.user = user;
        req.userId = user.id;

        next();
    } catch (error) {
        console.error("Firebase token verification error:", error);

        // Handle specific Firebase errors
        if (error.code === "auth/id-token-expired") {
            return res.status(401).json({
                error: "Token Expired",
                message: "The provided token has expired",
            });
        }

        if (error.code === "auth/invalid-id-token") {
            return res.status(401).json({
                error: "Invalid Token",
                message: "The provided token is invalid",
            });
        }

        return res.status(401).json({
            error: "Unauthorized",
            message: "Token verification failed",
        });
    }
};

/**
 * Optional Firebase Authentication Middleware
 * Similar to verifyFirebaseToken but doesn't fail if no token is provided
 */
const optionalFirebaseAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            // No token provided, continue without authentication
            req.user = null;
            req.firebaseUser = null;
            return next();
        }

        const token = authHeader.split("Bearer ")[1];

        if (!token) {
            req.user = null;
            req.firebaseUser = null;
            return next();
        }

        // Verify token and get user data
        const decodedToken = await auth.verifyIdToken(token);

        req.firebaseUser = decodedToken;
        req.firebaseUid = decodedToken.uid;
        req.firebaseEmail = decodedToken.email;

        const user = await User.findOne({
            where: { firebase_uid: decodedToken.uid },
        });

        req.user = user;
        req.userId = user?.id;

        next();
    } catch (error) {
        console.error("Optional Firebase token verification error:", error);
        // For optional auth, we continue even if token verification fails
        req.user = null;
        req.firebaseUser = null;
        next();
    }
};

/**
 * Role-based authorization middleware
 * Checks if user has required roles
 */
const requireRoles = (...requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: "Unauthorized",
                message: "Authentication required",
            });
        }

        const userRoles = req.user.roles || [];
        const hasRequiredRole = requiredRoles.some((role) =>
            userRoles.includes(role)
        );

        if (!hasRequiredRole) {
            return res.status(403).json({
                error: "Forbidden",
                message: `Required roles: ${requiredRoles.join(", ")}`,
            });
        }

        next();
    };
};

module.exports = {
    verifyFirebaseToken,
    optionalFirebaseAuth,
    requireRoles,
};
