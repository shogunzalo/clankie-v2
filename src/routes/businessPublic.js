"use strict";

const express = require("express");
const router = express.Router();
const {
    Business,
    BusinessLanguage,
    ContactInfo,
    Service,
    FaqItem,
    FaqKeyword,
    BusinessContextSection,
    User,
} = require("../models");
const {
    verifyFirebaseToken,
    requireRoles,
    optionalFirebaseAuth,
} = require("../middleware/firebaseAuth");
const { Op } = require("sequelize");

/**
 * @swagger
 * /businesses/{businessId}/public:
 *   get:
 *     summary: Get business information
 *     description: Get business information for the business page with optional language preference
 *     tags: [Business Public]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           default: en
 *         description: Language code (en, es, fr, etc.)
 *       - in: query
 *         name: include
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [services, contact_info, languages]
 *         description: Additional data to include
 *     responses:
 *       200:
 *         description: Public business information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     company_name:
 *                       type: string
 *                     business_type:
 *                       type: string
 *                     website:
 *                       type: string
 *                     primary_language:
 *                       type: string
 *                     supported_languages:
 *                       type: array
 *                       items:
 *                         type: string
 *                     contact_info:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ContactInfo'
 *                     services:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Service'
 *       404:
 *         description: Business not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:businessId/public", verifyFirebaseToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { lang = "en", include = [] } = req.query;

        // Parse include parameter
        const includeArray = Array.isArray(include)
            ? include
            : include.split(",");

        // Find business with basic info
        const business = await Business.findByPk(businessId, {
            attributes: [
                "id",
                "company_name",
                "business_type",
                "website",
                "primary_language",
                "timezone",
            ],
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        // Get supported languages
        const supportedLanguages = await BusinessLanguage.findAll({
            where: { business_id: businessId },
            attributes: ["language_code"],
            order: [
                ["is_primary", "DESC"],
                ["language_code", "ASC"],
            ],
        });

        const result = {
            id: business.id,
            company_name: business.company_name,
            business_type: business.business_type,
            website: business.website,
            primary_language: business.primary_language,
            supported_languages: supportedLanguages.map(
                (lang) => lang.language_code
            ),
            timezone: business.timezone,
        };

        // Include contact info if requested
        if (includeArray.includes("contact_info")) {
            const contactInfo = await ContactInfo.findAll({
                where: {
                    business_id: businessId,
                    is_active: true,
                },
                attributes: ["id", "info_type", "label", "value", "is_primary"],
                order: [
                    ["is_primary", "DESC"],
                    ["display_order", "ASC"],
                ],
            });

            result.contact_info = contactInfo;
        }

        // Include services if requested
        if (includeArray.includes("services")) {
            const services = await Service.findAll({
                where: {
                    business_id: businessId,
                    is_active: true,
                },
                attributes: [
                    "id",
                    "name as service_name",
                    "description",
                    "price",
                    "category",
                ],
                order: [["display_order", "ASC"]],
            });

            // Add currency and duration_minutes (mock data for now)
            result.services = services.map((service) => ({
                ...service.toJSON(),
                currency: "USD",
                duration_minutes: service.price > 5000 ? 4800 : 2400, // Mock duration based on price
            }));
        }

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Get public business info error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /businesses/{businessId}/faqs:
 *   get:
 *     summary: Get business FAQs
 *     description: Get paginated list of active FAQs for a business with filtering and searching
 *     tags: [Business Public]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           default: en
 *         description: Language code
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by FAQ category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in questions and answers
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [usage_count, success_rate, created_at]
 *           default: usage_count
 *         description: Sort by field
 *     responses:
 *       200:
 *         description: FAQs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     faqs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FaqItem'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     filters:
 *                       type: object
 *                       properties:
 *                         categories:
 *                           type: array
 *                           items:
 *                             type: string
 *                         language:
 *                           type: string
 *                         search_query:
 *                           type: string
 */
