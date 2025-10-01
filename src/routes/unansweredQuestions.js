const express = require("express");
const router = express.Router();
const { verifyFirebaseToken, requireRoles } = require("../middleware/firebaseAuth");
const { UnansweredQuestion, FaqItem, Business } = require("../models");
const { body, validationResult } = require("express-validator");
const { createChildLogger } = require("../config/logger");

const logger = createChildLogger("unanswered-questions-routes");

/**
 * @swagger
 * components:
 *   schemas:
 *     UnansweredQuestion:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unanswered question ID
 *         business_id:
 *           type: integer
 *           description: Business ID
 *         question_text:
 *           type: string
 *           description: The original question text
 *         normalized_question:
 *           type: string
 *           description: Normalized version for deduplication
 *         frequency:
 *           type: integer
 *           description: How many times this question was asked
 *         first_asked_at:
 *           type: string
 *           format: date-time
 *           description: When the question was first asked
 *         last_asked_at:
 *           type: string
 *           format: date-time
 *           description: When the question was last asked
 *         status:
 *           type: string
 *           enum: [unanswered, resolved, ignored, duplicate]
 *           description: Current status of the question
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Priority level of the question
 *         average_confidence:
 *           type: number
 *           format: float
 *           description: Average confidence score across attempts
 *         language_code:
 *           type: string
 *           description: Language of the question
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     AnswerQuestionRequest:
 *       type: object
 *       required:
 *         - answer
 *         - category
 *       properties:
 *         answer:
 *           type: string
 *           description: The answer to add to FAQ
 *           minLength: 10
 *           maxLength: 2000
 *         category:
 *           type: string
 *           description: FAQ category
 *           enum: [general, pricing, technical, support, other]
 *         language_code:
 *           type: string
 *           description: Language code for the answer
 *           default: en
 */

/**
 * @swagger
 * /api/unanswered-questions:
 *   get:
 *     summary: Get unanswered questions for a business
 *     tags: [Unanswered Questions]
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
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [unanswered, resolved, ignored, duplicate]
 *           default: unanswered
 *         description: Filter by question status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority level
 *       - in: query
 *         name: language_code
 *         schema:
 *           type: string
 *           default: en
 *         description: Filter by language
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [frequency, last_asked_at, created_at, priority]
 *           default: frequency
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of unanswered questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UnansweredQuestion'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
    "/",
    verifyFirebaseToken,
    async (req, res) => {
        try {
            const {
                page = 1,
                limit = 20,
                status = "unanswered",
                priority,
                language_code = "en",
                sort_by = "frequency",
                sort_order = "desc",
            } = req.query;

            logger.info("Getting unanswered questions", {
                userId: req.user.id,
                page,
                limit,
                status,
                priority,
                language_code,
                sort_by,
                sort_order,
            });

            // Get user's business
            const business = await Business.findOne({
                where: { owner_id: req.user.id },
                attributes: ["id"],
            });

            if (!business) {
                logger.warn("Business not found for user", {
                    userId: req.user.id,
                });
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            // Build where clause
            const whereClause = {
                business_id: business.id,
                language_code,
            };

            if (status) {
                whereClause.status = status;
            }

            if (priority) {
                whereClause.priority = priority;
            }

            // Build order clause
            const orderClause = [[sort_by, sort_order.toUpperCase()]];

            // Calculate pagination
            const offset = (parseInt(page) - 1) * parseInt(limit);

            // Get questions with pagination
            const { count, rows: questions } = await UnansweredQuestion.findAndCountAll({
                where: whereClause,
                order: orderClause,
                limit: parseInt(limit),
                offset,
            });

            const totalPages = Math.ceil(count / parseInt(limit));

            logger.info("Retrieved unanswered questions", {
                businessId: business.id,
                userId: req.user.id,
                totalCount: count,
                returnedCount: questions.length,
                page,
                totalPages,
            });

            res.json({
                success: true,
                data: questions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: totalPages,
                },
            });
        } catch (error) {
            logger.error("Get unanswered questions error", {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
            });

            res.status(500).json({
                success: false,
                error: "Internal Server Error",
                message: "Failed to retrieve unanswered questions",
            });
        }
    }
);

/**
 * @swagger
 * /api/unanswered-questions/{id}/answer:
 *   post:
 *     summary: Answer an unanswered question by creating an FAQ
 *     tags: [Unanswered Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unanswered question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnswerQuestionRequest'
 *     responses:
 *       200:
 *         description: Question answered and moved to FAQ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Question answered and moved to FAQ"
 *                 faq:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     question:
 *                       type: string
 *                     answer:
 *                       type: string
 *                     category:
 *                       type: string
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Unanswered question not found
 *       500:
 *         description: Internal server error
 */
