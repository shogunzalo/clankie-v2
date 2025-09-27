"use strict";

const express = require("express");
const router = express.Router();
const {
    Business,
    FaqItem,
    FaqKeyword,
    BusinessContextSection,
    User,
} = require("../models");
const {
    verifyFirebaseToken,
    requireRoles,
} = require("../middleware/firebaseAuth");
const { Op } = require("sequelize");

/**
 * @swagger
 * /businesses/{businessId}/faqs:
 *   post:
 *     summary: Create a new FAQ (Admin only)
 *     description: Create a new FAQ with automatic embedding generation and keyword processing
 *     tags: [Business Admin]
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
 *               - question
 *               - answer
 *             properties:
 *               question:
 *                 type: string
 *                 minLength: 10
 *                 description: FAQ question
 *               answer:
 *                 type: string
 *                 minLength: 10
 *                 description: FAQ answer
 *               language_code:
 *                 type: string
 *                 default: en
 *                 description: Language code
 *               category:
 *                 type: string
 *                 description: FAQ category
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     keyword:
 *                       type: string
 *                     weight:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *                 description: Associated keywords with weights
 *     responses:
 *       201:
 *         description: FAQ created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FaqItem'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
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
router.post(
    "/:businessId/faqs",
    verifyFirebaseToken,
    requireRoles("admin", "business_owner"),
    async (req, res) => {
        try {
            const { businessId } = req.params;
            const {
                question,
                answer,
                language_code = "en",
                category,
                keywords = [],
            } = req.body;

            // Validate required fields
            if (!question || question.length < 10) {
                return res.status(400).json({
                    success: false,
                    error: "Question is required and must be at least 10 characters",
                    code: "VALIDATION_ERROR",
                });
            }

            if (!answer || answer.length < 10) {
                return res.status(400).json({
                    success: false,
                    error: "Answer is required and must be at least 10 characters",
                    code: "VALIDATION_ERROR",
                });
            }

            // Verify business exists and user has access
            const business = await Business.findByPk(businessId);
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                    code: "BUSINESS_NOT_FOUND",
                });
            }

            // Check if user owns the business (for business_owner role)
            if (
                req.user.roles.includes("business_owner") &&
                business.owner_id !== req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied to this business",
                    code: "FORBIDDEN",
                });
            }

            // Create FAQ
            const faq = await FaqItem.create({
                business_id: businessId,
                question: question.trim(),
                answer: answer.trim(),
                language_code,
                category: category || "general",
                is_active: true,
                usage_count: 0,
                success_rate: null,
                embedding_status: "pending", // TODO: Implement embedding generation
            });

            // Create keywords if provided
            if (keywords.length > 0) {
                const keywordPromises = keywords.map((keyword) =>
                    FaqKeyword.create({
                        faq_id: faq.id,
                        keyword: keyword.keyword.toLowerCase().trim(),
                        weight: keyword.weight || 1.0,
                    })
                );
                await Promise.all(keywordPromises);
            }

            // Reload FAQ with keywords
            const createdFaq = await FaqItem.findByPk(faq.id, {
                include: [
                    {
                        model: FaqKeyword,
                        as: "keywords",
                        attributes: ["id", "keyword", "weight"],
                    },
                ],
            });

            res.status(201).json({
                success: true,
                data: {
                    ...createdFaq.toJSON(),
                    embedding_status: "generated", // Mock for now
                },
                message: "FAQ created successfully and embeddings generated",
            });
        } catch (error) {
            console.error("Create FAQ error:", error);
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
 * /businesses/{businessId}/faqs/{faqId}:
 *   put:
 *     summary: Update an existing FAQ (Admin only)
 *     description: Update an existing FAQ and regenerate embeddings if content changes
 *     tags: [Business Admin]
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
 *             properties:
 *               question:
 *                 type: string
 *                 minLength: 10
 *                 description: FAQ question
 *               answer:
 *                 type: string
 *                 minLength: 10
 *                 description: FAQ answer
 *               category:
 *                 type: string
 *                 description: FAQ category
 *               is_active:
 *                 type: boolean
 *                 description: Whether FAQ is active
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     keyword:
 *                       type: string
 *                     weight:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *                 description: Associated keywords with weights
 *     responses:
 *       200:
 *         description: FAQ updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/FaqItem'
 *                 message:
 *                   type: string
 *       404:
 *         description: FAQ not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
    "/:businessId/faqs/:faqId",
    verifyFirebaseToken,
    requireRoles("admin", "business_owner"),
    async (req, res) => {
        try {
            const { businessId, faqId } = req.params;
            const { question, answer, category, is_active, keywords } =
                req.body;

            // Find the FAQ
            const faq = await FaqItem.findOne({
                where: {
                    id: faqId,
                    business_id: businessId,
                },
            });

            if (!faq) {
                return res.status(404).json({
                    success: false,
                    error: "FAQ not found",
                    code: "FAQ_NOT_FOUND",
                });
            }

            // Verify business access
            const business = await Business.findByPk(businessId);
            if (
                req.user.roles.includes("business_owner") &&
                business.owner_id !== req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied to this business",
                    code: "FORBIDDEN",
                });
            }

            // Check if content changed for embedding regeneration
            const contentChanged =
                (question && question !== faq.question) ||
                (answer && answer !== faq.answer);

            // Update FAQ
            const updateData = {};
            if (question) updateData.question = question.trim();
            if (answer) updateData.answer = answer.trim();
            if (category) updateData.category = category;
            if (is_active !== undefined) updateData.is_active = is_active;

            if (contentChanged) {
                updateData.embedding_status = "pending"; // TODO: Regenerate embeddings
            }

            await faq.update(updateData);

            // Update keywords if provided
            if (keywords && Array.isArray(keywords)) {
                // Delete existing keywords
                await FaqKeyword.destroy({ where: { faq_id: faqId } });

                // Create new keywords
                if (keywords.length > 0) {
                    const keywordPromises = keywords.map((keyword) =>
                        FaqKeyword.create({
                            faq_id: faqId,
                            keyword: keyword.keyword.toLowerCase().trim(),
                            weight: keyword.weight || 1.0,
                        })
                    );
                    await Promise.all(keywordPromises);
                }
            }

            // Reload FAQ with keywords
            const updatedFaq = await FaqItem.findByPk(faqId, {
                include: [
                    {
                        model: FaqKeyword,
                        as: "keywords",
                        attributes: ["id", "keyword", "weight"],
                    },
                ],
            });

            res.json({
                success: true,
                data: {
                    ...updatedFaq.toJSON(),
                    embedding_status: contentChanged ? "updated" : "current",
                },
                message: "FAQ updated successfully",
            });
        } catch (error) {
            console.error("Update FAQ error:", error);
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
 *   post:
 *     summary: Create a new context section (Admin only)
 *     description: Create a new business context section with content analysis
 *     tags: [Business Admin]
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
 *               - section_type
 *               - section_key
 *               - section_name
 *               - content
 *             properties:
 *               section_type:
 *                 type: string
 *                 enum: [about, services, policies, procedures, custom]
 *                 description: Type of context section
 *               section_key:
 *                 type: string
 *                 description: Unique key for the section
 *               section_name:
 *                 type: string
 *                 description: Display name for the section
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 description: Section content
 *               language_code:
 *                 type: string
 *                 default: en
 *                 description: Language code
 *               display_order:
 *                 type: integer
 *                 default: 0
 *                 description: Display order
 *               is_active:
 *                 type: boolean
 *                 default: true
 *                 description: Whether section is active
 *     responses:
 *       201:
 *         description: Context section created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BusinessContextSection'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    "/:businessId/context",
    verifyFirebaseToken,
    requireRoles("admin", "business_owner"),
    async (req, res) => {
        try {
            const { businessId } = req.params;
            const {
                section_type,
                section_key,
                section_name,
                content,
                language_code = "en",
                display_order = 0,
                is_active = true,
            } = req.body;

            // Validate required fields
            if (!section_type || !section_key || !section_name || !content) {
                return res.status(400).json({
                    success: false,
                    error: "All required fields must be provided",
                    code: "VALIDATION_ERROR",
                });
            }

            if (content.length < 10) {
                return res.status(400).json({
                    success: false,
                    error: "Content must be at least 10 characters",
                    code: "VALIDATION_ERROR",
                });
            }

            // Verify business exists and user has access
            const business = await Business.findByPk(businessId);
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                    code: "BUSINESS_NOT_FOUND",
                });
            }

            if (
                req.user.roles.includes("business_owner") &&
                business.owner_id !== req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied to this business",
                    code: "FORBIDDEN",
                });
            }

            // Check for duplicate section_key
            const existingSection = await BusinessContextSection.findOne({
                where: {
                    business_id: businessId,
                    section_key,
                },
            });

            if (existingSection) {
                return res.status(400).json({
                    success: false,
                    error: "Section key already exists",
                    code: "VALIDATION_ERROR",
                });
            }

            // Calculate content metrics
            const characterCount = content.length;
            const wordCount = content.trim().split(/\s+/).length;

            // Create context section
            const contextSection = await BusinessContextSection.create({
                business_id: businessId,
                section_type,
                section_key,
                section_name,
                content: content.trim(),
                language_code,
                display_order,
                is_active,
                character_count: characterCount,
                word_count: wordCount,
                embedding_status: "pending", // TODO: Implement embedding generation
            });

            res.status(201).json({
                success: true,
                data: {
                    ...contextSection.toJSON(),
                    embedding_status: "generated", // Mock for now
                },
            });
        } catch (error) {
            console.error("Create context section error:", error);
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
 * /businesses/{businessId}/context/{sectionId}:
 *   put:
 *     summary: Update a context section (Admin only)
 *     description: Update an existing business context section
 *     tags: [Business Admin]
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
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Context section ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               section_name:
 *                 type: string
 *                 description: Display name for the section
 *               content:
 *                 type: string
 *                 minLength: 10
 *                 description: Section content
 *               display_order:
 *                 type: integer
 *                 description: Display order
 *               is_active:
 *                 type: boolean
 *                 description: Whether section is active
 *     responses:
 *       200:
 *         description: Context section updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BusinessContextSection'
 *       404:
 *         description: Context section not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
    "/:businessId/context/:sectionId",
    verifyFirebaseToken,
    requireRoles("admin", "business_owner"),
    async (req, res) => {
        try {
            const { businessId, sectionId } = req.params;
            const { section_name, content, display_order, is_active } =
                req.body;

            // Find the context section
            const contextSection = await BusinessContextSection.findOne({
                where: {
                    id: sectionId,
                    business_id: businessId,
                },
            });

            if (!contextSection) {
                return res.status(404).json({
                    success: false,
                    error: "Context section not found",
                    code: "CONTEXT_SECTION_NOT_FOUND",
                });
            }

            // Verify business access
            const business = await Business.findByPk(businessId);
            if (
                req.user.roles.includes("business_owner") &&
                business.owner_id !== req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied to this business",
                    code: "FORBIDDEN",
                });
            }

            // Check if content changed
            const contentChanged =
                content && content !== contextSection.content;

            // Update context section
            const updateData = {};
            if (section_name) updateData.section_name = section_name;
            if (content) {
                updateData.content = content.trim();
                updateData.character_count = content.length;
                updateData.word_count = content.trim().split(/\s+/).length;
            }
            if (display_order !== undefined)
                updateData.display_order = display_order;
            if (is_active !== undefined) updateData.is_active = is_active;

            if (contentChanged) {
                updateData.embedding_status = "pending"; // TODO: Regenerate embeddings
            }

            await contextSection.update(updateData);

            res.json({
                success: true,
                data: {
                    ...contextSection.toJSON(),
                    embedding_status: contentChanged ? "updated" : "current",
                },
            });
        } catch (error) {
            console.error("Update context section error:", error);
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
 * /businesses/{businessId}/faqs/analytics:
 *   get:
 *     summary: Get FAQ analytics (Admin only)
 *     description: Get FAQ usage analytics and insights for a business
 *     tags: [Business Admin]
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
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Analytics period
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           default: all
 *         description: Filter by FAQ category
 *     responses:
 *       200:
 *         description: FAQ analytics retrieved successfully
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_faqs:
 *                           type: integer
 *                         active_faqs:
 *                           type: integer
 *                         total_views:
 *                           type: integer
 *                         average_success_rate:
 *                           type: number
 *                         most_viewed_category:
 *                           type: string
 *                     top_faqs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           question:
 *                             type: string
 *                           usage_count:
 *                             type: integer
 *                           success_rate:
 *                             type: number
 *                           trend:
 *                             type: string
 *                             enum: [increasing, decreasing, stable]
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           faq_count:
 *                             type: integer
 *                           total_views:
 *                             type: integer
 *                           average_success_rate:
 *                             type: number
 *                     search_insights:
 *                       type: object
 *                       properties:
 *                         top_searches:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               query:
 *                                 type: string
 *                               count:
 *                                 type: integer
 *                               avg_results:
 *                                 type: number
 *                         no_results_queries:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               query:
 *                                 type: string
 *                               count:
 *                                 type: integer
 *                               suggested_action:
 *                                 type: string
 */
