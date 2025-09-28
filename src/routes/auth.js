"use strict";

const express = require("express");
const router = express.Router();
const { User, Business } = require("../models");
const {
    verifyFirebaseToken,
    requireRoles,
} = require("../middleware/firebaseAuth");

/**
 * @swagger
 * /auth/sync:
 *   post:
 *     summary: Sync Firebase user with backend
 *     description: Verifies Firebase token and creates/updates user record in backend
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/sync", verifyFirebaseToken, async (req, res) => {
    try {
        // User is already created/updated in the middleware
        const user = req.user;

        // Find the user's business
        const business = await Business.findOne({
            where: { owner_id: user.id },
            attributes: [
                "id",
                "company_name",
                "owner_email",
                "phone",
                "website",
                "primary_language",
                "auto_detect_language",
                "timezone",
                "subscription_plan",
                "subscription_status",
                "onboarding_completed",
                "setup_step",
                "created_at",
                "updated_at",
            ],
        });

        // Return user data in the requested format
        const userResponse = {
            id: user.id.toString(),
            name: user.display_name || user.email,
            email: user.email,
        };

        // Return business data in the requested format
        let businessResponse = null;
        if (business) {
            businessResponse = {
                id: business.id.toString(),
                name: business.company_name,
                email: business.owner_email,
                phone: business.phone,
                address: null, // Not available in current schema
                website: business.website,
                description: null, // Not available in current schema
                created_at: business.created_at,
                updated_at: business.updated_at,
            };
        }

        res.json({
            success: true,
            user: userResponse,
            business: businessResponse,
        });
    } catch (error) {
        console.error("Auth sync error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to sync user",
        });
    }
});

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     description: Returns the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/profile", verifyFirebaseToken, async (req, res) => {
    try {
        const user = req.user;

        // Return user profile data
        const userProfile = {
            id: user.id,
            firebase_uid: user.firebase_uid,
            email: user.email,
            display_name: user.display_name,
            photo_url: user.photo_url,
            roles: user.roles,
            metadata: user.metadata,
            is_active: user.is_active,
            last_login: user.last_login,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };

        res.json({
            success: true,
            user: userProfile,
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to get user profile",
        });
    }
});

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     description: Updates the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *                 description: User's display name
 *               metadata:
 *                 type: object
 *                 description: Additional user metadata
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/profile", verifyFirebaseToken, async (req, res) => {
    try {
        const { display_name, metadata } = req.body;
        const user = req.user;

        // Update user profile
        const updateData = {};
        if (display_name !== undefined) updateData.display_name = display_name;
        if (metadata !== undefined)
            updateData.metadata = { ...user.metadata, ...metadata };

        await user.update(updateData);

        // Return updated user data
        const updatedUser = await User.findByPk(user.id);
        const userResponse = {
            id: updatedUser.id,
            firebase_uid: updatedUser.firebase_uid,
            email: updatedUser.email,
            display_name: updatedUser.display_name,
            photo_url: updatedUser.photo_url,
            roles: updatedUser.roles,
            metadata: updatedUser.metadata,
            is_active: updatedUser.is_active,
            last_login: updatedUser.last_login,
            created_at: updatedUser.created_at,
            updated_at: updatedUser.updated_at,
        };

        res.json({
            success: true,
            user: userResponse,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to update profile",
        });
    }
});

/**
 * @swagger
 * /auth/roles:
 *   put:
 *     summary: Update user roles (Admin only)
 *     description: Updates user roles - requires admin role
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - roles
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID of the user to update
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [user, admin, business_owner, agent]
 *                 description: New roles for the user
 *     responses:
 *       200:
 *         description: Roles updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
    "/roles",
    verifyFirebaseToken,
    requireRoles("admin"),
    async (req, res) => {
        try {
            const { user_id, roles } = req.body;

            if (!user_id || !Array.isArray(roles)) {
                return res.status(400).json({
                    error: "Bad Request",
                    message: "user_id and roles are required",
                });
            }

            // Validate roles
            const validRoles = ["user", "admin", "business_owner", "agent"];
            const invalidRoles = roles.filter(
                (role) => !validRoles.includes(role)
            );

            if (invalidRoles.length > 0) {
                return res.status(400).json({
                    error: "Bad Request",
                    message: `Invalid roles: ${invalidRoles.join(", ")}`,
                });
            }

            const user = await User.findByPk(user_id);
            if (!user) {
                return res.status(404).json({
                    error: "Not Found",
                    message: "User not found",
                });
            }

            await user.update({ roles });

            const userResponse = {
                id: user.id,
                firebase_uid: user.firebase_uid,
                email: user.email,
                display_name: user.display_name,
                photo_url: user.photo_url,
                roles: user.roles,
                metadata: user.metadata,
                is_active: user.is_active,
                last_login: user.last_login,
                created_at: user.created_at,
                updated_at: user.updated_at,
            };

            res.json({
                success: true,
                user: userResponse,
            });
        } catch (error) {
            console.error("Update roles error:", error);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to update roles",
            });
        }
    }
);

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     description: Returns list of all users - requires admin role
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
    "/users",
    verifyFirebaseToken,
    requireRoles("admin"),
    async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const { count, rows: users } = await User.findAndCountAll({
                limit,
                offset,
                order: [["created_at", "DESC"]],
                attributes: [
                    "id",
                    "firebase_uid",
                    "email",
                    "display_name",
                    "photo_url",
                    "roles",
                    "metadata",
                    "is_active",
                    "last_login",
                    "created_at",
                    "updated_at",
                ],
            });

            const totalPages = Math.ceil(count / limit);

            res.json({
                success: true,
                users,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            });
        } catch (error) {
            console.error("Get users error:", error);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to get users",
            });
        }
    }
);

module.exports = router;
