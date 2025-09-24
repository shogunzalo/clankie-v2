const express = require("express");
const router = express.Router();
const db = require("../models");
const { authenticateToken } = require("../middleware/auth");
const {
    validateFaqItem,
    validateId,
    validatePagination,
} = require("../middleware/validation");

// Get all FAQ items for a business
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

            const faqItems = await db.FaqItem.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: db.FaqKeyword,
                        as: "keywords",
                        attributes: ["keyword", "weight"],
                    },
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [
                    ["usage_count", "DESC"],
                    ["created_at", "DESC"],
                ],
            });

            res.json({
                faqItems: faqItems.rows,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(faqItems.count / limit),
                    totalItems: faqItems.count,
                    itemsPerPage: parseInt(limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get FAQ item by ID
router.get("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const faqItem = await db.FaqItem.findByPk(req.params.id, {
            include: [
                {
                    model: db.FaqKeyword,
                    as: "keywords",
                    attributes: ["id", "keyword", "weight"],
                },
            ],
        });

        if (!faqItem) {
            return res.status(404).json({ error: "FAQ item not found" });
        }

        // Check business ownership
        if (
            req.user.businessId &&
            faqItem.business_id !== req.user.businessId
        ) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json(faqItem);
    } catch (error) {
        next(error);
    }
});

// Create new FAQ item
router.post("/", authenticateToken, validateFaqItem, async (req, res, next) => {
    try {
        const { business_id, keywords } = req.body;

        // Use business_id from user if not provided
        const finalBusinessId = business_id || req.user.businessId;

        if (!finalBusinessId) {
            return res.status(400).json({ error: "Business ID is required" });
        }

        const faqItem = await db.FaqItem.create({
            business_id: finalBusinessId,
            ...req.body,
        });

        // Add keywords if provided
        if (keywords && Array.isArray(keywords)) {
            const keywordPromises = keywords.map((keyword) =>
                db.FaqKeyword.create({
                    faq_id: faqItem.id,
                    keyword:
                        typeof keyword === "string" ? keyword : keyword.keyword,
                    weight: typeof keyword === "object" ? keyword.weight : 1.0,
                })
            );
            await Promise.all(keywordPromises);
        }

        const createdFaqItem = await db.FaqItem.findByPk(faqItem.id, {
            include: [
                {
                    model: db.FaqKeyword,
                    as: "keywords",
                    attributes: ["id", "keyword", "weight"],
                },
            ],
        });

        res.status(201).json(createdFaqItem);
    } catch (error) {
        next(error);
    }
});

// Update FAQ item
router.put("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const faqItem = await db.FaqItem.findByPk(req.params.id);

        if (!faqItem) {
            return res.status(404).json({ error: "FAQ item not found" });
        }

        // Check business ownership
        if (
            req.user.businessId &&
            faqItem.business_id !== req.user.businessId
        ) {
            return res.status(403).json({ error: "Access denied" });
        }

        await faqItem.update(req.body);

        const updatedFaqItem = await db.FaqItem.findByPk(faqItem.id, {
            include: [
                {
                    model: db.FaqKeyword,
                    as: "keywords",
                    attributes: ["id", "keyword", "weight"],
                },
            ],
        });

        res.json(updatedFaqItem);
    } catch (error) {
        next(error);
    }
});

// Delete FAQ item
router.delete("/:id", authenticateToken, validateId, async (req, res, next) => {
    try {
        const faqItem = await db.FaqItem.findByPk(req.params.id);

        if (!faqItem) {
            return res.status(404).json({ error: "FAQ item not found" });
        }

        // Check business ownership
        if (
            req.user.businessId &&
            faqItem.business_id !== req.user.businessId
        ) {
            return res.status(403).json({ error: "Access denied" });
        }

        await faqItem.destroy();

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// Add keyword to FAQ item
router.post(
    "/:id/keywords",
    authenticateToken,
    validateId,
    async (req, res, next) => {
        try {
            const { keyword, weight = 1.0 } = req.body;

            if (!keyword) {
                return res.status(400).json({ error: "Keyword is required" });
            }

            const faqItem = await db.FaqItem.findByPk(req.params.id);

            if (!faqItem) {
                return res.status(404).json({ error: "FAQ item not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                faqItem.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            const keywordRecord = await db.FaqKeyword.create({
                faq_id: req.params.id,
                keyword,
                weight,
            });

            res.status(201).json(keywordRecord);
        } catch (error) {
            next(error);
        }
    }
);

// Remove keyword from FAQ item
router.delete(
    "/:id/keywords/:keywordId",
    authenticateToken,
    validateId,
    async (req, res, next) => {
        try {
            const faqItem = await db.FaqItem.findByPk(req.params.id);

            if (!faqItem) {
                return res.status(404).json({ error: "FAQ item not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                faqItem.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            const keyword = await db.FaqKeyword.findOne({
                where: {
                    id: req.params.keywordId,
                    faq_id: req.params.id,
                },
            });

            if (!keyword) {
                return res.status(404).json({ error: "Keyword not found" });
            }

            await keyword.destroy();

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

// Record FAQ usage (for analytics)
router.post(
    "/:id/usage",
    authenticateToken,
    validateId,
    async (req, res, next) => {
        try {
            const { success = true } = req.body;

            const faqItem = await db.FaqItem.findByPk(req.params.id);

            if (!faqItem) {
                return res.status(404).json({ error: "FAQ item not found" });
            }

            // Check business ownership
            if (
                req.user.businessId &&
                faqItem.business_id !== req.user.businessId
            ) {
                return res.status(403).json({ error: "Access denied" });
            }

            // Update usage statistics
            await faqItem.increment("usage_count");
            await faqItem.update({
                last_used: new Date(),
                success_rate: success
                    ? (faqItem.success_rate * faqItem.usage_count + 100) /
                      (faqItem.usage_count + 1)
                    : (faqItem.success_rate * faqItem.usage_count) /
                      (faqItem.usage_count + 1),
            });

            res.json({ message: "Usage recorded successfully" });
        } catch (error) {
            next(error);
        }
    }
);

// Search FAQ items
router.get("/search/:query", authenticateToken, async (req, res, next) => {
    try {
        const { query } = req.params;
        const { business_id, language_code, limit = 10 } = req.query;

        const whereClause = {
            [db.Sequelize.Op.or]: [
                { question: { [db.Sequelize.Op.iLike]: `%${query}%` } },
                { answer: { [db.Sequelize.Op.iLike]: `%${query}%` } },
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

        const faqItems = await db.FaqItem.findAll({
            where: whereClause,
            include: [
                {
                    model: db.FaqKeyword,
                    as: "keywords",
                    attributes: ["keyword", "weight"],
                },
            ],
            limit: parseInt(limit),
            order: [
                ["usage_count", "DESC"],
                ["success_rate", "DESC"],
            ],
        });

        res.json(faqItems);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