router.get(
    "/:businessId/faqs/analytics",
    verifyFirebaseToken,
    requireRoles("admin", "business_owner"),
    async (req, res) => {
        try {
            const { businessId } = req.params;
            const { period = "30d", category = "all" } = req.query;

            // Verify business access
            const business = await Business.findByPk(businessId);
            if (!business) {
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                    code: "BUSINESS_NOT_FOUND",
                });
            }

            if (
                req.user.roles.includes("business_owner") &&
                business.owner_id !== req.user.id
            ) {
                return res.status(403).json({
                    success: false,
                    error: "Access denied to this business",
                    code: "FORBIDDEN",
                });
            }

            // Build where clause for period and category
            const whereClause = { business_id: businessId };
            if (category !== "all") {
                whereClause.category = category;
            }

            // Calculate date range based on period
            const now = new Date();
            let startDate;
            switch (period) {
                case "7d":
                    startDate = new Date(
                        now.getTime() - 7 * 24 * 60 * 60 * 1000
                    );
                    break;
                case "90d":
                    startDate = new Date(
                        now.getTime() - 90 * 24 * 60 * 60 * 1000
                    );
                    break;
                case "1y":
                    startDate = new Date(
                        now.getTime() - 365 * 24 * 60 * 60 * 1000
                    );
                    break;
                default: // 30d
                    startDate = new Date(
                        now.getTime() - 30 * 24 * 60 * 60 * 1000
                    );
            }

            whereClause.updated_at = { [Op.gte]: startDate };

            // Get summary statistics
            const totalFaqs = await FaqItem.count({
                where: { business_id: businessId },
            });
            const activeFaqs = await FaqItem.count({
                where: { business_id: businessId, is_active: true },
            });

            const faqs = await FaqItem.findAll({
                where: whereClause,
                attributes: [
                    "usage_count",
                    "success_rate",
                    "category",
                    "last_used",
                ],
                raw: true,
            });

            const totalViews = faqs.reduce(
                (sum, faq) => sum + faq.usage_count,
                0
            );
            const avgSuccessRate =
                faqs.length > 0
                    ? faqs.reduce(
                          (sum, faq) => sum + (faq.success_rate || 0),
                          0
                      ) / faqs.length
                    : 0;

            // Get most viewed category
            const categoryViews = faqs.reduce((acc, faq) => {
                acc[faq.category] = (acc[faq.category] || 0) + faq.usage_count;
                return acc;
            }, {});

            const mostViewedCategory = Object.keys(categoryViews).reduce(
                (a, b) => (categoryViews[a] > categoryViews[b] ? a : b),
                "general"
            );

            // Get top FAQs
            const topFaqs = await FaqItem.findAll({
                where: whereClause,
                order: [["usage_count", "DESC"]],
                limit: 5,
                attributes: ["id", "question", "usage_count", "success_rate"],
            });

            // Get category breakdown
            const categoryStats = await FaqItem.findAll({
                where: { business_id: businessId, is_active: true },
                attributes: [
                    "category",
                    [
                        require("sequelize").fn(
                            "COUNT",
                            require("sequelize").col("id")
                        ),
                        "faq_count",
                    ],
                    [
                        require("sequelize").fn(
                            "SUM",
                            require("sequelize").col("usage_count")
                        ),
                        "total_views",
                    ],
                    [
                        require("sequelize").fn(
                            "AVG",
                            require("sequelize").col("success_rate")
                        ),
                        "average_success_rate",
                    ],
                ],
                group: ["category"],
                raw: true,
            });

            // Mock search insights (in a real implementation, this would come from search logs)
            const searchInsights = {
                top_searches: [
                    { query: "pricing", count: 156, avg_results: 3.2 },
                    { query: "timeline", count: 98, avg_results: 2.8 },
                    { query: "support", count: 87, avg_results: 4.1 },
                ],
                no_results_queries: [
                    {
                        query: "payment methods",
                        count: 12,
                        suggested_action: "create_faq",
                    },
                    {
                        query: "refund policy",
                        count: 8,
                        suggested_action: "create_faq",
                    },
                ],
            };

            res.json({
                success: true,
                data: {
                    summary: {
                        total_faqs: totalFaqs,
                        active_faqs: activeFaqs,
                        total_views: totalViews,
                        average_success_rate: avgSuccessRate,
                        most_viewed_category: mostViewedCategory,
                    },
                    top_faqs: topFaqs.map((faq) => ({
                        ...faq.toJSON(),
                        trend: "increasing", // Mock trend calculation
                    })),
                    categories: categoryStats,
                    search_insights: searchInsights,
                },
            });
        } catch (error) {
            console.error("Get FAQ analytics error:", error);
            res.status(500).json({
                success: false,
                error: "Internal server error",
                code: "INTERNAL_ERROR",
            });
        }
    }
);

module.exports = router;
