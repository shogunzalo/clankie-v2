const express = require("express");
const router = express.Router();
const db = require("../models");
const { authenticateToken } = require("../middleware/auth");
const {
    validateClient,
    validateId,
    validatePagination,
} = require("../middleware/validation");

// Get all clients for a business
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
                relationship_status,
            } = req.query;
            const offset = (page - 1) * limit;

            const whereClause = {};

            if (business_id) {
                whereClause.business_id = business_id;
            }

            if (platform_type) {
                whereClause.platform_type = platform_type;
            }

            if (relationship_status) {
                whereClause.relationship_status = relationship_status;
            }

            // If user has business access, filter by their business
            if (req.user.businessId) {
                whereClause.business_id = req.user.businessId;
            }

            const clients = await db.Client.findAndCountAll({
                where: whereClause,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [["last_contact", "DESC"]],
            });

            res.json({
                clients: clients.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(clients.count / limit),
                    totalItems: clients.count,
                    itemsPerPage: parseInt(limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get client by ID
router.get("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const client = await db.Client.findByPk(req.params.id, {
            include: [
                {
                    model: db.Conversation,
                    as: "conversations",
                    attributes: [
                        "id",
                        "current_state",
                        "lead_score",
                        "last_activity",
                    ],
                    order: [["last_activity", "DESC"]],
                    limit: 5,
                },
                {
                    model: db.Lead,
                    as: "leads",
                    attributes: [
                        "id",
                        "current_stage",
                        "qualification_score",
                        "conversion_value",
                    ],
                    order: [["created_at", "DESC"]],
                    limit: 5,
                },
            ],
        });

        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        // Check business ownership
        if (req.user.businessId && client.business_id !== req.user.businessId) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json(client);
    } catch (error) {
        next(error);
    }
});

// Create new client
router.post("/", authenticateToken, validateClient, async (req, res, next) => {
    try {
        const { business_id, platform_user_id, platform_type } = req.body;

        // Use business_id from user if not provided
        const finalBusinessId = business_id || req.user.businessId;

        if (!finalBusinessId) {
            return res.status(400).json({ error: "Business ID is required" });
        }

        // Check if client already exists for this business and platform
        const existingClient = await db.Client.findOne({
            where: {
                business_id: finalBusinessId,
                platform_user_id,
                platform_type,
            },
        });

        if (existingClient) {
            return res.status(409).json({
                error: "Client already exists",
                client: existingClient,
            });
        }

        const client = await db.Client.create({
            business_id: finalBusinessId,
            first_contact: new Date(),
            last_contact: new Date(),
            ...req.body,
        });

        const createdClient = await db.Client.findByPk(client.id);
        res.status(201).json(createdClient);
    } catch (error) {
        next(error);
    }
});

// Update client
router.put("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const client = await db.Client.findByPk(req.params.id);

        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        // Check business ownership
        if (req.user.businessId && client.business_id !== req.user.businessId) {
            return res.status(403).json({ error: "Access denied" });
        }

        // Update last_contact when client is modified
        req.body.last_contact = new Date();

        await client.update(req.body);

        const updatedClient = await db.Client.findByPk(client.id);
        res.json(updatedClient);
    } catch (error) {
        next(error);
    }
});

// Delete client
router.delete("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const client = await db.Client.findByPk(req.params.id);

        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }

        // Check business ownership
        if (req.user.businessId && client.business_id !== req.user.businessId) {
            return res.status(403).json({ error: "Access denied" });
        }

        await client.destroy();

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// Get client conversations
router.get(
    "/:id/conversations",
    authenticateToken,
    validateId,
    validatePagination,
    async (req, res, next) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const client = await db.Client.findByPk(req.params.id);

            if (!client) {
                return res.status(404).json({ error: "Client not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                client.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            const conversations = await db.Conversation.findAndCountAll({
                where: { client_id: req.params.id },
                include: [
                    {
                        model: db.PlatformSource,
                        as: "platformSource",
                        attributes: ["platform_type", "platform_name"],
                    },
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [["last_activity", "DESC"]],
            });

            res.json({
                conversations: conversations.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(conversations.count / limit),
                    totalItems: conversations.count,
                    itemsPerPage: parseInt(limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get client leads
router.get(
    "/:id/leads",
    authenticateToken,
    validateId,
    async (req, res, next) => {
        try {
            const client = await db.Client.findByPk(req.params.id);

            if (!client) {
                return res.status(404).json({ error: "Client not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                client.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            const leads = await db.Lead.findAll({
                where: { client_id: req.params.id },
                include: [
                    {
                        model: db.Conversation,
                        as: "conversation",
                        attributes: ["id", "current_state"],
                    },
                ],
                order: [["created_at", "DESC"]],
            });

            res.json(leads);
        } catch (error) {
            next(error);
        }
    }
);

// Update client engagement score
router.put(
    "/:id/engagement",
    authenticateToken,
    validateId,
    async (req, res, next) => {
        try {
            const { engagement_score } = req.body;

            if (
                engagement_score === undefined ||
                engagement_score < 0 ||
                engagement_score > 100
            ) {
                return res
                    .status(400)
                    .json({
                        error: "Engagement score must be between 0 and 100",
                    });
            }

            const client = await db.Client.findByPk(req.params.id);

            if (!client) {
                return res.status(404).json({ error: "Client not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                client.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            await client.update({ engagement_score });

            res.json({ engagement_score: client.engagement_score });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