router.get("/:businessId/faqs", verifyFirebaseToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const {
            lang = "en",
            category,
            search,
            page = 1,
            limit = 10,
            sort = "usage_count",
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const limitInt = Math.min(parseInt(limit), 50);

        // Build where clause
        const whereClause = {
            business_id: businessId,
            is_active: true,
        };

        if (category) {
            whereClause.category = category;
        }

        if (search) {
            whereClause[Op.or] = [
                { question: { [Op.iLike]: `%${search}%` } },
                { answer: { [Op.iLike]: `%${search}%` } },
            ];
        }

        // Build order clause
        let orderClause;
        switch (sort) {
            case "success_rate":
                orderClause = [
                    ["success_rate", "DESC"],
                    ["usage_count", "DESC"],
                ];
                break;
            case "created_at":
                orderClause = [["created_at", "DESC"]];
                break;
            default:
                orderClause = [
                    ["usage_count", "DESC"],
                    ["success_rate", "DESC"],
                ];
        }

        // Get FAQs with pagination
        const { count, rows: faqs } = await FaqItem.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: FaqKeyword,
                    as: "keywords",
                    attributes: ["keyword", "weight"],
                },
            ],
            limit: limitInt,
            offset,
            order: orderClause,
            attributes: [
                "id",
                "question",
                "answer",
                "category",
                "usage_count",
                "success_rate",
                "last_used",
                "created_at",
            ],
        });

        // Get available categories
        const categories = await FaqItem.findAll({
            where: { business_id: businessId, is_active: true },
            attributes: ["category"],
            group: ["category"],
            raw: true,
        });

        const totalPages = Math.ceil(count / limitInt);

        res.json({
            success: true,
            data: {
                faqs,
                pagination: {
                    page: parseInt(page),
                    limit: limitInt,
                    total: count,
                    pages: totalPages,
                    has_next: parseInt(page) < totalPages,
                    has_previous: parseInt(page) > 1,
                },
                filters: {
                    categories: categories.map((c) => c.category),
                    language: lang,
                    search_query: search || null,
                },
            },
        });
    } catch (error) {
        console.error("Get business FAQs error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /businesses/{businessId}/faqs/search:
 *   post:
 *     summary: Search FAQs with semantic matching
 *     description: Advanced FAQ search with semantic matching using AI embeddings
 *     tags: [Business Public]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query
 *               language:
 *                 type: string
 *                 default: en
 *                 description: Language code
 *               limit:
 *                 type: integer
 *                 default: 5
 *                 maximum: 20
 *                 description: Maximum number of results
 *               threshold:
 *                 type: number
 *                 default: 0.7
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Minimum similarity score
 *               include_similar:
 *                 type: boolean
 *                 default: true
 *                 description: Include semantically similar results
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           faq:
 *                             $ref: '#/components/schemas/FaqItem'
 *                           similarity_score:
 *                             type: number
 *                           match_type:
 *                             type: string
 *                             enum: [exact, semantic, related]
 *                     query_info:
 *                       type: object
 *                       properties:
 *                         original_query:
 *                           type: string
 *                         processed_query:
 *                           type: string
 *                         language:
 *                           type: string
 *                         total_matches:
 *                           type: integer
 */
router.post(
    "/:businessId/faqs/search",
    verifyFirebaseToken,
    async (req, res) => {
        try {
            const { businessId } = req.params;
            const {
                query,
                language = "en",
                limit = 5,
                threshold = 0.7,
                include_similar = true,
            } = req.body;

            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: "Query is required",
                    code: "VALIDATION_ERROR",
                });
            }

            // For now, implement basic text search
            // TODO: Implement semantic search with embeddings
            const searchResults = await FaqItem.findAll({
                where: {
                    business_id: businessId,
                    is_active: true,
                    [Op.or]: [
                        { question: { [Op.iLike]: `%${query}%` } },
                        { answer: { [Op.iLike]: `%${query}%` } },
                    ],
                },
                include: [
                    {
                        model: FaqKeyword,
                        as: "keywords",
                        attributes: ["keyword", "weight"],
                    },
                ],
                limit: Math.min(limit, 20),
                order: [["usage_count", "DESC"]],
                attributes: [
                    "id",
                    "question",
                    "answer",
                    "category",
                    "usage_count",
                    "success_rate",
                ],
            });

            // Mock similarity scores and match types
            const results = searchResults.map((faq, index) => ({
                faq: faq.toJSON(),
                similarity_score: Math.max(0.8 - index * 0.1, threshold),
                match_type: index === 0 ? "exact" : "semantic",
            }));

            res.json({
                success: true,
                data: {
                    results,
                    query_info: {
                        original_query: query,
                        processed_query: query.toLowerCase().trim(),
                        language,
                        total_matches: results.length,
                    },
                },
            });
        } catch (error) {
            console.error("FAQ search error:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                code: "INTERNAL_ERROR",
            });
        }
    }
);

/**
 * @swagger
 * /businesses/{businessId}/context:
 *   get:
 *     summary: Get business context sections
 *     description: Get business context sections organized by type with multilingual support
 *     tags: [Business Public]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: query
 *         name: lang
 *         schema:
 *           type: string
 *           default: en
 *         description: Language code
 *       - in: query
 *         name: section_type
 *         schema:
 *           type: string
 *           enum: [about, services, policies, procedures, custom]
 *         description: Filter by section type
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by active status
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [display_order, created_at]
 *           default: display_order
 *         description: Sort by field
 *     responses:
 *       200:
 *         description: Context sections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sections:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BusinessContextSection'
 *                     section_types:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           sections:
 *                             type: array
 *                             items:
 *                               type: string
 *                     language:
 *                       type: string
 */