router.post(
    "/:id/answer",
    verifyFirebaseToken,
    [
        body("answer")
            .isString()
            .isLength({ min: 10, max: 2000 })
            .withMessage("Answer must be between 10 and 2000 characters"),
        body("category")
            .isIn(["general", "pricing", "technical", "support", "other"])
            .withMessage("Category must be one of: general, pricing, technical, support, other"),
        body("language_code")
            .optional()
            .isString()
            .isLength({ min: 2, max: 5 })
            .withMessage("Language code must be 2-5 characters"),
    ],
    async (req, res) => {
        try {
            const { id } = req.params;
            const { answer, category, language_code = "en" } = req.body;

            logger.info("Answering unanswered question", {
                userId: req.user.id,
                questionId: id,
                answerLength: answer?.length,
                category,
                language_code,
            });

            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logger.warn("Validation errors", {
                    userId: req.user.id,
                    questionId: id,
                    errors: errors.array(),
                });
                return res.status(400).json({
                    success: false,
                    error: "Validation Error",
                    details: errors.array(),
                });
            }

            // Get user's business
            const business = await Business.findOne({
                where: { owner_id: req.user.id },
                attributes: ["id"],
            });

            if (!business) {
                logger.warn("Business not found for user", {
                    userId: req.user.id,
                });
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            // Get the unanswered question
            const unansweredQuestion = await UnansweredQuestion.findOne({
                where: {
                    id: id,
                    business_id: business.id,
                    status: "unanswered",
                },
            });

            if (!unansweredQuestion) {
                logger.warn("Unanswered question not found", {
                    userId: req.user.id,
                    questionId: id,
                    businessId: business.id,
                });
                return res.status(404).json({
                    success: false,
                    error: "Unanswered question not found",
                });
            }

            // Create FAQ item
            const faq = await FaqItem.create({
                business_id: business.id,
                question: unansweredQuestion.question_text,
                answer: answer.trim(),
                category,
                language_code,
                is_active: true,
                usage_count: unansweredQuestion.frequency,
                success_rate: 0.0,
            });

            // Update the unanswered question status
            await unansweredQuestion.update({
                status: "resolved",
                resolution_notes: `Converted to FAQ ID: ${faq.id}`,
                resolved_at: new Date(),
                resolved_by: req.user.id,
            });

            logger.info("Successfully answered question and created FAQ", {
                userId: req.user.id,
                questionId: id,
                faqId: faq.id,
                businessId: business.id,
                frequency: unansweredQuestion.frequency,
            });

            res.json({
                success: true,
                message: "Question answered and moved to FAQ",
                faq: {
                    id: faq.id,
                    question: faq.question,
                    answer: faq.answer,
                    category: faq.category,
                    language_code: faq.language_code,
                },
                unanswered_question: {
                    id: unansweredQuestion.id,
                    status: unansweredQuestion.status,
                    resolved_at: unansweredQuestion.resolved_at,
                },
            });
        } catch (error) {
            logger.error("Answer question error", {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
                questionId: req.params.id,
                requestBody: {
                    answerLength: req.body?.answer?.length,
                    category: req.body?.category,
                    language_code: req.body?.language_code,
                },
            });

            res.status(500).json({
                success: false,
                error: "Internal Server Error",
                message: "Failed to answer question",
            });
        }
    }
);

/**
 * @swagger
 * /api/unanswered-questions/{id}/ignore:
 *   put:
 *     summary: Mark an unanswered question as ignored
 *     tags: [Unanswered Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unanswered question ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Optional notes for why the question is being ignored
 *     responses:
 *       200:
 *         description: Question marked as ignored
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Unanswered question not found
 *       500:
 *         description: Internal server error
 */
