const express = require("express");
const router = express.Router();
const db = require("../models");
const { authenticateToken } = require("../middleware/auth");
const { validateId, validatePagination } = require("../middleware/validation");

// Get all platform sources for a business
router.get(
    "/",
    authenticateToken,
    validatePagination,
    async (req, res, next) => {
        try {
            const {
                page = 1,
                limit = 20,
                business_id,
                platform_type,
                is_connected,
            } = req.query;
            const offset = (page - 1) * limit;

            const whereClause = {};

            if (business_id) {
                whereClause.business_id = business_id;
            } else if (req.user.businessId) {
                whereClause.business_id = req.user.businessId;
            }

            if (platform_type) {
                whereClause.platform_type = platform_type;
            }

            if (is_connected !== undefined) {
                whereClause.is_connected = is_connected === "true";
            }

            const platforms = await db.PlatformSource.findAndCountAll({
                where: whereClause,
                attributes: { exclude: ["credentials"] }, // Don't expose credentials in list
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [["created_at", "DESC"]],
            });

            res.json({
                platforms: platforms.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(platforms.count / limit),
                    totalItems: platforms.count,
                    itemsPerPage: parseInt(limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get platform source by ID
router.get("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const platform = await db.PlatformSource.findByPk(req.params.id, {
            include: [
                {
                    model: db.Conversation,
                    as: "conversations",
                    attributes: ["id", "current_state", "last_activity"],
                    order: [["last_activity", "DESC"]],
                    limit: 5,
                },
            ],
        });

        if (!platform) {
            return res.status(404).json({ error: "Platform source not found" });
        }

        // Check business ownership
        if (
            req.user.businessId &&
            platform.business_id !== req.user.businessId
        ) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Remove sensitive credentials from response
        const safePlatform = platform.toJSON();
        delete safePlatform.credentials;

        res.json(safePlatform);
    } catch (error) {
        next(error);
    }
});

// Create new platform source
router.post("/", authenticateToken, async (req, res, next) => {
    try {
        const {
            business_id,
            platform_type,
            platform_name,
            credentials,
            webhook_url,
            configuration,
        } = req.body;

        if (!platform_type || !platform_name) {
            return res
                .status(400)
                .json({ error: "Platform type and name are required" });
        }

        // Use business_id from user if not provided
        const finalBusinessId = business_id || req.user.businessId;

        if (!finalBusinessId) {
            return res.status(400).json({ error: "Business ID is required" });
        }

        const platform = await db.PlatformSource.create({
            business_id: finalBusinessId,
            platform_type,
            platform_name,
            credentials,
            webhook_url,
            configuration,
            connection_status: "disconnected",
        });

        const createdPlatform = await db.PlatformSource.findByPk(platform.id);
        const safePlatform = createdPlatform.toJSON();
        delete safePlatform.credentials;

        res.status(201).json(safePlatform);
    } catch (error) {
        next(error);
    }
});

// Update platform source
router.put("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const platform = await db.PlatformSource.findByPk(req.params.id);

        if (!platform) {
            return res.status(404).json({ error: "Platform source not found" });
        }

        // Check business ownership
        if (
            req.user.businessId &&
            platform.business_id !== req.user.businessId
        ) {
            return res.status(403).json({ error: "Access denied" });
        }

        await platform.update(req.body);

        const updatedPlatform = await db.PlatformSource.findByPk(platform.id);
        const safePlatform = updatedPlatform.toJSON();
        delete safePlatform.credentials;

        res.json(safePlatform);
    } catch (error) {
        next(error);
    }
});

// Delete platform source
router.delete("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const platform = await db.PlatformSource.findByPk(req.params.id);

        if (!platform) {
            return res.status(404).json({ error: "Platform source not found" });
        }

        // Check business ownership
        if (
            req.user.businessId &&
            platform.business_id !== req.user.businessId
        ) {
            return res.status(403).json({ error: "Access denied" });
        }

        await platform.destroy();

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// Connect platform source
router.post(
    "/:id/connect",
    authenticateToken,
    validateId,
    async (req, res, next) => {
        try {
            const { credentials, webhook_url } = req.body;

            const platform = await db.PlatformSource.findByPk(req.params.id);

            if (!platform) {
                return res
                    .status(404)
                    .json({ error: "Platform source not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                platform.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            // Update connection details
            await platform.update({
                credentials,
                webhook_url,
                is_connected: true,
                connection_status: "connected",
                last_sync: new Date(),
            });

            res.json({ message: "Platform connected successfully" });
        } catch (error) {
            next(error);
        }
    }
);

// Disconnect platform source
router.post(
    "/:id/disconnect",
    authenticateToken,
    validateId,
    async (req, res, next) => {
        try {
            const platform = await db.PlatformSource.findByPk(req.params.id);

            if (!platform) {
                return res
                    .status(404)
                    .json({ error: "Platform source not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                platform.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            // Clear connection details and disconnect
            await platform.update({
                credentials: null,
                webhook_url: null,
                is_connected: false,
                connection_status: "disconnected",
                last_sync: null,
            });

            res.json({ message: "Platform disconnected successfully" });
        } catch (error) {
            next(error);
        }
    }
);

// Test platform connection
router.post(
    "/:id/test",
    authenticateToken,
    validateId,
    async (req, res, next) => {
        try {
            const platform = await db.PlatformSource.findByPk(req.params.id);

            if (!platform) {
                return res
                    .status(404)
                    .json({ error: "Platform source not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                platform.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            if (!platform.is_connected) {
                return res
                    .status(400)
                    .json({ error: "Platform is not connected" });
            }

            // Here you would implement actual platform-specific connection testing
            // For now, we'll just simulate a test
            const testResult = {
                status: "success",
                message: "Connection test successful",
                platform_type: platform.platform_type,
                timestamp: new Date(),
            };

            // Update last sync time
            await platform.update({ last_sync: new Date() });

            res.json(testResult);
        } catch (error) {
            next(error);
        }
    }
);

// Get platform statistics
router.get(
    "/:id/stats",
    authenticateToken,
    validateId,
    async (req, res, next) => {
        try {
            const platform = await db.PlatformSource.findByPk(req.params.id);

            if (!platform) {
                return res
                    .status(404)
                    .json({ error: "Platform source not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                platform.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            const [totalConversations, activeConversations, totalMessages] =
                await Promise.all([
                    db.Conversation.count({
                        where: { source_id: req.params.id },
                    }),
                    db.Conversation.count({
                        where: {
                            source_id: req.params.id,
                            current_state: "active",
                        },
                    }),
                    db.Message.count({
                        include: [
                            {
                                model: db.Conversation,
                                where: { source_id: req.params.id },
                                attributes: [],
                            },
                        ],
                    }),
                ]);

            res.json({
                totalConversations,
                activeConversations,
                totalMessages,
                isConnected: platform.is_connected,
                connectionStatus: platform.connection_status,
                lastSync: platform.last_sync,
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
