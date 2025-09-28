"use strict";

const express = require("express");
const router = express.Router();
const { Business, UnansweredQuestion } = require("../models");
const { verifyFirebaseToken } = require("../middleware/firebaseAuth");
const { createChildLogger } = require("../config/logger");

const logger = createChildLogger("business-settings-tools");

/**
 * @swagger
 * /api/business/tool-functions:
 *   get:
 *     summary: Get AI tool functions
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tool functions retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       is_enabled:
 *                         type: boolean
 *                       category:
 *                         type: string
 *                       last_used:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", verifyFirebaseToken, async (req, res) => {
    try {
        logger.info("Getting tool functions for user", { userId: req.user.id });

        const business = await Business.findOne({
            where: { owner_id: req.user.id },
            attributes: ["ai_tool_functions"],
        });

        if (!business) {
            logger.warn("Business not found for user", { userId: req.user.id });
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        logger.debug("Found business for tool functions", {
            businessId: business.id,
            userId: req.user.id,
        });

        // Default tool functions
        const defaultToolFunctions = [
            {
                id: "auto_response",
                name: "Auto Response Generator",
                description:
                    "Automatically generate responses to common customer inquiries",
                is_enabled: true,
                category: "communication",
                last_used: null,
            },
            {
                id: "sentiment_analysis",
                name: "Sentiment Analysis",
                description: "Analyze customer sentiment in messages",
                is_enabled: true,
                category: "analytics",
                last_used: null,
            },
            {
                id: "intent_classification",
                name: "Intent Classification",
                description: "Classify customer intent from messages",
                is_enabled: true,
                category: "analytics",
                last_used: null,
            },
            {
                id: "lead_scoring",
                name: "Lead Scoring",
                description: "Score leads based on conversation quality",
                is_enabled: false,
                category: "sales",
                last_used: null,
            },
            {
                id: "appointment_scheduler",
                name: "Appointment Scheduler",
                description: "Schedule appointments with customers",
                is_enabled: false,
                category: "productivity",
                last_used: null,
            },
        ];

        const toolFunctions =
            business.ai_tool_functions || defaultToolFunctions;

        logger.info("Retrieved tool functions successfully", {
            businessId: business.id,
            userId: req.user.id,
            toolCount: toolFunctions.length,
            usingDefaults: !business.ai_tool_functions,
        });

        res.json({
            success: true,
            data: toolFunctions,
        });
    } catch (error) {
        logger.error("Get tool functions error", {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id,
        });
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/business/tool-functions/{id}:
 *   put:
 *     summary: Update tool function (enable/disable)
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tool function ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_enabled:
 *                 type: boolean
 *               configuration:
 *                 type: object
 *                 description: Tool-specific configuration
 *     responses:
 *       200:
 *         description: Tool function updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Tool function not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_enabled, configuration } = req.body;

        const business = await Business.findOne({
            where: { owner_id: req.user.id },
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        const currentFunctions = business.ai_tool_functions || [];
        const functionIndex = currentFunctions.findIndex(
            (func) => func.id === id
        );

        if (functionIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Tool function not found",
                code: "TOOL_FUNCTION_NOT_FOUND",
            });
        }

        // Update the specific function
        currentFunctions[functionIndex] = {
            ...currentFunctions[functionIndex],
            is_enabled:
                is_enabled !== undefined
                    ? is_enabled
                    : currentFunctions[functionIndex].is_enabled,
            configuration:
                configuration || currentFunctions[functionIndex].configuration,
            updated_at: new Date(),
        };

        await business.update({ ai_tool_functions: currentFunctions });

        res.json({
            success: true,
            data: currentFunctions[functionIndex],
        });
    } catch (error) {
        console.error("Update tool function error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/business/tool-functions/{id}/test:
 *   post:
 *     summary: Test tool function
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tool function ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               test_input:
 *                 type: string
 *                 description: Test input for the tool function
 *               parameters:
 *                 type: object
 *                 description: Additional parameters for testing
 *     responses:
 *       200:
 *         description: Tool function test completed
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
 *                     test_result:
 *                       type: string
 *                     execution_time:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [success, error, warning]
 *       404:
 *         description: Tool function not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/:id/test", verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { test_input, parameters } = req.body;

        const business = await Business.findOne({
            where: { owner_id: req.user.id },
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        const currentFunctions = business.ai_tool_functions || [];
        const toolFunction = currentFunctions.find((func) => func.id === id);

        if (!toolFunction) {
            return res.status(404).json({
                success: false,
                error: "Tool function not found",
                code: "TOOL_FUNCTION_NOT_FOUND",
            });
        }

        if (!toolFunction.is_enabled) {
            return res.status(400).json({
                success: false,
                error: "Tool function is disabled",
                code: "TOOL_FUNCTION_DISABLED",
            });
        }

        // Mock test execution (in real implementation, this would call the actual tool function)
        const startTime = Date.now();

        // Simulate different test results based on tool function type
        let testResult, status;
        switch (id) {
            case "auto_response":
                testResult =
                    "Test response generated successfully for: " +
                    (test_input || "Hello, how can I help you?");
                status = "success";
                break;
            case "sentiment_analysis":
                testResult = "Sentiment: Positive (0.85 confidence)";
                status = "success";
                break;
            case "intent_classification":
                testResult = "Intent: General Inquiry (0.92 confidence)";
                status = "success";
                break;
            case "lead_scoring":
                testResult = "Lead Score: 75/100 (High Quality Lead)";
                status = "success";
                break;
            case "appointment_scheduler":
                testResult = "Appointment slot found: Tomorrow 2:00 PM";
                status = "success";
                break;
            default:
                testResult = "Tool function executed successfully";
                status = "success";
        }

        const executionTime = Date.now() - startTime;

        res.json({
            success: true,
            data: {
                test_result: testResult,
                execution_time: executionTime,
                status,
                tool_function: {
                    id: toolFunction.id,
                    name: toolFunction.name,
                },
            },
        });
    } catch (error) {
        console.error("Test tool function error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/unanswered-questions:
 *   get:
 *     summary: Get unanswered questions for insights
 *     tags: [Business Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [unresolved, resolved, all]
 *           default: unresolved
 *         description: Filter by status
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
 *                   type: object
 *                   properties:
 *                     questions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/UnansweredQuestion'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", verifyFirebaseToken, async (req, res) => {
    try {
        const { page = 1, limit = 20, status = "unresolved" } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const business = await Business.findOne({
            where: { owner_id: req.user.id },
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        // Build where clause
        const whereClause = { business_id: business.id };
        if (status !== "all") {
            whereClause.is_resolved = status === "resolved";
        }

        const { count, rows: questions } =
            await UnansweredQuestion.findAndCountAll({
                where: whereClause,
                order: [["created_at", "DESC"]],
                limit: parseInt(limit),
                offset,
            });

        const totalPages = Math.ceil(count / parseInt(limit));

        res.json({
            success: true,
            data: {
                questions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: totalPages,
                    has_next: parseInt(page) < totalPages,
                    has_previous: parseInt(page) > 1,
                },
            },
        });
    } catch (error) {
        console.error("Get unanswered questions error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

/**
 * @swagger
 * /api/unanswered-questions/{id}/resolve:
 *   put:
 *     summary: Mark question as resolved
 *     tags: [Business Settings]
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
 *             type: object
 *             properties:
 *               resolution_notes:
 *                 type: string
 *                 description: Notes about how the question was resolved
 *               create_faq:
 *                 type: boolean
 *                 description: Whether to create an FAQ from this question
 *               faq_data:
 *                 type: object
 *                 description: FAQ data if create_faq is true
 *                 properties:
 *                   answer:
 *                     type: string
 *                   category:
 *                     type: string
 *     responses:
 *       200:
 *         description: Question marked as resolved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UnansweredQuestion'
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id/resolve", verifyFirebaseToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution_notes, create_faq = false, faq_data } = req.body;

        const business = await Business.findOne({
            where: { owner_id: req.user.id },
        });

        if (!business) {
            return res.status(404).json({
                success: false,
                error: "Business not found",
                code: "BUSINESS_NOT_FOUND",
            });
        }

        const question = await UnansweredQuestion.findOne({
            where: { id, business_id: business.id },
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                error: "Question not found",
                code: "QUESTION_NOT_FOUND",
            });
        }

        // Update question as resolved
        await question.update({
            is_resolved: true,
            resolution_notes,
            resolved_at: new Date(),
        });

        // Create FAQ if requested
        if (create_faq && faq_data && faq_data.answer) {
            const { FaqItem } = require("../models");
            await FaqItem.create({
                business_id: business.id,
                question: question.question,
                answer: faq_data.answer,
                category: faq_data.category || "general",
                language_code: "en",
                is_active: true,
                usage_count: 0,
                success_rate: null,
            });
        }

        res.json({
            success: true,
            data: question,
        });
    } catch (error) {
        console.error("Resolve question error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            code: "INTERNAL_ERROR",
        });
    }
});

module.exports = router;