router.get("/:businessId/context", verifyFirebaseToken, async (req, res) => {
    try {
        const { businessId } = req.params;
        const {
            lang = "en",
            section_type,
            is_active = true,
            sort = "display_order",
        } = req.query;

        // Build where clause
        const whereClause = {
            business_id: businessId,
        };

        if (is_active !== undefined) {
            whereClause.is_active = is_active === "true";
        }

        if (section_type) {
            whereClause.section_type = section_type;
        }

        // Build order clause
        const orderClause =
            sort === "created_at"
                ? [["created_at", "DESC"]]
                : [
                      ["display_order", "ASC"],
                      ["created_at", "ASC"],
                  ];

        // Get context sections
        const sections = await BusinessContextSection.findAll({
            where: whereClause,
            order: orderClause,
            attributes: [
                "id",
                "section_type",
                "section_key",
                "section_name",
                "content",
                "display_order",
                "character_count",
                "word_count",
                "last_accessed",
            ],
        });

        // Get section type summary
        const sectionTypes = await BusinessContextSection.findAll({
            where: { business_id: businessId, is_active: true },
            attributes: ["section_type", "section_key"],
            group: ["section_type"],
            raw: true,
        });

        const typeSummary = sectionTypes.reduce((acc, item) => {
            const type = item.section_type;
            if (!acc[type]) {
                acc[type] = { type, count: 0, sections: [] };
            }
            acc[type].count++;
            acc[type].sections.push(item.section_key);
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                sections,
                section_types: Object.values(typeSummary),
                language: lang,
            },
        });
    } catch (error) {
        console.error("Get context sections error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /businesses/{businessId}/faqs/{faqId}/track:
 *   post:
 *     summary: Track FAQ usage
 *     description: Track FAQ usage and success rate when FAQ is served to users
 *     tags: [Business Public]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: path
 *         name: faqId
 *         required: true
 *         schema:
 *           type: integer
 *         description: FAQ ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interaction_type
 *             properties:
 *               interaction_type:
 *                 type: string
 *                 enum: [viewed, clicked, helpful, not_helpful]
 *                 description: Type of interaction
 *               was_helpful:
 *                 type: boolean
 *                 description: Whether the FAQ was helpful
 *               user_feedback:
 *                 type: string
 *                 enum: [very_helpful, helpful, neutral, not_helpful, not_at_all_helpful]
 *                 description: User feedback rating
 *               context:
 *                 type: object
 *                 description: Additional context about the interaction
 *                 properties:
 *                   search_query:
 *                     type: string
 *                   conversation_id:
 *                     type: integer
 *                   client_id:
 *                     type: integer
 *     responses:
 *       200:
 *         description: FAQ usage tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     faq_id:
 *                       type: integer
 *                     usage_count:
 *                       type: integer
 *                     success_rate:
 *                       type: number
 *                     last_used:
 *                       type: string
 *                       format: date-time
 */
router.post(
    "/:businessId/faqs/:faqId/track",
    verifyFirebaseToken,
    async (req, res) => {
        try {
            const { businessId, faqId } = req.params;
            const { interaction_type, was_helpful, user_feedback, context } =
                req.body;

            if (!interaction_type) {
                return res.status(400).json({
                    success: false,
                    error: "interaction_type is required",
                    code: "VALIDATION_ERROR",
                });
            }

            // Find the FAQ
            const faq = await FaqItem.findOne({
                where: {
                    id: faqId,
                    business_id: businessId,
                    is_active: true,
                },
            });

            if (!faq) {
                return res.status(404).json({
                    success: false,
                    error: "FAQ not found",
                    code: "FAQ_NOT_FOUND",
                });
            }

            // Update usage statistics
            const updates = {
                usage_count: faq.usage_count + 1,
                last_used: new Date(),
            };

            // Calculate success rate if feedback provided
            if (was_helpful !== undefined || user_feedback) {
                const isPositive =
                    was_helpful === true ||
                    user_feedback === "very_helpful" ||
                    user_feedback === "helpful";

                // Simple moving average for success rate
                const currentRate = faq.success_rate || 0;
                const newRate = isPositive ? 1 : 0;
                updates.success_rate =
                    (currentRate * faq.usage_count + newRate) /
                    (faq.usage_count + 1);
            }

            await faq.update(updates);

            res.json({
                success: true,
                data: {
                    faq_id: faq.id,
                    usage_count: faq.usage_count,
                    success_rate: faq.success_rate,
                    last_used: faq.last_used,
                },
            });
        } catch (error) {
            console.error("Track FAQ usage error:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                code: "INTERNAL_ERROR",
            });
        }
    }
);

module.exports = router;
