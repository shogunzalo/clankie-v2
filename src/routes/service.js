const express = require("express");
const router = express.Router();
const db = require("../models");
const { authenticateToken } = require("../middleware/auth");
const {
    validateService,
    validateId,
    validatePagination,
} = require("../middleware/validation");

// Get all services for a business
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
                language_code,
                category,
                is_active,
            } = req.query;
            const offset = (page - 1) * limit;

            const whereClause = {};

            if (business_id) {
                whereClause.business_id = business_id;
            } else if (req.user.businessId) {
                whereClause.business_id = req.user.businessId;
            }

            if (language_code) {
                whereClause.language_code = language_code;
            }

            if (category) {
                whereClause.category = category;
            }

            if (is_active !== undefined) {
                whereClause.is_active = is_active === "true";
            }

            const services = await db.Service.findAndCountAll({
                where: whereClause,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [
                    ["display_order", "ASC"],
                    ["service_name", "ASC"],
                ],
            });

            res.json({
                services: services.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(services.count / limit),
                    totalItems: services.count,
                    itemsPerPage: parseInt(limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get service by ID
router.get("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const service = await db.Service.findByPk(req.params.id);

        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }

        // Check business ownership
        if (
            req.user.businessId &&
            service.business_id !== req.user.businessId
        ) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json(service);
    } catch (error) {
        next(error);
    }
});

// Create new service
router.post("/", authenticateToken, validateService, async (req, res, next) => {
    try {
        const { business_id } = req.body;

        // Use business_id from user if not provided
        const finalBusinessId = business_id || req.user.businessId;

        if (!finalBusinessId) {
            return res.status(400).json({ error: "Business ID is required" });
        }

        const service = await db.Service.create({
            business_id: finalBusinessId,
            ...req.body,
        });

        const createdService = await db.Service.findByPk(service.id);
        res.status(201).json(createdService);
    } catch (error) {
        next(error);
    }
});

// Update service
router.put("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const service = await db.Service.findByPk(req.params.id);

        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }

        // Check business ownership
        if (
            req.user.businessId &&
            service.business_id !== req.user.businessId
        ) {
            return res.status(403).json({ error: "Access denied" });
        }

        await service.update(req.body);

        const updatedService = await db.Service.findByPk(service.id);
        res.json(updatedService);
    } catch (error) {
        next(error);
    }
});

// Delete service
router.delete("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const service = await db.Service.findByPk(req.params.id);

        if (!service) {
            return res.status(404).json({ error: "Service not found" });
        }

        // Check business ownership
        if (
            req.user.businessId &&
            service.business_id !== req.user.businessId
        ) {
            return res.status(403).json({ error: "Access denied" });
        }

        await service.destroy();

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// Toggle service active status
router.patch(
    "/:id/toggle",
    authenticateToken,
    validateId,
    async (req, res, next) => {
        try {
            const service = await db.Service.findByPk(req.params.id);

            if (!service) {
                return res.status(404).json({ error: "Service not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                service.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            await service.update({ is_active: !service.is_active });

            res.json({ is_active: service.is_active });
        } catch (error) {
            next(error);
        }
    }
);

// Update service display order
router.patch(
    "/:id/order",
    authenticateToken,
    validateId,
    async (req, res, next) => {
        try {
            const { display_order } = req.body;

            if (display_order === undefined || display_order < 0) {
                return res
                    .status(400)
                    .json({
                        error: "Display order must be a non-negative integer",
                    });
            }

            const service = await db.Service.findByPk(req.params.id);

            if (!service) {
                return res.status(404).json({ error: "Service not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                service.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            await service.update({ display_order });

            res.json({ display_order: service.display_order });
        } catch (error) {
            next(error);
        }
    }
);

// Get services by category
router.get("/category/:category", authenticateToken, async (req, res, next) => {
    try {
        const { category } = req.params;
        const { business_id, language_code } = req.query;

        const whereClause = {
            category,
            is_active: true,
        };

        if (business_id) {
            whereClause.business_id = business_id;
        } else if (req.user.businessId) {
            whereClause.business_id = req.user.businessId;
        }

        if (language_code) {
            whereClause.language_code = language_code;
        }

        const services = await db.Service.findAll({
            where: whereClause,
            order: [
                ["display_order", "ASC"],
                ["service_name", "ASC"],
            ],
        });

        res.json(services);
    } catch (error) {
        next(error);
    }
});

// Search services
router.get("/search/:query", authenticateToken, async (req, res, next) => {
    try {
        const { query } = req.params;
        const { business_id, language_code, limit = 10 } = req.query;

        const whereClause = {
            [db.Sequelize.Op.or]: [
                { service_name: { [db.Sequelize.Op.iLike]: `%${query}%` } },
                { description: { [db.Sequelize.Op.iLike]: `%${query}%` } },
                { category: { [db.Sequelize.Op.iLike]: `%${query}%` } },
            ],
            is_active: true,
        };

        if (business_id) {
            whereClause.business_id = business_id;
        } else if (req.user.businessId) {
            whereClause.business_id = req.user.businessId;
        }

        if (language_code) {
            whereClause.language_code = language_code;
        }

        const services = await db.Service.findAll({
            where: whereClause,
            limit: parseInt(limit),
            order: [
                ["display_order", "ASC"],
                ["service_name", "ASC"],
            ],
        });

        res.json(services);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
