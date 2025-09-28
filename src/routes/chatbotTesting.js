"use strict";

const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");
const ChatbotTestingService = require("../services/chatbotTestingService");
const { verifyFirebaseToken } = require("../middleware/firebaseAuth");
const { createChildLogger } = require("../config/logger");

const logger = createChildLogger("chatbot-testing-routes");
const chatbotTestingService = new ChatbotTestingService();

/**
 * @swagger
 * /api/v1/chatbot-testing/sessions:
 *   post:
 *     summary: Create a new test session
 *     tags: [Chatbot Testing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - business_id
 *             properties:
 *               business_id:
 *                 type: integer
 *                 description: Business ID
 *               session_name:
 *                 type: string
 *                 description: Name for the test session
 *               scenario_type:
 *                 type: string
 *                 enum: [manual, automated, bulk]
 *                 default: manual
 *                 description: Type of testing scenario
 *               metadata:
 *                 type: object
 *                 description: Additional metadata for the session
 *     responses:
 *       201:
 *         description: Test session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 session:
 *                   $ref: '#/components/schemas/TestSession'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
    "/sessions",
    verifyFirebaseToken,
    [
        body("business_id")
            .isInt()
            .withMessage("Business ID must be an integer"),
        body("session_name").optional().isString().isLength({ max: 255 }),
        body("scenario_type").optional().isIn(["manual", "automated", "bulk"]),
        body("metadata").optional().isObject(),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                });
            }

            const { business_id, session_name, scenario_type, metadata } =
                req.body;

            logger.info("Creating test session", {
                userId: req.user.id,
                businessId: business_id,
                sessionName: session_name,
                scenarioType: scenario_type,
            });

            const result = await chatbotTestingService.createTestSession({
                businessId: business_id,
                sessionName: session_name,
                scenarioType: scenario_type,
                metadata,
            });

            res.status(201).json(result);
        } catch (error) {
            logger.error("Failed to create test session", {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
                requestBody: req.body,
            });

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
 * /api/v1/chatbot-testing/sessions/{sessionId}/messages:
 *   post:
 *     summary: Send a message in a test session
 *     tags: [Chatbot Testing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Test session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - business_id
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message to process
 *               business_id:
 *                 type: integer
 *                 description: Business ID
 *               language:
 *                 type: string
 *                 default: en
 *                 description: Language code
 *     responses:
 *       200:
 *         description: Message processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 response:
 *                   type: string
 *                 confidence_score:
 *                   type: number
 *                 is_answered:
 *                   type: boolean
 *                 response_time:
 *                   type: integer
 *                 context_sources:
 *                   type: array
 *                 security_validation:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.post(
    "/sessions/:sessionId/messages",
    verifyFirebaseToken,
    [
        param("sessionId").isInt().withMessage("Session ID must be an integer"),
        body("message")
            .isString()
            .isLength({ min: 1, max: 1000 })
            .withMessage("Message must be between 1 and 1000 characters"),
        body("business_id")
            .isInt()
            .withMessage("Business ID must be an integer"),
        body("language").optional().isString().isLength({ min: 2, max: 5 }),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                });
            }

            const { sessionId } = req.params;
            const { message, business_id, language } = req.body;

            logger.info("Processing test message", {
                userId: req.user.id,
                sessionId,
                businessId: business_id,
                messageLength: message?.length,
                language,
            });

            const result = await chatbotTestingService.processMessage({
                message,
                sessionId: parseInt(sessionId),
                businessId: business_id,
                language,
                userContext: {
                    userId: req.user.id,
                    userEmail: req.user.email,
                },
            });

            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            logger.error("Failed to process test message", {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
                sessionId: req.params.sessionId,
                requestBody: req.body,
            });

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
 * /api/v1/chatbot-testing/sessions/{sessionId}:
 *   get:
 *     summary: Get test session statistics
 *     tags: [Chatbot Testing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Test session ID
 *     responses:
 *       200:
 *         description: Session statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   $ref: '#/components/schemas/TestSession'
 *                 statistics:
 *                   type: object
 *                 messages:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       500:
 *         description: Internal server error
 */
router.get(
    "/sessions/:sessionId",
    verifyFirebaseToken,
    [param("sessionId").isInt().withMessage("Session ID must be an integer")],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                });
            }

            const { sessionId } = req.params;

            logger.info("Getting session statistics", {
                userId: req.user.id,
                sessionId,
            });

            const result = await chatbotTestingService.getSessionStats(
                parseInt(sessionId)
            );

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            logger.error("Failed to get session statistics", {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
                sessionId: req.params.sessionId,
            });

            if (error.message === "Session not found") {
                res.status(404).json({
                    success: false,
                    error: "Session not found",
                    code: "SESSION_NOT_FOUND",
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    code: "INTERNAL_ERROR",
                });
            }
        }
    }
);

/**
 * @swagger
 * /api/v1/chatbot-testing/unanswered-questions:
 *   get:
 *     summary: Get unanswered questions for a business
 *     tags: [Chatbot Testing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: business_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [unanswered, resolved, ignored, duplicate]
 *         description: Filter by question status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority
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
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Unanswered questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UnansweredQuestion'
 *                 pagination:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
    "/unanswered-questions",
    verifyFirebaseToken,
    [
        query("business_id")
            .isInt()
            .withMessage("Business ID must be an integer"),
        query("status")
            .optional()
            .isIn(["unanswered", "resolved", "ignored", "duplicate"]),
        query("priority")
            .optional()
            .isIn(["low", "medium", "high", "critical"]),
        query("page").optional().isInt({ min: 1 }),
        query("limit").optional().isInt({ min: 1, max: 100 }),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: "Validation failed",
                    details: errors.array(),
                });
            }

            const {
                business_id,
                status = "unanswered",
                priority,
                page = 1,
                limit = 20,
            } = req.query;

            logger.info("Getting unanswered questions", {
                userId: req.user.id,
                businessId: business_id,
                status,
                priority,
                page,
                limit,
            });

            // This would be implemented in the service
            // For now, return a placeholder response
            res.json({
                success: true,
                data: [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0,
                    pages: 0,
                },
            });
        } catch (error) {
            logger.error("Failed to get unanswered questions", {
                error: error.message,
                stack: error.stack,
                userId: req.user?.id,
                query: req.query,
            });

            res.status(500).json({
                success: false,
                error: "Internal server error",
                code: "INTERNAL_ERROR",
            });
        }
    }
);

module.exports = router;