router.put(
    "/:id/ignore",
    verifyFirebaseToken,
    [
        body("notes")
            .optional()
            .isString()
            .isLength({ max: 500 })
            .withMessage("Notes must be less than 500 characters"),
    ],
    async (req, res) => {
        try {
            const { id } = req.params;
            const { notes } = req.body;

            logger.info("Ignoring unanswered question", {
                userId: req.user.id,
                questionId: id,
                notesLength: notes?.length,
            });

            // Get user's business
            const business = await Business.findOne({
                where: { owner_id: req.user.id },
                attributes: ["id"],
            });

            if (!business) {
                logger.warn("Business not found for user", {
                    userId: req.user.id,
                });
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            // Get the unanswered question
            const unansweredQuestion = await UnansweredQuestion.findOne({
                where: {
                    id: id,
                    business_id: business.id,
                    status: "unanswered",
                },
            });

            if (!unansweredQuestion) {
                logger.warn("Unanswered question not found", {
                    userId: req.user.id,
                    questionId: id,
                    businessId: business.id,
                });
                return res.status(404).json({
                    success: false,
                    error: "Unanswered question not found",
                });
            }

            // Update the unanswered question status
            await unansweredQuestion.update({
                status: "ignored",
                resolution_notes: notes || "Marked as ignored",
                resolved_at: new Date(),
                resolved_by: req.user.id,
            });

            logger.info("Successfully ignored question", {
                userId: req.user.id,
                questionId: id,
                businessId: business.id,
            });

            res.json({
                success: true,
                message: "Question marked as ignored",
                unanswered_question: {
                    id: unansweredQuestion.id,
                    status: unansweredQuestion.status,
                    resolved_at: unansweredQuestion.resolved_at,
                },
            });
        } catch (error) {
            logger.error("Ignore question error", {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
                questionId: req.params.id,
            });

            res.status(500).json({
                success: false,
                error: "Internal Server Error",
                message: "Failed to ignore question",
            });
        }
    }
);

/**
 * @swagger
 * /api/unanswered-questions/stats:
 *   get:
 *     summary: Get unanswered questions statistics
 *     tags: [Unanswered Questions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unanswered questions statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_unanswered:
 *                       type: integer
 *                     total_resolved:
 *                       type: integer
 *                     total_ignored:
 *                       type: integer
 *                     by_priority:
 *                       type: object
 *                       properties:
 *                         critical:
 *                           type: integer
 *                         high:
 *                           type: integer
 *                         medium:
 *                           type: integer
 *                         low:
 *                           type: integer
 *                     by_language:
 *                       type: object
 *                     most_frequent:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           question_text:
 *                             type: string
 *                           frequency:
 *                             type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
    "/stats",
    verifyFirebaseToken,
    async (req, res) => {
        try {
            logger.info("Getting unanswered questions stats", {
                userId: req.user.id,
            });

            // Get user's business
            const business = await Business.findOne({
                where: { owner_id: req.user.id },
                attributes: ["id"],
            });

            if (!business) {
                logger.warn("Business not found for user", {
                    userId: req.user.id,
                });
                return res.status(404).json({
                    success: false,
                    error: "Business not found",
                });
            }

            // Get statistics
            const [
                totalUnanswered,
                totalResolved,
                totalIgnored,
                byPriority,
                byLanguage,
                mostFrequent,
            ] = await Promise.all([
                UnansweredQuestion.count({
                    where: { business_id: business.id, status: "unanswered" },
                }),
                UnansweredQuestion.count({
                    where: { business_id: business.id, status: "resolved" },
                }),
                UnansweredQuestion.count({
                    where: { business_id: business.id, status: "ignored" },
                }),
                UnansweredQuestion.findAll({
                    where: { business_id: business.id },
                    attributes: [
                        "priority",
                        [require("sequelize").fn("COUNT", "*"), "count"],
                    ],
                    group: ["priority"],
                    raw: true,
                }),
                UnansweredQuestion.findAll({
                    where: { business_id: business.id },
                    attributes: [
                        "language_code",
                        [require("sequelize").fn("COUNT", "*"), "count"],
                    ],
                    group: ["language_code"],
                    raw: true,
                }),
                UnansweredQuestion.findAll({
                    where: { business_id: business.id },
                    attributes: ["question_text", "frequency"],
                    order: [["frequency", "DESC"]],
                    limit: 5,
                }),
            ]);

            // Format priority stats
            const priorityStats = {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0,
            };

            byPriority.forEach((item) => {
                priorityStats[item.priority] = parseInt(item.count);
            });

            // Format language stats
            const languageStats = {};
            byLanguage.forEach((item) => {
                languageStats[item.language_code] = parseInt(item.count);
            });

            const stats = {
                total_unanswered: totalUnanswered,
                total_resolved: totalResolved,
                total_ignored: totalIgnored,
                by_priority: priorityStats,
                by_language: languageStats,
                most_frequent: mostFrequent,
            };

            logger.info("Retrieved unanswered questions stats", {
                businessId: business.id,
                userId: req.user.id,
                stats,
            });

            res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            logger.error("Get unanswered questions stats error", {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
            });

            res.status(500).json({
                success: false,
                error: "Internal Server Error",
                message: "Failed to retrieve statistics",
            });
        }
    }
);

module.exports = router;
